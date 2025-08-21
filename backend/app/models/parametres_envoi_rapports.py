from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base
import json

class ParametresEnvoiRapports(Base):
    __tablename__ = "parametres_envoi_rapports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    liste_emails = Column(String)  # Stocké en JSON
    slack_token = Column(String, nullable=True)
    slack_channel_id = Column(String, nullable=True)

    jira_cle_projet = Column(String, nullable=True)
    jira_domain = Column(String, nullable=True)
    jira_board = Column(String, nullable=True)
    jira_email = Column(String, nullable=True)
    jira_token = Column(String, nullable=True)

    report_types = Column(String, nullable=True)    # Stocké en JSON
    report_formats = Column(String, nullable=True)  # Stocké en JSON

    user = relationship("User", back_populates="parametres_envoi_rapports", uselist=False)

    def get_report_types(self):
        return json.loads(self.report_types) if self.report_types else []

    def set_report_types(self, types_list):
        self.report_types = json.dumps(types_list)

    def get_report_formats(self):
        return json.loads(self.report_formats) if self.report_formats else []

    def set_report_formats(self, formats_list):
        self.report_formats = json.dumps(formats_list)
