from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class SlackConfigRequest(BaseModel):
    encryptedToken: str
    channel_id: str
    encryptionKey: str
    iv: str

class ScanEmailConfig(BaseModel):
    emails: List[str]

class JiraConfigRequest(BaseModel):
    JIRA_EMAIL: str
    encryptedToken: str
    JIRA_DOMAIN: str
    JIRA_PROJECT_KEY: str
    JIRA_BOARD: str
    encryptionKey: str
    iv: str

class ScanRequest(BaseModel):
    url: str
    scan_tools: List[str] 
    username: Optional[str] = None  
    password: Optional[str] = None  
    token_auth: Optional[str] = None     
    cookies: Optional[str] = None   
    scan_time: Optional[datetime] = datetime.now()