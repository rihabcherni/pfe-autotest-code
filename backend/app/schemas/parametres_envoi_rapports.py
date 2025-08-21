from pydantic import BaseModel, EmailStr
from typing import List, Optional

class ParametresEnvoiRapportsBase(BaseModel):
    liste_emails: List[EmailStr] = []
    slack_token: Optional[str] = None
    slack_channel_id: Optional[str] = None
    jira_cle_projet: Optional[str] = None
    jira_domain: Optional[str] = None
    jira_board: Optional[str] = None
    jira_email: Optional[EmailStr] = None
    jira_token: Optional[str] = None
    report_types: List[str] = []
    report_formats: List[str] = []

class ParametresEnvoiRapportsCreate(ParametresEnvoiRapportsBase):
    user_id: int

class ParametresEnvoiRapportsUpdate(ParametresEnvoiRapportsBase):
    pass

class ParametresEnvoiRapportsOut(ParametresEnvoiRapportsBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True
