from typing import Dict, List, Optional
from pydantic import BaseModel

class SEOCrawledPageCreate(BaseModel):
    seo_report_id: int
    url: str
    title: Optional[str] = None
    meta_description: Optional[str] = None
    load_time_ms: Optional[int] = None
    html_size_kb: Optional[float] = None
    canonical: Optional[str] = None
    robots: Optional[str] = None
    favicon: Optional[str] = None
    internal_links_count: Optional[int] = None
    external_links_count: Optional[int] = None
    seo_score: float
    grade: str
    good_practices: List[str] = []
    bad_practices: List[str] = []
    header_tags: Optional[Dict[str, List[str]]] = None
    images_missing_alt: Optional[List[str]] = None

class SEOCrawledPageBase(BaseModel):
    url: Optional[str]
    title: Optional[str]
    meta_description: Optional[str]
    load_time_ms: Optional[int]
    html_size_kb: Optional[float]
    canonical: Optional[str]
    robots: Optional[str]
    favicon: Optional[str]
    internal_links_count: Optional[int]
    external_links_count: Optional[int]
    
    seo_score: Optional[float]
    grade: Optional[str]

    good_practices: Optional[List[str]]
    bad_practices: Optional[List[str]]
    header_tags: Optional[Dict[str, List[str]]] 
    images_missing_alt: Optional[List[str]]

class SEOCrawledPageCreate(SEOCrawledPageBase):
    pass

class SEOCrawledPageRead(SEOCrawledPageBase):
    id: int

    class Config:
        from_attributes = True

