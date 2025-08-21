import enum
from sqlalchemy import Column, Enum, Integer, String, ForeignKey, DateTime, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base

class StatutEnum(str, enum.Enum):
    passed = "passed"
    failed = "failed"
    pending = "pending"

class FunctionalReportDetails(Base):
    __tablename__ = 'functional_report_details'

    id = Column(Integer, primary_key=True)
    report_id = Column(Integer, ForeignKey('reports.id'), unique=True, nullable=False)
    message_result = Column(Text, nullable=True)
    project_name= Column(String, nullable=False)
    report = relationship("Report", back_populates="functional_details")
    workflows = relationship("Workflow", back_populates="functional_report", cascade="all, delete-orphan")

class Workflow(Base):
    __tablename__ = 'workflows'

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    statut = Column(Enum(StatutEnum), nullable=False, default=StatutEnum.pending)
    date_debut = Column(DateTime, default=datetime.utcnow)
    date_fin = Column(DateTime, nullable=True)

    functional_report_id = Column(Integer, ForeignKey("functional_report_details.id"), nullable=False)
    functional_report = relationship("FunctionalReportDetails", back_populates="workflows")

    test_cases = relationship("TestCase", back_populates="workflow", cascade="all, delete-orphan")

class TestCase(Base):
    __tablename__ = 'test_cases'
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    ordre_execution = Column(Integer, nullable=False)
    statut = Column(Enum(StatutEnum), nullable=False, default=StatutEnum.pending)
    date_debut = Column(DateTime, default=datetime.utcnow)
    date_fin = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)

    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=False)
    workflow = relationship("Workflow", back_populates="test_cases")

    step_tests = relationship("StepTest", back_populates="test_case", cascade="all, delete-orphan")

class StepTest(Base):
    __tablename__ = 'step_tests'

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    ordre_execution = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    settings = Column(JSON, nullable=True)
    statut = Column(Enum(StatutEnum), nullable=False, default=StatutEnum.pending)
    date_debut = Column(DateTime, default=datetime.utcnow)
    date_fin = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    screenshot_path = Column(String, nullable=True)

    test_case_id = Column(Integer, ForeignKey("test_cases.id"), nullable=False)
    test_case = relationship("TestCase", back_populates="step_tests")
