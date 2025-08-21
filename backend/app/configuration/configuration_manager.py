
from fastapi import HTTPException
from Crypto.Cipher import AES
import base64
from app.models.data_models import SlackConfigRequest, JiraConfigRequest, ScanEmailConfig

class ConfiguratorBase:
    def decrypt_token(self, encrypted_token: str, encryption_key: str, iv: str) -> str:
        try:
            encryption_key_bytes = bytes.fromhex(encryption_key)
            iv_bytes = bytes.fromhex(iv)
            cipher = AES.new(encryption_key_bytes, AES.MODE_CBC, iv_bytes)
            decrypted_bytes = cipher.decrypt(base64.b64decode(encrypted_token))
            decrypted_token = decrypted_bytes.rstrip(b"\x10").decode("utf-8")
            return decrypted_token
        except Exception as e:
            print("Error decrypting token:", e)
            raise HTTPException(status_code=422, detail="Invalid data provided")

class SlackConfigurator(ConfiguratorBase):
        def __init__(self):
            self.slack_token = None
            self.slack_channel_id = None

        def configure_slack(self, slack_config: SlackConfigRequest):
            try:
                print(f"Received Slack Config: {slack_config}")
                self.slack_token = self.decrypt_token(slack_config.encryptedToken, slack_config.encryptionKey,
                                                      slack_config.iv)
                self.slack_channel_id = slack_config.channel_id
                print(f"Decrypted Slack Token: {self.slack_token}")
                return {"message": "Slack configuration successful!"}
            except Exception as e:
                print("Error configuring Slack:", e)
                raise HTTPException(status_code=422, detail="Invalid data provided")

class JiraConfigurator(ConfiguratorBase):
    def configure_jira(self, jira_config: JiraConfigRequest):
        try:
            self.jira_email = jira_config.JIRA_EMAIL
            self.jira_token = self.decrypt_token(jira_config.encryptedToken, jira_config.encryptionKey, jira_config.iv)
            self.jira_domain = jira_config.JIRA_DOMAIN
            self.jira_project_key = jira_config.JIRA_PROJECT_KEY
            self.jira_board = jira_config.JIRA_BOARD

            if not all([self.jira_email, self.jira_token, self.jira_domain, self.jira_project_key, self.jira_board]):
                raise HTTPException(status_code=422, detail="Missing one or more Jira configuration parameters")

            print(f"Decrypted Jira Token: {self.jira_token}")
            print(f"Jira Config: email={self.jira_email}, domain={self.jira_domain}, project_key={self.jira_project_key}, board={self.jira_board}")
            return {"message": "Jira configuration successful!"}
        except Exception as e:
            print("Error initializing Jira Configurator:", e)
            raise HTTPException(status_code=422, detail="Invalid data provided")

class EmailConfigurator:
    def __init__(self):
        self.scan_emails = []

    def configure_emails(self, emails: ScanEmailConfig):
        self.scan_emails = emails.emails
        print(f"Configured emails: {self.scan_emails}")
        return {"message": "Emails configured for receiving scan reports."}

slack_configurator = SlackConfigurator()
jira_configurator = JiraConfigurator()
email_configurator = EmailConfigurator()