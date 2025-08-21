from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from .step_test import StepTestCreate, StepTestRead, StatutEnum

class TestCaseBase(BaseModel):
    title: str
    ordre_execution: int

    class Config:
        from_attributes = True

class TestCaseCreate(TestCaseBase):
    step_tests: List[StepTestCreate] = []  
    workflow_id:int

class TestCaseRead(TestCaseBase):
    id: int
    workflow_id: int
    statut: StatutEnum
    date_debut: datetime
    date_fin: Optional[datetime] = None
    error_message: Optional[str] = None
    step_tests: List[StepTestRead] = []

    class Config:
        from_attributes = True
