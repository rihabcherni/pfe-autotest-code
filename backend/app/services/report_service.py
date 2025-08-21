from typing import Optional
from sqlalchemy import desc
from sqlalchemy.orm import Session
from app.models.authentication import AuthenticationDetails
from app.models.functional import FunctionalReportDetails
from app.models.report import Report
from app.models.security import SecurityReportDetails, Vulnerability, VulnerabilityCategory
from app.models.seo import SEOReportDetails
from app.schemas.report.report import ReportCreate
from sqlalchemy.orm import joinedload

def create_report_db(db: Session, report: ReportCreate):
    report_data = report.model_dump(exclude={
        "authentication_details", 
        "security_details", 
        "seo_details", 
        "functional_details"
    })
    db_report = Report(**report_data)
    db.add(db_report)
    db.flush() 
    if report.authentication_details:
        auth_data = report.authentication_details.model_dump()
        db_auth = AuthenticationDetails(**auth_data, report_id=db_report.id)
        db.add(db_auth)
    
    if report.security_details:
        security_data = report.security_details.model_dump(exclude={"categories"})
        db_security = SecurityReportDetails(**security_data, report_id=db_report.id)
        db.add(db_security)
        db.flush() 

        if hasattr(report.security_details, "categories"):
            for category in report.security_details.categories:
                category_data = category.model_dump(exclude={"vulnerabilities"})
                db_category = VulnerabilityCategory(**category_data, security_report_id=db_security.id)
                db.add(db_category)
                db.flush()  

                if hasattr(category, "vulnerabilities"):
                    for vulnerability in category.vulnerabilities:
                        vuln_data = vulnerability.model_dump()
                        db_vulnerability = Vulnerability(**vuln_data, category_id=db_category.id)
                        db.add(db_vulnerability)
    
    if report.seo_details:
        seo_data = report.seo_details.model_dump()
        db_seo = SEOReportDetails(**seo_data, report_id=db_report.id)
        db.add(db_seo)
    
    if report.functional_details:
        functional_data = report.functional_details.model_dump()
        db_functional = FunctionalReportDetails(**functional_data, report_id=db_report.id)
        db.add(db_functional)
    
    db.commit()
    db.refresh(db_report)
    return db_report

def get_report(db: Session, report_id: int) -> Report | None:
    return db.query(Report).options(
        joinedload(Report.authentication_details),
        joinedload(Report.security_details).joinedload(SecurityReportDetails.categories).joinedload(VulnerabilityCategory.vulnerabilities),
        joinedload(Report.seo_details),
        joinedload(Report.functional_details),
    ).filter(Report.id == report_id).first()

def get_all_reports(db: Session, skip: int = 0, limit: int = 100) -> list[Report]:
    return db.query(Report).offset(skip).limit(limit).all()

def get_type_reports(db: Session, scan_type: Optional[str] = None, user_id: Optional[int] = None):
    query = db.query(Report)
    if scan_type:
        query = query.filter(Report.scan_type == scan_type)
    if user_id:
        query = query.filter(Report.user_id == user_id)
    return query .order_by(desc(Report.scan_started_at)).all()

def delete_report_db(db: Session, report_id: int) -> bool:
    report = db.query(Report).filter(Report.id == report_id).first()
    if report is None:
        return False
    db.delete(report)
    db.commit()
    return True

def get_reports_by_user(user_id: int, db: Session) -> list[Report]:
    return db.query(Report).filter(Report.user_id == user_id).all()

def get_report_by_id_and_user(report_id: int, user_id: int, db: Session) -> Report | None:
    return db.query(Report).filter(
        Report.id == report_id,
        Report.user_id == user_id
    ).first()


def get_all_reports_admin(db: Session):
    return (
        db.query(Report)
        .options(joinedload(Report.user)) 
        .all()
    )