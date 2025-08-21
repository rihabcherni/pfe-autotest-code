from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from .test_case import TestCaseCreate, TestCaseRead, StatutEnum

class WorkflowBase(BaseModel):
    title: str
    description: Optional[str] = None
    class Config:
        from_attributes = True

class WorkflowCreate(WorkflowBase):
    functional_report_id: int
    test_cases: List[TestCaseCreate] = []

class WorkflowRead(WorkflowBase):
    id: int
    functional_report_id: int
    statut: StatutEnum
    date_debut: datetime
    date_fin: Optional[datetime] = None  
    test_cases: List[TestCaseRead] = []  
    class Config:
        from_attributes = True
