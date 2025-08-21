from sqlalchemy import JSON, Column, DateTime, Integer, String, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.database import Base

class SecurityReportDetails(Base):
    __tablename__ = 'security_report_details'

    id = Column(Integer, primary_key=True)
    report_id = Column(Integer, ForeignKey('reports.id'), unique=True, nullable=False)
    number_vulnerabilities = Column(Integer)
    total_High = Column(Integer)
    total_Medium = Column(Integer)
    total_Low = Column(Integer)
    total_Informational = Column(Integer)
    tools_used = Column(String)
    host_metadata = Column(JSON)

    report = relationship("Report", back_populates="security_details")
    categories = relationship("VulnerabilityCategory", back_populates="security_report", cascade="all, delete-orphan")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class VulnerabilityCategory(Base):
    __tablename__ = 'vulnerability_categories'

    id = Column(Integer, primary_key=True)
    security_report_id = Column(Integer, ForeignKey('security_report_details.id'), nullable=False)
    title = Column(String)
    total = Column(Integer)
    risk = Column(String)
    details = Column(String)
    tools = Column(String)

    security_report = relationship("SecurityReportDetails", back_populates="categories")
    vulnerabilities = relationship("Vulnerability", back_populates="category", cascade="all, delete-orphan")

class Vulnerability(Base):
    __tablename__ = 'vulnerabilities'

    id = Column(Integer, primary_key=True)
    category_id = Column(Integer, ForeignKey('vulnerability_categories.id'), nullable=False)
    url = Column(String)
    method = Column(String)
    parameters = Column(String)
    attack = Column(String)
    real_name = Column(String)
    detected_by = Column(String)
    confidence = Column(String)
    confidence_score = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    category = relationship("VulnerabilityCategory", back_populates="vulnerabilities")
