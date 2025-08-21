import os
from dotenv import load_dotenv

load_dotenv()
class SMTPConfig:
    def __init__(self, username, password, port, server):
        self.username = username
        self.password = password
        self.port = port
        self.server = server

smtp_config = SMTPConfig(
    username=os.getenv("SMTP_USERNAME"),
    password= os.getenv("SMTP_PASSWORD"),
    port=int(os.getenv("SMTP_PORT", 465)),
    server=os.getenv("SMTP_SERVER")
)
