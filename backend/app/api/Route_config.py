from fastapi import APIRouter
from app.configuration.configuration_manager import jira_configurator, slack_configurator, email_configurator
from app.models.data_models import SlackConfigRequest, JiraConfigRequest, ScanEmailConfig

router = APIRouter(tags=["config"])

@router.post("/config_slack/")
def configure_slack(slack_config: SlackConfigRequest):
    return slack_configurator.configure_slack(slack_config)

@router.post("/config_jira/")
def configure_jira(jira_config: JiraConfigRequest):
    jira_configurator.configure_jira(jira_config)
    return {"message": "Jira configuration successful!"}

@router.post("/config_emails/")
async def configure_emails(emails: ScanEmailConfig):
    return email_configurator.configure_emails(emails)