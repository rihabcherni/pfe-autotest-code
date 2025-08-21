from typing import List, Optional
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.Route_fonctionnel_scan.test_execution_service import TestExecutionService
from app.database.database import get_session
from app.models.functional import FunctionalReportDetails
from app.models.report import Report
from app.schemas.fonctionnel_scan.functional_report_details import FunctionalReportDetailsCreate, FunctionalReportDetailsRead, FunctionalReportDetailsUpdate

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_session
from app.models.functional import FunctionalReportDetails
from app.schemas.fonctionnel_scan.functional_report_details import FunctionalReportDetailsCreate, FunctionalReportDetailsRead
from app.schemas.report.report import ReportFunctionalRead
from app.services.report_service import get_type_reports

router = APIRouter(prefix="/functional-reports", tags=["Functional Reports"])

@router.get("/", response_model=List[ReportFunctionalRead])
def read_functional_reports(user_id: Optional[int] = None, db: Session = Depends(get_session)):
    return get_type_reports(db, scan_type="functional", user_id=user_id)

@router.post("/details/", response_model=FunctionalReportDetailsRead)
def create_functional_report(report_data: FunctionalReportDetailsCreate, db: Session = Depends(get_session)):
    report_obj = db.query(Report).filter_by(id=report_data.report_id).first()
    if not report_obj:
        raise HTTPException(status_code=404, detail=f"Report with id {report_data.report_id} not found")

    if report_obj.scan_type.lower() != "functional":
        raise HTTPException(status_code=400, detail=f"Report {report_data.report_id} is not of type 'functional'")

    existing = db.query(FunctionalReportDetails).filter_by(report_id=report_data.report_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Functional report for report_id {report_data.report_id} already exists")

    new_report = FunctionalReportDetails(
        report_id=report_data.report_id,
        message_result=report_data.message_result,
        project_name= report_data.project_name
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return new_report

@router.get("/details/{functional_report_id}", response_model=FunctionalReportDetailsRead)
def get_functional_report(functional_report_id: int, db: Session = Depends(get_session)):
    report = db.query(FunctionalReportDetails).filter_by(id=functional_report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@router.get("/details", response_model=list[FunctionalReportDetailsRead])
def list_functional_reports(db: Session = Depends(get_session)):
    reports = db.query(FunctionalReportDetails).all()
    return reports

@router.put("/details/{functional_report_id}", response_model=FunctionalReportDetailsRead)
def update_functional_report(functional_report_id: int, updated_data: FunctionalReportDetailsUpdate, db: Session = Depends(get_session)):
    report = db.query(FunctionalReportDetails).filter_by(id=functional_report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Functional report not found")

    report_obj = db.query(Report).filter_by(id=report.report_id).first()
    if not report_obj:
        raise HTTPException(status_code=404, detail=f"Associated report with id {report.report_id} not found")

    if report_obj.scan_type.lower() != "functional":
        raise HTTPException(status_code=400, detail=f"Associated report is not of type 'functional'")

    report.message_result = updated_data.message_result
    report.project_name = updated_data.project_name

    db.commit()
    db.refresh(report)
    return report

@router.delete("/details/{functional_report_id}")
def delete_functional_report(functional_report_id: int, db: Session = Depends(get_session)):
    report = db.query(FunctionalReportDetails).filter_by(id=functional_report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    db.delete(report)
    db.commit()
    return {"detail": f"Report {functional_report_id} deleted successfully"}