from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.schemas.fonctionnel_scan.functional_report_details import FunctionalReportDetailsCreate, FunctionalReportDetailsRead
from app.schemas.report.authentication_details import AuthenticationDetailsCreate, AuthenticationDetailsRead
from app.schemas.security_scan.security_report_details import SecurityReportDetailsCreate, SecurityReportDetailsRead
from app.schemas.seo_scan.details_seo_report import SEOReportDetailsCreate, SEOReportDetailsRead
from app.schemas.user import UserReadNested

class ReportBase(BaseModel):
    user_id: int
    scan_type: Optional[str]
    authentification: Optional[bool]
    schedule_scan: Optional[bool]
    scan_started_at: Optional[datetime]
    scan_finished_at: Optional[datetime]
    url: Optional[str]
    status: Optional[str] = "running"
    progression: Optional[float]

class ReportCreate(ReportBase):
    authentication_details: Optional[AuthenticationDetailsCreate]
    security_details: Optional[SecurityReportDetailsCreate]
    seo_details: Optional[SEOReportDetailsCreate]
    functional_details: Optional[FunctionalReportDetailsCreate]

class ReportRead(ReportBase):
    id: int
    authentication_details: Optional[AuthenticationDetailsRead]
    security_details: Optional[SecurityReportDetailsRead]
    seo_details: Optional[SEOReportDetailsRead]
    functional_details: Optional[FunctionalReportDetailsRead]

    class Config:
        from_attributes = True

class ReportSecurityRead(ReportBase):
    id: int
    authentication_details: Optional[AuthenticationDetailsRead]
    security_details: Optional[SecurityReportDetailsRead]

    class Config:
        from_attributes = True

class ReportSeoRead(ReportBase):
    id: int
    authentication_details: Optional[AuthenticationDetailsRead]
    seo_details: Optional[SEOReportDetailsRead]

    class Config:
        from_attributes = True
    
class ReportFunctionalRead(ReportBase):
    id: int
    authentication_details: Optional[AuthenticationDetailsRead]
    functional_details: Optional[FunctionalReportDetailsRead]

    class Config:
        from_attributes = True

class ReportAdminRead(BaseModel):
    id: int
    scan_type: str
    schedule_scan: bool
    scan_started_at: Optional[datetime]
    scan_finished_at: Optional[datetime]
    url: str
    status: str
    user: UserReadNested 
    
    class Config:
        from_attributes = True