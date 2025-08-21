import io
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from jinja2 import Environment, FileSystemLoader
from sqlalchemy.orm import Session
from typing import List

from app.database.database import get_session

from app.models.report import Report
from app.models.seo import SEOCrawledPage, SEOReportDetails
from app.schemas.seo_scan.details_seo_report import SEOReportRequest, SEOReportResponse
from app.services.seo_service import run_seo_analysis

router = APIRouter(tags=["Seo-scan"])


@router.post("/seo-report/user/{user_id}", response_model=SEOReportResponse)
async def create_seo_report(
    user_id: int,
    request: SEOReportRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_session)
):
    new_report = Report(
        user_id=user_id,
        scan_type="seo",
        url=str(request.url),
        status="running"
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    background_tasks.add_task(run_seo_analysis, new_report.id, str(request.url), db)   
    return SEOReportResponse(
        url=str(request.url),
        average_score=0.0,
        server_info={},
        total_pages_analyzed=0,
        crawled_links=[],
        pages=[]
    )

@router.get("/seo-report/{report_id}", response_model=SEOReportResponse)
async def get_seo_report(report_id: int, db: Session = Depends(get_session)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    seo_details = db.query(SEOReportDetails).filter(SEOReportDetails.report_id == report_id).first()
    if not seo_details:
        raise HTTPException(status_code=404, detail="SEO report details not found")
    
    pages = db.query(SEOCrawledPage).filter(SEOCrawledPage.seo_report_id == seo_details.id).all()
    
    response = SEOReportResponse(
        url=report.url,
        average_score=seo_details.average_score,
        server_info={
            "ip": seo_details.server_ip,
            "os": seo_details.server_os,
            "server": seo_details.server_software,
            "backend": seo_details.server_backend,
            "frontend": seo_details.server_frontend,
            "cms": seo_details.server_cms
        },
        total_pages_analyzed=seo_details.total_pages_analyzed,
        crawled_links=[page.url for page in pages],
        screenshot=seo_details.screenshot,
        keywords=seo_details.keywords,
        phrases=seo_details.phrases,
        pages_404=seo_details.pages_404,
        pages=[
            {
                "url": page.url,
                "seo_score": page.seo_score,
                "grade": page.grade,
                "load_time_ms": page.load_time_ms,
                "html_size_kb": page.html_size_kb,
                "title": page.title,
                "meta_description": page.meta_description,
                "canonical": page.canonical,
                "robots": page.robots,
                "favicon": page.favicon,
                "internal_links": page.internal_links_count,
                "external_links": page.external_links_count,
                "header_tags": page.header_tags,
                "images_missing_alt": page.images_missing_alt,
                "good_practices": page.good_practices,
                "bad_practices": page.bad_practices
            } for page in pages
        ]
    )
    
    return response

@router.get("/seo-reports", response_model=List[SEOReportResponse])
async def get_all_seo_reports(db: Session = Depends(get_session)):
    reports = db.query(Report).filter(Report.scan_type == "seo").all()
    
    results = []
    for report in reports:
        seo_details = db.query(SEOReportDetails).filter(SEOReportDetails.report_id == report.id).first()
        if not seo_details:
            continue            
        pages = db.query(SEOCrawledPage).filter(SEOCrawledPage.seo_report_id == seo_details.id).all()
        
        result = SEOReportResponse(
            id=seo_details.id,
            url=report.url,
            average_score=seo_details.average_score,
            server_info={
                "ip": seo_details.server_ip,
                "os": seo_details.server_os,
                "server": seo_details.server_software,
                "backend": seo_details.server_backend,
                "frontend": seo_details.server_frontend,
                "cms": seo_details.server_cms
            },
            total_pages_analyzed=seo_details.total_pages_analyzed,
            crawled_links=[page.url for page in pages],
            screenshot=seo_details.screenshot,
            keywords=seo_details.keywords,
            phrases=seo_details.phrases,
            pages_404=seo_details.pages_404,
            pages=[
                {
                    "url": page.url,
                    "seo_score": page.seo_score,
                    "grade": page.grade,
                    "load_time_ms": page.load_time_ms,
                    "html_size_kb": page.html_size_kb,
                    "title": page.title,
                    "meta_description": page.meta_description,
                    "canonical": page.canonical,
                    "robots": page.robots,
                    "favicon": page.favicon,
                    "internal_links": page.internal_links_count,
                    "external_links": page.external_links_count,
                    "header_tags": page.header_tags,
                    "images_missing_alt": page.images_missing_alt,
                    "good_practices": page.good_practices,
                    "bad_practices": page.bad_practices
                } for page in pages
            ]
        )
        results.append(result)
    
    return results

@router.delete("/seo-report/{report_id}", status_code=204)
async def delete_seo_report(report_id: int, db: Session = Depends(get_session)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")    
    db.delete(report)
    db.commit()
    
    return None

@router.get("/seo-report/{report_id}/download")
async def download_seo_report_html(report_id: int, db: Session = Depends(get_session)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    seo_details = db.query(SEOReportDetails).filter(SEOReportDetails.report_id == report_id).first()
    if not seo_details:
        raise HTTPException(status_code=404, detail="SEO report details not found")
    pages = db.query(SEOCrawledPage).filter(SEOCrawledPage.seo_report_id == seo_details.id).all()
    report_data = {
        "url": report.url,
        "average_score": seo_details.average_score,
        "server_info": {
            "ip": seo_details.server_ip,
            "os": seo_details.server_os,
            "server": seo_details.server_software,
            "backend": seo_details.server_backend,
            "frontend": seo_details.server_frontend,
            "cms": seo_details.server_cms
        },
        "total_pages_analyzed": seo_details.total_pages_analyzed,
        "crawled_links": [page.url for page in pages],
        "screenshot": seo_details.screenshot,
        "keywords": seo_details.keywords,
        "phrases": seo_details.phrases,
        "pages_404": seo_details.pages_404,
        "pages": [
            {
                "url": page.url,
                "seo_score": page.seo_score,
                "grade": page.grade,
                "load_time_ms": page.load_time_ms,
                "html_size_kb": page.html_size_kb,
                "title": page.title,
                "meta_description": page.meta_description,
                "canonical": page.canonical,
                "robots": page.robots,
                "favicon": page.favicon,
                "internal_links": page.internal_links_count,
                "external_links": page.external_links_count,
                "header_tags": page.header_tags,
                "images_missing_alt": page.images_missing_alt,
                "good_practices": page.good_practices,
                "bad_practices": page.bad_practices
            } for page in pages
        ]
    }
    templates = Environment(loader=FileSystemLoader("templates"))
    template = templates.get_template("report-seo.html")
    rendered_html = template.render(report=report_data)
    file_like = io.BytesIO(rendered_html.encode('utf-8'))
    return StreamingResponse(
        file_like,
        media_type="text/html",
        headers={"Content-Disposition": "attachment; filename=report-seo.html"}
    )