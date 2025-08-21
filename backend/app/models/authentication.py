from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base

class AuthenticationDetails(Base):
    __tablename__ = 'authentication_details'

    id = Column(Integer, primary_key=True)
    report_id = Column(Integer, ForeignKey('reports.id'), unique=True, nullable=False)
    login_page_url = Column(String, nullable=True)
    cookies = Column(String, nullable=True)
    username = Column(String, nullable=True)
    password = Column(String, nullable=True)
    token = Column(String, nullable=True)

    report = relationship("Report", back_populates="authentication_details")