import os
import smtplib
import ssl
import asyncio
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import time
import requests
import websockets
from fastapi import HTTPException
from requests.auth import HTTPBasicAuth
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from sqlalchemy.orm import Session
from app.configuration.smtp_config import smtp_config
from app.models.notification import Notification
from dotenv import load_dotenv
import json
from jinja2 import Environment, FileSystemLoader
import base64
from app.models.parametres_envoi_rapports import ParametresEnvoiRapports

load_dotenv()

class Notifier:
    def __init__(self):
        self.websocket_base_url = "ws://localhost:8001/ws"

    def extract_context_from_report(self, report_path: str) -> dict:
        if not os.path.exists(report_path):
            print(f"⚠️ Rapport introuvable à {report_path}")
            return {}

        with open(report_path, "r", encoding="utf-8") as file:
            data = json.load(file)

        details = data.get("details", {})
        return {
            "target_url": details.get("url", "Unknown Target"),
            "scan_type": "Security", 
            "start_time": details.get("start_scan_date", "Unknown"),
            "end_time": details.get("last_scan_date", "Unknown"),
            "duration": details.get("scan_duration", "N/A"),
            "high_count": details.get("total_High", 0),
            "medium_count": details.get("total_Medium", 0),
            "low_count": details.get("total_Low", 0),
            "info_count": details.get("total_Informational", 0),
            "dashboard_url": os.getenv("FRONT_LINK", "") + "tester/dashboard",
        }
    async def send_ws_message(self, message: str, notif_type: str = "info", user_id: int = 0):
        try:
            websocket_url = f"{self.websocket_base_url}/{user_id}"
            payload = json.dumps({
                "message": message,
                "type": notif_type,
                "user_id": user_id,
                "created_at": None
            })
            async with websockets.connect(websocket_url) as websocket:
                await websocket.send(payload)
        except Exception as e:
            print(f"WebSocket error for user {user_id}: {e}")

    def send_to_websocket(self, message: str, db: Session, user_id: int, notif_type: str = "info"):
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(self.send_ws_message(message, notif_type, user_id))
        except Exception as e:
            print(f"Failed to send WebSocket message to user {user_id}: {e}")
        finally:
            loop.close()

        try:
            notification = Notification(message=message, user_id=user_id, type=notif_type)
            db.add(notification)
            db.commit()
            db.refresh(notification)
        except Exception as e:
            print(f"Failed to save notification to database for user {user_id}: {e}")
            db.rollback()

    def send_info(self, message: str, db: Session, user_id: int):
        self.send_to_websocket(message, db, user_id, "info")

    def send_success(self, message: str, db: Session, user_id: int):
        self.send_to_websocket(message, db, user_id, "success")

    def send_warning(self, message: str, db: Session, user_id: int):
        self.send_to_websocket(message, db, user_id, "warning")

    def send_error(self, message: str, db: Session, user_id: int):
        self.send_to_websocket(message, db, user_id, "error")

    def send_progress(self, message: str, db: Session, user_id: int):
        self.send_to_websocket(message, db, user_id, "progression")

    def send_message_to_slack(self, token, channel_id, message, details_url=None, file=None):
        ssl_context = ssl.create_default_context()
        client = WebClient(token=token, timeout=30, ssl=ssl_context)
        try:
            if file and os.path.exists(file):
                with open(file, "rb") as file_obj:
                    response = client.files_upload_v2(
                        file=file_obj,
                        title="Test upload",
                        channel=channel_id,
                        initial_comment=message
                    )
            else:
                if details_url:
                    blocks = [
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": message
                            }
                        },
                        {
                            "type": "actions",
                            "elements": [
                                {
                                    "type": "button",
                                    "text": {
                                        "type": "plain_text",
                                        "text": "Détails"
                                    },
                                    "url": details_url,
                                    "action_id": "button-details"
                                }
                            ]
                        }
                    ]
                    response = client.chat_postMessage(channel=channel_id, blocks=blocks)
                else:
                    response = client.chat_postMessage(channel=channel_id, text=message)
            print("Slack message sent successfully!")
            return response
        except SlackApiError as e:
            print(f"Slack API error: {e}")
            return None

    def wait_for_file(self, path, timeout=10):
        for _ in range(timeout):
            if os.path.exists(path):
                return True
            time.sleep(1)
        return False

    def send_email_from_user_config(self, subject: str, body: str, db: Session, user_id: int, attachment_path: str = None):
        param = db.query(ParametresEnvoiRapports).filter_by(user_id=user_id).first()
        if not param:
            print(f"Aucun paramètre d'envoi trouvé pour l'utilisateur {user_id}")
            return
        try:
            sender = smtp_config.username 
            password = smtp_config.password
            server = smtp_config.server
            port = smtp_config.port
            recipients = json.loads(param.liste_emails) if param.liste_emails else []
            attachment_file = os.path.join(attachment_path, "final_report.json")
            if not attachment_file or not self.wait_for_file(attachment_file, timeout=10):
                print(f"❌ Fichier d'attachement introuvable pour l'utilisateur {user_id} après attente : {attachment_file}")
                return

            if not recipients:
                print(f"Aucun destinataire email configuré pour l'utilisateur {user_id}")
                return

            context_data = self.extract_context_from_report(attachment_file)

            from app.models.user import User  # Adapte selon ta structure
            user = db.query(User).filter_by(id=user_id).first()

            self.send_email(
                subject=subject,
                body=body,
                sender=sender,
                recipients=recipients,
                password=password,
                server=server,
                port=port,
                attachment_path=attachment_file,
                users=user,
                verification_code=None,
                extra_context=context_data
            )
        except Exception as e:
            print(f"Erreur lors de l'envoi de l'email pour l'utilisateur {user_id} : {e}")

    def send_results(self, token, channel_id, results, db, user_id):
        param = db.query(ParametresEnvoiRapports).filter_by(user_id=user_id).first()
        token = param.slack_token if param else token
        channel_id = param.slack_channel_id if param else channel_id

        if token and channel_id:
            report_file = os.path.join(results, "final_report.json") 
            if os.path.isfile(report_file):
                self.send_message_to_slack(token, channel_id, None, report_file)
            else:
                print(f"Fichier de rapport introuvable pour Slack : {report_file}")
        else:
            print(f"Slack token ou channel_id manquant pour l'utilisateur {user_id}")

        if smtp_config.username and smtp_config.password and smtp_config.server and smtp_config.port:
            self.send_email_from_user_config(
                subject="Scan Results Report",
                body="Hello PenTesting Team,\n\nPlease find attached the report of the scan results.\n\nBest regards,\nThe PenTesting Team",
                db=db,  
                user_id=user_id,  
                attachment_path=results
            )
        print(results)
        return results

    def send_email(self, subject, body, sender, recipients, password, server, port, attachment_path=None, users=None, verification_code=None, extra_context=None):
        logo_path = "static/images/logo.png"
        base64_image = ""
        if os.path.exists(logo_path):
            with open(logo_path, "rb") as image_file:
                base64_image = "data:image/png;base64," + base64.b64encode(image_file.read()).decode("utf-8")

        name = f"{users.first_name} {users.last_name}" if users else "User"
        template_env = Environment(loader=FileSystemLoader("templates"))
        template = template_env.get_template("email-report.html")

        context = {
            "user_name": name,
            "email": users.email if users else "",
            "code": verification_code,
            "logo": base64_image,
            "front_link": os.getenv("FRONT_LINK", ""),
            "target_url": extra_context.get("target_url", "N/A") if extra_context else "N/A",
            "scan_type": extra_context.get("scan_type", "Full Scan") if extra_context else "Full Scan",
            "start_time": extra_context.get("start_time", "N/A") if extra_context else "N/A",
            "end_time": extra_context.get("end_time", "N/A") if extra_context else "N/A",
            "duration": extra_context.get("duration", "N/A") if extra_context else "N/A",
            "high_count": extra_context.get("high_count", 0) if extra_context else 0,
            "medium_count": extra_context.get("medium_count", 0) if extra_context else 0,
            "low_count": extra_context.get("low_count", 0) if extra_context else 0,
            "info_count": extra_context.get("info_count", 0) if extra_context else 0,
            "dashboard_url": extra_context.get("dashboard_url", "#") if extra_context else "#",
        }

        html_content = template.render(**context)

        msg = MIMEMultipart("alternative")
        msg['Subject'] = subject
        msg['From'] = sender
        msg['To'] = ', '.join(recipients)

        plain_text = f"Hello {name},\n\nYour report is ready. Please view it using a compatible email client."
        msg.attach(MIMEText(plain_text, 'plain'))
        msg.attach(MIMEText(html_content, 'html'))

        if attachment_path and os.path.exists(attachment_path):
            with open(attachment_path, 'rb') as attachment:
                part = MIMEApplication(attachment.read(), Name=os.path.basename(attachment_path))
                part['Content-Disposition'] = f'attachment; filename="{os.path.basename(attachment_path)}"'
                msg.attach(part)

        with smtplib.SMTP_SSL(server, port) as smtp_server:
            smtp_server.login(sender, password)
            smtp_server.sendmail(sender, recipients, msg.as_string())

        print("Email sent with HTML template!")

    def get_all_sprints(self, jira_email, jira_token, jira_domain, jira_board):
        url = f"{jira_domain}/rest/agile/1.0/board/{jira_board}/sprint"
        auth = HTTPBasicAuth(jira_email, jira_token)
        try:
            response = requests.get(url, auth=auth)
            response.raise_for_status()
        except Exception as err:
            print(f"Error getting sprints: {err}")
            raise HTTPException(status_code=500, detail="Failed to get sprints")

        sprints = response.json().get("values", [])
        for sprint in sprints:
            if sprint['state'] == 'active':
                return sprint['id']
        return None

    def create_issue_in_active_sprint(self, jira_email, jira_token, jira_domain, jira_board, jira_project_key, issue_summary, issue_description, issue_type):
        sprint_id = self.get_all_sprints(jira_email, jira_token, jira_domain, jira_board)
        if sprint_id is None:
            raise HTTPException(status_code=404, detail="No active sprints found")

        issue_data = self.create_issue(
            jira_email, jira_token, jira_domain, jira_project_key,
            issue_summary, issue_description, issue_type, sprint_id
        )
        return issue_data['key']

    def create_issue(self, jira_email, jira_token, jira_domain, jira_project_key, issue_summary, issue_description, issue_type, sprint_id):
        url = f"{jira_domain}/rest/api/2/issue"
        auth = HTTPBasicAuth(jira_email, jira_token)
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
        issue_payload = {
            "fields": {
                "project": {"key": jira_project_key},
                "summary": issue_summary,
                "description": issue_description,
                "issuetype": {"name": issue_type},
                "customfield_10020": sprint_id
            }
        }

        try:
            response = requests.post(url, json=issue_payload, auth=auth, headers=headers)
            response.raise_for_status()
        except Exception as err:
            print(f"Error creating issue: {err}")
            raise HTTPException(status_code=500, detail="Failed to create issue")

        return response.json()

    def attach_report_to_issue(self, jira_email, jira_token, jira_domain, issue_key, filename):
        url = f"{jira_domain}/rest/api/2/issue/{issue_key}/attachments"
        headers = {"X-Atlassian-Token": "no-check"}
        auth = HTTPBasicAuth(jira_email, jira_token)

        try:
            with open(filename, "rb") as file:
                files = {"file": (filename, file, "application/json")}
                response = requests.post(url, headers=headers, auth=auth, files=files)

                if response.status_code != 200:
                    try:
                        error_message = response.json()
                    except Exception:
                        error_message = response.content.decode()
                    raise Exception(f"Failed to attach file: {error_message}")

                print(f"File attached successfully to issue {issue_key}")
        except Exception as e:
            print(f"Error attaching file: {str(e)}")
            raise
