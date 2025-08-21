import calendar
from collections import defaultdict
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from matplotlib.dates import relativedelta
from app.configuration.auth_bearer import get_current_user
from app.database.database import get_session
from app.models.functional import FunctionalReportDetails, Workflow
from app.models.report import Report
from app.models.security import SecurityReportDetails
from app.models.seo import SEOReportDetails
from app.models.user import User

router = APIRouter(tags=["Tester-dashboard"])

@router.get("/tester/stats/overview")
def get_overview_stats_tester(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    user_id = current_user.id
    
    total_workflows = (
        db.query(Workflow)
        .join(FunctionalReportDetails, Workflow.functional_report_id == FunctionalReportDetails.id)
        .join(Report, FunctionalReportDetails.report_id == Report.id)
        .filter(Report.user_id == user_id)
        .count()
    )
    
    total_reports = db.query(Report).filter(Report.user_id == user_id).count()

    total_seo_scans = db.query(Report).filter(Report.user_id == user_id, Report.scan_type == "seo").count()
    total_functional_scans = db.query(Report).filter(Report.user_id == user_id, Report.scan_type == "functional").count()
    total_security_scans = db.query(Report).filter(Report.user_id == user_id, Report.scan_type == "security").count()

    total_running_scans = db.query(Report).filter(Report.user_id == user_id, Report.status == "running").count()
    total_completed_scans = db.query(Report).filter(Report.user_id == user_id, Report.status == "completed").count()
    total_failed_scans = db.query(Report).filter(Report.user_id == user_id, Report.status == "failed").count()
    total_canceled_scans = db.query(Report).filter(Report.user_id == user_id, Report.status == "canceled").count()
    total_queued_scans = db.query(Report).filter(Report.user_id == user_id, Report.status == "queued").count()

    scores = db.query(SEOReportDetails.average_score).join(Report).filter(Report.user_id == user_id).all()
    average_score = sum(s[0] for s in scores if s[0]) / len(scores) if scores else 0

    successful_workflows = (
        db.query(Workflow)
        .join(FunctionalReportDetails, Workflow.functional_report_id == FunctionalReportDetails.id)
        .join(Report, FunctionalReportDetails.report_id == Report.id)
        .filter(Report.user_id == user_id, Workflow.statut == "passed")
        .count()
    )
    
    failed_workflows = (
        db.query(Workflow)
        .join(FunctionalReportDetails, Workflow.functional_report_id == FunctionalReportDetails.id)
        .join(Report, FunctionalReportDetails.report_id == Report.id)
        .filter(Report.user_id == user_id, Workflow.statut == "failed")
        .count()
    )

    pending_workflows = (
        db.query(Workflow)
        .join(FunctionalReportDetails, Workflow.functional_report_id == FunctionalReportDetails.id)
        .join(Report, FunctionalReportDetails.report_id == Report.id)
        .filter(Report.user_id == user_id, Workflow.statut == "pending")
        .count()
    )

    total = db.query(func.sum(
        SecurityReportDetails.total_High +
        SecurityReportDetails.total_Medium +
        SecurityReportDetails.total_Low +
        SecurityReportDetails.total_Informational
    )).join(Report).filter(Report.user_id == user_id).scalar() or 0

    total_vulnerabilites = db.query(func.sum(SecurityReportDetails.number_vulnerabilities)).join(Report).filter(Report.user_id == user_id).scalar() or 0
    total_high = db.query(func.sum(SecurityReportDetails.total_High)).join(Report).filter(Report.user_id == user_id).scalar() or 0
    total_medium = db.query(func.sum(SecurityReportDetails.total_Medium)).join(Report).filter(Report.user_id == user_id).scalar() or 0
    total_low = db.query(func.sum(SecurityReportDetails.total_Low)).join(Report).filter(Report.user_id == user_id).scalar() or 0
    total_info = db.query(func.sum(SecurityReportDetails.total_Informational)).join(Report).filter(Report.user_id == user_id).scalar() or 0
    total_other = total_vulnerabilites - total

    return {
        "reports": {
            "total": total_reports,
            "by_type": {
                "seo": total_seo_scans,
                "functional": total_functional_scans,
                "security": total_security_scans,
            },
            "by_status": {
                "running": total_running_scans,
                "completed": total_completed_scans,
                "failed": total_failed_scans,
                "canceled": total_canceled_scans,
                "queued": total_queued_scans,
            },
        },
        "seo": {
            "average_score": round(average_score, 2),
        },
        "functional": {
            "total": total_workflows,
            "success": successful_workflows,
            "fail": failed_workflows,
            "pending": pending_workflows,
        },
        "security": {
            "total_vulnerabilities_reports": total_vulnerabilites,
            "by_risk": {
                "high": total_high,
                "medium": total_medium,
                "low": total_low,
                "informational": total_info,
                "other": total_other,
            }
        }
    }

@router.get("/tester/stats/vulnerabilities-by-period")
def get_vulnerabilities_by_period_tester(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    now = datetime.utcnow()
    user_id = current_user.id
    
    day_labels = [(now - timedelta(days=i)).date() for i in reversed(range(7))]
    week_labels = [(now - timedelta(weeks=i)).isocalendar()[1] for i in reversed(range(4))]
    month_labels = []
    current_month = now.replace(day=1)
    for i in reversed(range(12)):
        month_date = current_month - relativedelta(months=i)
        month_labels.append(month_date.month)
    
    years_from_db = db.query(func.extract('year', SecurityReportDetails.created_at).label("year")) \
        .join(Report, SecurityReportDetails.report_id == Report.id) \
        .filter(Report.user_id == user_id) \
        .distinct().order_by(func.extract('year', SecurityReportDetails.created_at).desc()).all()
    year_labels = [int(y.year) for y in years_from_db] or [now.year]
    
    vulns = db.query(
        SecurityReportDetails.total_High,
        SecurityReportDetails.total_Medium,
        SecurityReportDetails.total_Low,
        SecurityReportDetails.total_Informational,
        SecurityReportDetails.number_vulnerabilities,
        SecurityReportDetails.created_at
    ).join(Report, SecurityReportDetails.report_id == Report.id) \
     .filter(Report.user_id == user_id).all()
    
    counts = {
        "day": [0, 0, 0, 0, 0],
        "week": [0, 0, 0, 0, 0],
        "month": [0, 0, 0, 0, 0],
        "year": [0, 0, 0, 0, 0],
        "all": [0, 0, 0, 0, 0],
    }
    
    for high, medium, low, info, total, created_at in vulns:
        if not created_at:
            continue
            
        high = high or 0
        medium = medium or 0
        low = low or 0
        info = info or 0
        total = total or 0
        other = max(0, total - (high + medium + low + info))
        vuln_counts = [high, medium, low, info, other]
        
        date = created_at.date()
        week = created_at.isocalendar()[1]
        month = created_at.month
        year = created_at.year
        
        if date in day_labels:
            for i in range(5):
                counts["day"][i] += vuln_counts[i]
        if week in week_labels:
            for i in range(5):
                counts["week"][i] += vuln_counts[i]
        if month in month_labels:
            for i in range(5):
                counts["month"][i] += vuln_counts[i]
        if year in year_labels:
            for i in range(5):
                counts["year"][i] += vuln_counts[i]
        for i in range(5):
            counts["all"][i] += vuln_counts[i]
    
    return {
        "labels": {
            "day": [d.isoformat() for d in day_labels],
            "week": [f"Week {w}" for w in week_labels],
            "month": [calendar.month_name[m] for m in month_labels],
            "year": [str(y) for y in year_labels],
        },
        "vulnerabilitiesData": {
            "high": {k: v[0] for k, v in counts.items()},
            "medium": {k: v[1] for k, v in counts.items()},
            "low": {k: v[2] for k, v in counts.items()},
            "informational": {k: v[3] for k, v in counts.items()},
            "other": {k: v[4] for k, v in counts.items()},
        }
    }

@router.get("/tester/stats/reports-by-period")
def get_reports_by_period_tester(db: Session = Depends(get_session),current_user: User = Depends(get_current_user)):
    now = datetime.utcnow()
    user_id = current_user.id
    day_labels = [(now - timedelta(days=i)).date() for i in reversed(range(7))]
    week_labels = [(now - timedelta(weeks=i)).isocalendar()[1] for i in reversed(range(4))]
    month_labels = [(now.replace(day=1) - relativedelta(months=i)).month for i in reversed(range(12))]
    years_from_db = db.query(func.extract('year', Report.scan_started_at).label("year")).filter(Report.user_id == user_id) \
        .distinct().order_by(func.extract('year', Report.scan_started_at).desc()).all()
    year_labels = [int(y.year) for y in years_from_db] or [now.year]
    reports = db.query(Report.scan_type, Report.scan_started_at).filter(Report.user_id == user_id).all()
    counts = {
        "day": defaultdict(lambda: defaultdict(int)),
        "week": defaultdict(lambda: defaultdict(int)),
        "month": defaultdict(lambda: defaultdict(int)),
        "year": defaultdict(lambda: defaultdict(int)),
        "all": defaultdict(int),
    }
    for scan_type, created_at in reports:
        if not created_at:
            continue
        date = created_at.date()
        week = created_at.isocalendar()[1]
        month = created_at.month
        year = created_at.year
        if date in day_labels:
            counts["day"][scan_type][date] += 1
            counts["day"]["all"][date] += 1
        if week in week_labels:
            counts["week"][scan_type][week] += 1
            counts["week"]["all"][week] += 1
        if month in month_labels:
            counts["month"][scan_type][month] += 1
            counts["month"]["all"][month] += 1
        if year in year_labels:
            counts["year"][scan_type][year] += 1
            counts["year"]["all"][year] += 1
        counts["all"][scan_type] += 1
        counts["all"]["all"] += 1
    return {
        "labels": {
            "day": [str(d) for d in day_labels],
            "week": week_labels,
            "month": [calendar.month_abbr[m] for m in month_labels],
            "year": year_labels,
        },
        "data": {
            "day": counts["day"],
            "week": counts["week"],
            "month": counts["month"],
            "year": counts["year"],
            "all": counts["all"],
        }
    }