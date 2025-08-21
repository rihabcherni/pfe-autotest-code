from pydantic import BaseModel
from enum import Enum
from typing import Any, Dict, Optional
from datetime import datetime

class StatutEnum(str, Enum):
    passed = "passed"
    failed = "failed"
    pending = "pending"

class StepTestBase(BaseModel):
    ordre_execution: int
    title: str
    description: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None
    test_case_id: int

    class Config:
        from_attributes = True  

class StepTestCreate(StepTestBase):
    statut: StatutEnum = StatutEnum.pending  

class StepTestRead(StepTestBase):
    id: int
    title: str
    statut: StatutEnum
    date_debut: datetime
    date_fin: Optional[datetime] = None
    error_message: Optional[str] = None
    screenshot_path: Optional[str] = None

    class Config:
        from_attributes = True
        from_attributes = True
