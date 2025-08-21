from datetime import datetime
import os
import time
import threading
from fastapi import APIRouter, HTTPException, Depends
import json
from sqlalchemy.orm import Session
from app.configuration.auth_bearer import get_current_user
from app.configuration.configuration_manager import jira_configurator, slack_configurator, email_configurator
from app.database.database import get_session
from app.models.data_models import ScanRequest
from app.models.user import User
from app.services.pentesting_tests.scan_functions.scan_thread import ThreadScan
import json
from fastapi import status
import pika

with open("setting.json") as setting_file:
    setting = json.load(setting_file)

router = APIRouter(tags=["security-scan"])

def get_jira_config():
    return {
        "jira_email": getattr(jira_configurator, 'jira_email', None),
        "jira_token": getattr(jira_configurator, 'jira_token', None),
        "jira_domain": getattr(jira_configurator, 'jira_domain', None),
        "jira_board": getattr(jira_configurator, 'jira_board', None),
        "jira_project_key": getattr(jira_configurator, 'jira_project_key', None)
    }
def connect_to_rabbitmq(max_retries=10, delay=5):
    rabbitmq_host = os.getenv('RABBITMQ_HOST', 'localhost')
    rabbitmq_user = os.getenv('RABBITMQ_USER', 'user')
    rabbitmq_pass = os.getenv('RABBITMQ_PASS', 'pass')
    rabbitmq_port = int(os.getenv('RABBITMQ_PORT', '5672'))
    
    print(f"🔍 Tentative de connexion à RabbitMQ: {rabbitmq_host}:{rabbitmq_port}")
    print(f"   Utilisateur: {rabbitmq_user}")
    
    for i in range(max_retries):
        try:
            credentials = pika.PlainCredentials(rabbitmq_user, rabbitmq_pass)
            parameters = pika.ConnectionParameters(
                host=rabbitmq_host, 
                port=rabbitmq_port, 
                credentials=credentials,
                heartbeat=600,
                blocked_connection_timeout=300,
                # Add connection timeout
                socket_timeout=10,
                connection_attempts=3,
                retry_delay=2
            )
            connection = pika.BlockingConnection(parameters)
            print(f"✅ Connexion RabbitMQ réussie sur {rabbitmq_host}:{rabbitmq_port}")
            return connection
        except pika.exceptions.AMQPConnectionError as e:
            print(f"❌ Connexion échouée à RabbitMQ ({rabbitmq_host}:{rabbitmq_port}). Tentative {i + 1}/{max_retries}")
            print(f"   Erreur: {e}")
            if i < max_retries - 1:
                time.sleep(delay)
        except Exception as e:
            print(f"❌ Erreur inattendue lors de la connexion RabbitMQ: {e}")
            if i < max_retries - 1:
                time.sleep(delay)
    
    raise Exception(f"⛔ Impossible de se connecter à RabbitMQ ({rabbitmq_host}:{rabbitmq_port}) après {max_retries} tentatives.")


@router.post("/scan/rabbitmq/")
def scan_url(scan_request: ScanRequest, db: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    url = scan_request.url
    user_id = current_user.id
    scan_tools = scan_request.scan_tools
    authentification = bool(scan_request.username or scan_request.password or scan_request.token_auth or scan_request.cookies)
    scanner = ThreadScan(script_dir="/scanner", setting=setting, url=url, scan_tools=scan_tools)
    scanner.create_report_entry(db, user_id, authentification)
    report_id = scanner.report_db_id
    message = {
        "url": url,
        "scan_tools": scan_tools,
        "user_id": user_id,
        "auth": {
            "username": scan_request.username,
            "password": scan_request.password,
            "token_auth": scan_request.token_auth,
            "cookies": scan_request.cookies
        },
        "report_id": report_id
    }
    connection = connect_to_rabbitmq()
    channel = connection.channel()
    channel.queue_declare(queue='scan_queue', durable=True)
    channel.basic_publish(
        exchange='',
        routing_key='scan_queue',
        body=json.dumps(message),
        properties=pika.BasicProperties(delivery_mode=2)
    )
    connection.close()
    return {
        "message": f"Scan task queued for {url}",
        "report_id": report_id
    }

scans_running = {}
def start_scan(scanner, slack_token, slack_channel_id, email_list, jira_config, db, user_id, scan_request):
    authentification = bool(scan_request.username or scan_request.password or scan_request.token_auth or scan_request.cookies)
    scanner.create_report_entry(db, user_id, authentification)  
    report_id = scanner.report_db_id
    thread_scan_instance = scanner
    thread = threading.Thread(target=thread_scan_instance.run_all_scans, args=(
        slack_token, slack_channel_id, email_list,
        jira_config['jira_email'], jira_config['jira_token'],
        jira_config['jira_domain'], jira_config['jira_board'],
        jira_config['jira_project_key'], db, user_id,
        scan_request.username, scan_request.password,
        scan_request.token_auth, scan_request.cookies
    ))
    
    thread.start()
    scans_running[report_id] = thread_scan_instance
    return report_id

@router.post("/scan/")
def scan_url(scan_request: ScanRequest, db: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    url = scan_request.url
    user_id = current_user.id
    scan_tools = scan_request.scan_tools

    scanner = ThreadScan(script_dir="/scanner", setting=setting, url=url, scan_tools=scan_tools)
    jira_config = get_jira_config()

    report_id = start_scan(scanner, slack_configurator.slack_token, slack_configurator.slack_channel_id, 
                           email_configurator.scan_emails, jira_config, db, user_id, scan_request)
    return {
        "message": f"Scan started for URL: {url}",
        "report_id": report_id
    }
@router.post("/scan-automatique")
def scan_url(scan_request: ScanRequest, db: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    url = scan_request.url
    user_id = current_user.id
    scan_time = scan_request.scan_time
    scan_tools = scan_request.scan_tools
    
    if scan_time < datetime.now():
        raise HTTPException(status_code=400, detail=f"Scan time must be in the future: {datetime.now()}")
    
    delay = (scan_time - datetime.now()).total_seconds()
    scanner = ThreadScan(script_dir="/scanner", setting=setting, url=url, scan_tools=scan_tools)

    jira_config = get_jira_config()

    def delayed_scan():
        time.sleep(delay)
        start_scan(scanner, slack_configurator.slack_token, slack_configurator.slack_channel_id,
                   email_configurator.scan_emails, jira_config, db, user_id, scan_request)

    threading.Thread(target=delayed_scan).start()
    return {"message": f"Scan scheduled for URL: {url} at {scan_time} - delay {delay}"}


@router.post("/scan/cancel/{report_id}")
def cancel_scan(report_id: int):
    thread_scan_instance = scans_running.get(report_id)
    if not thread_scan_instance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan non trouvé ou déjà terminé")
    
    thread_scan_instance.stop_event.set()
    return {"message": f"Annulation demandée pour le scan {report_id}"}

@router.get("/scan/wapiti/result")
def get_wapiti_results(db: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    from app.services.pentesting_tests.scan_functions.scan_tools.wapiti_scan import wapiti_scan
    wapiti = wapiti_scan(setting=setting, url=None, report_path="", results_path="")
    try:
        wapiti_results = wapiti.get_wapiti_results(
            slack_configurator.slack_token,
            slack_configurator.slack_channel_id,
            email_configurator.scan_emails,
            db,
            current_user.id  
        )
        if wapiti_results is None or not isinstance(wapiti_results, dict):
            raise HTTPException(status_code=500, detail="Failed to retrieve valid Wapiti results")

        results = format_wapiti_results(wapiti_results)
        return results

    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="No Wapiti test JSON file found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")

def format_wapiti_results(wapiti_results):
    results = []
    for vulnerability, details in wapiti_results.items():
        vulnerability_info = {
            "Type of Vulnerability": vulnerability,
            "Number of Vulnerability": details[0],
            "Vulnerabilities": []
        }
        for detail in details[1]:
            vulnerability_details = {"Details": detail}
            vulnerability_info["Vulnerabilities"].append(vulnerability_details)
        results.append(vulnerability_info)
    return results

@router.get("/scan/owaspzap/result")
def get_zap_results(db: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    from app.services.pentesting_tests.scan_functions.scan_tools.zap_scan import ZAP_scan
    zap = ZAP_scan(setting=None, url=None, report_path="", results_path="")
    try:
        zap_results = zap.owaspzap_get_results(
            slack_configurator.slack_token,
            slack_configurator.slack_channel_id,
            email_configurator.scan_emails,
            db,
            current_user.id
        )
        results = format_zap_results(zap_results)
        return results
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="No ZAP test JSON file found")

def format_zap_results(zap_results):
    results = []
    for vulnerability, details in zap_results.items():
        vulnerability_info = {
            "Type of Vulnerability": vulnerability,
            "Risk Level": details[5][0],
            "Number of Vulnerability": details[0],
            "Vulnerabilities": []
        }
        for method_url, param_attack, description in zip(details[1], details[2], details[3]):
            method, url = method_url
            vulnerability_details = {
                "Method": method,
                "URL": url,
                "Parameters and Attacks": param_attack,
                "Description": description
            }
            vulnerability_info["Vulnerabilities"].append(vulnerability_details)
        results.append(vulnerability_info)
    return results

@router.get("/scan/reportFinal")
def get_all_results(db: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    from app.services.pentesting_tests.scan_functions.scan_tools.zap_scan import ZAP_scan
    zap = ZAP_scan(setting=None, url=None, report_path="", results_path="")
    try:
        zap_results = zap.owaspzap_get_results(
            slack_configurator.slack_token,
            slack_configurator.slack_channel_id,
            email_configurator.scan_emails,
            db,
            current_user.id
        )
        results = format_zap_results(zap_results)
        return results
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="No ZAP test JSON file found")