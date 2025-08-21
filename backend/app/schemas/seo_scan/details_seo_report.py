from typing import Dict, List, Optional, Union
from pydantic import BaseModel, HttpUrl

from app.schemas.seo_scan.crawled_page import SEOCrawledPageCreate, SEOCrawledPageRead

class ServerInfo(BaseModel):
    ip: str = ""
    os: str = ""
    server: str = ""
    backend: List[str] = []
    frontend: List[str] = []
    cms: str = ""
    hostname: str = ""
    x_powered_by: Optional[str] = None
    set_cookie: Optional[str] = None
    raw_headers: Optional[Dict[str, str]] = None

class SEOPageReport(BaseModel):
    url: str
    seo_score: float
    grade: str
    load_time_ms: Optional[int] = None
    html_size_kb: Optional[float] = None
    title: Optional[str] = None
    meta_description: Optional[str] = None
    canonical: Optional[str] = None
    robots: Optional[str] = None
    favicon: Optional[str] = None
    internal_links: Optional[int] = None
    external_links: Optional[int] = None
    header_tags: Optional[Dict[str, List[str]]] = None
    images_missing_alt: Optional[Union[List[str], str]] = None
    good_practices: List[str] = []
    bad_practices: List[str] = []

class SEOReportRequest(BaseModel):
    url: HttpUrl

class SEOReportResponse(BaseModel):
    id: Optional[int] = None
    url: str
    average_score: float
    server_info: ServerInfo
    total_pages_analyzed: int
    crawled_links: List[str] = []
    screenshot: Optional[str] = None
    keywords: Dict[str, int] = {}
    phrases: Dict[str, int] = {}
    pages_404: List[str] = []
    pages: List[SEOPageReport] = []

class SEOReportCreate(BaseModel):
    report_id: int
    average_score: float
    total_pages_analyzed: int
    screenshot: Optional[str] = None
    server_ip: str = ""
    server_os: str = ""
    server_software: str = ""
    server_backend: List[str] = []
    server_frontend: List[str] = []
    server_cms: str = ""
    keywords: Dict[str, int] = {}
    phrases: Dict[str, int] = {}
    pages_404: List[str] = []

class SEOReportDetailsBase(BaseModel):
    average_score: Optional[float]
    total_pages_analyzed: Optional[int]
    screenshot: Optional[str]

    server_ip: Optional[str]
    server_os: Optional[str]
    server_software: Optional[str]
    server_backend: Optional[List[str]]
    server_frontend: Optional[List[str]]
    server_cms: Optional[str]

    keywords: Optional[Dict[str, int]] 
    phrases: Optional[Dict[str, int]]
    pages_404: Optional[List[str]]

class SEOReportDetailsCreate(SEOReportDetailsBase):
    crawled_pages: Optional[List[SEOCrawledPageCreate]] = []

class SEOReportDetailsRead(SEOReportDetailsBase):
    id: int
    report_id: int
    crawled_pages: Optional[List[SEOCrawledPageRead]] = []

    class Config:
        from_attributes = True

