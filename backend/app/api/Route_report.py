import json
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from jinja2 import Environment, FileSystemLoader
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.database import Base, engine, get_session
import matplotlib.pyplot as plt
import io
import base64
import csv
import xml.etree.ElementTree as ET
import zipfile
from xhtml2pdf import pisa
from app.services.report_service import (
    create_report_db,
    get_all_reports_admin,
    get_report,
    delete_report_db,
    get_reports_by_user,
    get_report_by_id_and_user,
    get_type_reports
)
from app.schemas.report.report import ReportAdminRead, ReportCreate, ReportRead, ReportSecurityRead, ReportSeoRead

class Controller:
    Base.metadata.create_all(engine)

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/", response_model=ReportRead)
def create_report(report: ReportCreate, db: Session = Depends(get_session)):
    return create_report_db(db, report)

@router.get("/", response_model=List[ReportAdminRead])
def read_reports( db: Session = Depends(get_session)):
    return get_all_reports_admin(db)

@router.get("/type/security", response_model=List[ReportSecurityRead])
def read_security_reports(user_id: Optional[int] = None, db: Session = Depends(get_session)):
    return get_type_reports(db, scan_type="security", user_id=user_id)

@router.get("/type/seo", response_model=List[ReportSeoRead])
def read_seo_reports(user_id: Optional[int] = None, db: Session = Depends(get_session)):
    return get_type_reports(db, scan_type="seo", user_id=user_id)

@router.get("/type/full", response_model=List[ReportRead])
def read_full_reports(user_id: Optional[int] = None, db: Session = Depends(get_session)):
    return get_type_reports(db, scan_type="full", user_id=user_id)

@router.get("/{report_id}", response_model=ReportRead)
def read_report(report_id: int, db: Session = Depends(get_session)):
    db_report = get_report(db, report_id)
    if db_report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return db_report

@router.delete("/{report_id}", response_model=dict)
def delete_report(report_id: int, db: Session = Depends(get_session)):
    success = delete_report_db(db, report_id)
    if not success:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"message": "Report deleted successfully"}

@router.get("/user/{user_id}", response_model=List[ReportRead])
def read_reports_by_user(user_id: int, db: Session = Depends(get_session)):
    return get_reports_by_user(user_id, db)

@router.get("/user/{user_id}/report/{report_id}", response_model=ReportRead)
def read_report_by_user(report_id: int, user_id: int, db: Session = Depends(get_session)):
    report = get_report_by_id_and_user(report_id, user_id, db)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found for this user")
    return report

templates = Environment(loader=FileSystemLoader("templates"))

def load_report_from_db(report_id: int, db: Session):
    db_report = get_report(db, report_id)
    if db_report is None:
        return None
    if hasattr(db_report, 'data') and db_report.data:
        if isinstance(db_report.data, str):
            return json.loads(db_report.data)
        return db_report.data
    elif hasattr(db_report, 'content') and db_report.content:
        if isinstance(db_report.content, str):
            return json.loads(db_report.content)
        return db_report.content
    elif hasattr(db_report, 'report_data') and db_report.report_data:
        if isinstance(db_report.report_data, str):
            return json.loads(db_report.report_data)
        return db_report.report_data
    return {
        "id": db_report.id,
        "title": getattr(db_report, 'title', f"Report {db_report.id}"),
        "created_at": str(getattr(db_report, 'created_at', '')),
        "details": {},
        "vulnerability_categories": {}
    }

def generate_pie_chart(report_data):
    details = report_data.get('details', {})
    labels = ['High', 'Medium', 'Low', 'Informational']
    sizes = [
        details.get('total_High', 0), 
        details.get('total_Medium', 0), 
        details.get('total_Low', 0), 
        details.get('total_Informational', 0)
    ]
    if sum(sizes) == 0:
        sizes = [1, 1, 1, 1]  
    fig, ax = plt.subplots()
    ax.pie(sizes, labels=labels, autopct='%1.1f%%', startangle=90, colors=['#FF5733', '#FFBD33', '#33FF57', '#33B5FF'])
    ax.axis('equal')  
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    buf.close()
    plt.close() 
    return img_base64

@router.get("/download/{report_id}/html")
async def download_html(report_id: int, db: Session = Depends(get_session)):
    report_data = load_report_from_db(report_id, db)
    if not report_data:
        raise HTTPException(status_code=404, detail="Report not found")
    
    pie_chart_base64 = generate_pie_chart(report_data)
    template = templates.get_template("report-html.html")
    rendered_html = template.render(report=report_data, pie_chart_base64=pie_chart_base64)
    file_like = io.BytesIO(rendered_html.encode('utf-8'))
    
    return StreamingResponse(
        file_like, 
        media_type="text/html", 
        headers={"Content-Disposition": f"attachment; filename=report_{report_id}.html"}
    )

@router.get("/download/{report_id}/csv")
async def download_csv(report_id: int, db: Session = Depends(get_session)):
    report_data = load_report_from_db(report_id, db)
    if not report_data:
        raise HTTPException(status_code=404, detail="Report not found")

    csv_file = io.StringIO()
    writer = csv.writer(csv_file)
    writer.writerow(["Vulnerability", "Risk", "Description", "Solution"])

    vulnerability_categories = report_data.get("vulnerability_categories", {})
    for vuln_name, vuln_info in vulnerability_categories.items():
        details = vuln_info.get("details", [])
        for detail in details:
            writer.writerow([
                vuln_name,
                detail.get("risk", "N/A"),
                detail.get("description", "N/A"),
                detail.get("solution", "N/A")
            ])
    
    csv_file.seek(0)
    return StreamingResponse(
        io.StringIO(csv_file.getvalue()), 
        media_type="text/csv", 
        headers={"Content-Disposition": f"attachment; filename=report_{report_id}.csv"}
    )

@router.get("/download/{report_id}/xml")
async def download_xml(report_id: int, db: Session = Depends(get_session)):
    report_data = load_report_from_db(report_id, db)
    if not report_data:
        raise HTTPException(status_code=404, detail="Report not found")

    root = ET.Element("Report")
    root.set("id", str(report_id))    
    details = ET.SubElement(root, "Details")
    report_details = report_data.get("details", {})
    for key, value in report_details.items():
        ET.SubElement(details, key).text = str(value)

    vulnerabilities = ET.SubElement(root, "Vulnerabilities")
    vulnerability_categories = report_data.get("vulnerability_categories", {})
    for vuln_name, vuln_info in vulnerability_categories.items():
        vuln_elem = ET.SubElement(vulnerabilities, "Vulnerability", name=vuln_name)
        details_list = vuln_info.get("details", [])
        for detail in details_list:
            detail_elem = ET.SubElement(vuln_elem, "Detail")
            ET.SubElement(detail_elem, "Risk").text = detail.get("risk", "N/A")
            ET.SubElement(detail_elem, "Description").text = detail.get("description", "N/A")
            ET.SubElement(detail_elem, "Solution").text = detail.get("solution", "N/A")
    
    xml_data = ET.tostring(root, encoding="utf-8", method="xml")
    xml_file = io.BytesIO(xml_data)
    
    return StreamingResponse(
        xml_file, 
        media_type="application/xml", 
        headers={"Content-Disposition": f"attachment; filename=report_{report_id}.xml"}
    )

@router.get("/download/{report_id}/pdf")
async def download_pdf(report_id: int, db: Session = Depends(get_session)):
    report_data = load_report_from_db(report_id, db)
    if not report_data:
        raise HTTPException(status_code=404, detail="Report not found")

    pie_chart_base64 = generate_pie_chart(report_data)
    template = templates.get_template("report-pdf.html")
    rendered_html = template.render(report=report_data, pie_chart_base64=pie_chart_base64)

    pdf_buffer = io.BytesIO()
    pisa_status = pisa.CreatePDF(io.BytesIO(rendered_html.encode("utf-8")), dest=pdf_buffer)

    if pisa_status.err:
        raise HTTPException(status_code=500, detail="Error generating PDF")

    pdf_buffer.seek(0)

    return StreamingResponse(
        pdf_buffer, 
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=report_{report_id}.pdf"}
    )

@router.get("/download/{report_id}/zip")
async def download_zip(report_id: int, db: Session = Depends(get_session)):
    report_data = load_report_from_db(report_id, db)
    if not report_data:
        raise HTTPException(status_code=404, detail="Report not found")

    memory_file = io.BytesIO()
    with zipfile.ZipFile(memory_file, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(f"report_{report_id}.json", json.dumps(report_data, indent=4))

        pie_chart_base64 = generate_pie_chart(report_data)
        template = templates.get_template("report-html.html")
        html_content = template.render(report=report_data, pie_chart_base64=pie_chart_base64)
        zf.writestr(f"report_{report_id}.html", html_content.encode('utf-8'))

        csv_file = io.StringIO()
        writer = csv.writer(csv_file)
        writer.writerow(["Vulnerability", "Risk", "Description", "Solution"])
        vulnerability_categories = report_data.get("vulnerability_categories", {})
        for vuln_name, vuln_info in vulnerability_categories.items():
            details = vuln_info.get("details", [])
            for detail in details:
                writer.writerow([
                    vuln_name,
                    detail.get("risk", "N/A"),
                    detail.get("description", "N/A"),
                    detail.get("solution", "N/A")
                ])
        zf.writestr(f"report_{report_id}.csv", csv_file.getvalue().encode('utf-8'))
        root = ET.Element("Report")
        root.set("id", str(report_id))
        details = ET.SubElement(root, "Details")
        report_details = report_data.get("details", {})
        for key, value in report_details.items():
            ET.SubElement(details, key).text = str(value)
        vulnerabilities = ET.SubElement(root, "Vulnerabilities")
        for vuln_name, vuln_info in vulnerability_categories.items():
            vuln_elem = ET.SubElement(vulnerabilities, "Vulnerability", name=vuln_name)
            details_list = vuln_info.get("details", [])
            for detail in details_list:
                detail_elem = ET.SubElement(vuln_elem, "Detail")
                ET.SubElement(detail_elem, "Risk").text = detail.get("risk", "N/A")
                ET.SubElement(detail_elem, "Description").text = detail.get("description", "N/A")
                ET.SubElement(detail_elem, "Solution").text = detail.get("solution", "N/A")
        xml_data = ET.tostring(root, encoding="utf-8", method="xml")
        zf.writestr(f"report_{report_id}.xml", xml_data)
        template_pdf = templates.get_template("report-pdf.html")
        pdf_html = template_pdf.render(report=report_data, pie_chart_base64=pie_chart_base64)
        pdf_buffer = io.BytesIO()
        pisa_status = pisa.CreatePDF(io.BytesIO(pdf_html.encode("utf-8")), dest=pdf_buffer)
        if not pisa_status.err:
            zf.writestr(f"report_{report_id}.pdf", pdf_buffer.getvalue())

    memory_file.seek(0)

    return StreamingResponse(
        memory_file, 
        media_type="application/zip", 
        headers={"Content-Disposition": f"attachment; filename=reports_{report_id}.zip"}
    )
@router.get("/user/{user_id}/download/{report_id}/html")
async def download_html_by_user(report_id: int, user_id: int, db: Session = Depends(get_session)):
    db_report = get_report_by_id_and_user(report_id, user_id, db)
    if db_report is None:
        raise HTTPException(status_code=404, detail="Report not found for this user")
    return await download_html(report_id, db)

@router.get("/user/{user_id}/download/{report_id}/csv")
async def download_csv_by_user(report_id: int, user_id: int, db: Session = Depends(get_session)):
    db_report = get_report_by_id_and_user(report_id, user_id, db)
    if db_report is None:
        raise HTTPException(status_code=404, detail="Report not found for this user")
    return await download_csv(report_id, db)

@router.get("/user/{user_id}/download/{report_id}/xml")
async def download_xml_by_user(report_id: int, user_id: int, db: Session = Depends(get_session)):
    db_report = get_report_by_id_and_user(report_id, user_id, db)
    if db_report is None:
        raise HTTPException(status_code=404, detail="Report not found for this user")
    return await download_xml(report_id, db)

@router.get("/user/{user_id}/download/{report_id}/pdf")
async def download_pdf_by_user(report_id: int, user_id: int, db: Session = Depends(get_session)):
    db_report = get_report_by_id_and_user(report_id, user_id, db)
    if db_report is None:
        raise HTTPException(status_code=404, detail="Report not found for this user")
    return await download_pdf(report_id, db)

@router.get("/user/{user_id}/download/{report_id}/zip")
async def download_zip_by_user(report_id: int, user_id: int, db: Session = Depends(get_session)):
    db_report = get_report_by_id_and_user(report_id, user_id, db)
    if db_report is None:
        raise HTTPException(status_code=404, detail="Report not found for this user")
    return await download_zip(report_id, db)