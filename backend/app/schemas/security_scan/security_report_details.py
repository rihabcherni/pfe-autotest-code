from datetime import datetime
from typing import Any, List, Optional
from pydantic import BaseModel

from app.schemas.security_scan.Category import VulnerabilityCategoryCreate, VulnerabilityCategoryRead


class SecurityReportDetailsBase(BaseModel):
    number_vulnerabilities: Optional[int]
    total_High: Optional[int]
    total_Medium: Optional[int]
    total_Low: Optional[int]
    total_Informational: Optional[int]
    tools_used: Optional[str]
    host_metadata: Optional[Any] 
    created_at: Optional[datetime]

class SecurityReportDetailsCreate(SecurityReportDetailsBase):
    categories: List[VulnerabilityCategoryCreate] = []

class SecurityReportDetailsRead(SecurityReportDetailsBase):
    id: int
    categories: List[VulnerabilityCategoryRead] = []

    class Config:
        from_attributes = True


