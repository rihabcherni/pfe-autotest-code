import enum
from sqlalchemy import Boolean, Column, Float, Integer, String, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from app.database.database import Base

class StatutReportEnum(str, enum.Enum):
    running = "running"
    completed = "completed"
    failed = "failed"
    canceled = "canceled"
    queued = "queued"

class Report(Base):
    __tablename__ = 'reports'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    scan_type = Column(String, index=True)
    authentification = Column(Boolean, default=False)
    schedule_scan = Column(Boolean, default=False)
    scan_started_at = Column(DateTime)
    scan_finished_at = Column(DateTime, nullable=True)
    url = Column(String)
    status = Column(Enum(StatutReportEnum), default=StatutReportEnum.running, nullable=False)
    progression = Column(Float, default=0.0) 
    
    user = relationship("User", back_populates="reports")
    authentication_details = relationship("AuthenticationDetails", back_populates="report", uselist=False, cascade="all, delete-orphan")
    security_details = relationship("SecurityReportDetails", back_populates="report", uselist=False, cascade="all, delete-orphan")
    seo_details = relationship("SEOReportDetails", back_populates="report", uselist=False, cascade="all, delete-orphan")
    functional_details = relationship("FunctionalReportDetails", back_populates="report", uselist=False, cascade="all, delete-orphan")