from typing import List, Optional
from pydantic import BaseModel
from app.schemas.fonctionnel_scan.workflow import WorkflowCreate, WorkflowRead

class FunctionalReportDetailsBase(BaseModel):
    message_result: Optional[str] = None
    project_name: str
    workflows: List[WorkflowCreate] = []

class FunctionalReportDetailsCreate(FunctionalReportDetailsBase):
    message_result: Optional[str] = None
    project_name: str

class FunctionalReportDetailsUpdate(FunctionalReportDetailsBase):
    pass  

class FunctionalReportDetailsRead(FunctionalReportDetailsBase):
    id: int
    report_id: int
    message_result: Optional[str] = None
    project_name: str
    workflows: List[WorkflowRead] = []
    class Config:
        from_attributes = True