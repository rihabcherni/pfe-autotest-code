from typing import List, Optional
from pydantic import BaseModel
from app.schemas.security_scan.vulnerability import VulnerabilityCreate, VulnerabilityRead

class VulnerabilityCategoryBase(BaseModel):
    title: Optional[str]
    total: Optional[int]
    risk: Optional[str]
    details: Optional[str]
    tools: Optional[str]

class VulnerabilityCategoryCreate(VulnerabilityCategoryBase):
    vulnerabilities: List[VulnerabilityCreate] = []

class VulnerabilityCategoryRead(VulnerabilityCategoryBase):
    id: int
    vulnerabilities: List[VulnerabilityRead] = []

    class Config:
        from_attributes = True

