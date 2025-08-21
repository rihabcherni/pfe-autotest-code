from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from app.database.database import Base

class SEOReportDetails(Base):
    __tablename__ = 'seo_report_details'

    id = Column(Integer, primary_key=True)
    report_id = Column(Integer, ForeignKey('reports.id'), unique=True, nullable=False)
    average_score = Column(Float)
    total_pages_analyzed = Column(Integer)
    screenshot = Column(Text)

    server_ip = Column(String)
    server_os = Column(String)
    server_software = Column(String)
    server_backend = Column(ARRAY(String))
    server_frontend = Column(ARRAY(String))
    server_cms = Column(String)

    keywords = Column(JSONB)
    phrases = Column(JSONB)
    pages_404 = Column(ARRAY(String))

    report = relationship("Report", back_populates="seo_details")
    crawled_pages = relationship("SEOCrawledPage", back_populates="seo_report", cascade="all, delete-orphan")

class SEOCrawledPage(Base):
    __tablename__ = 'seo_crawled_pages'

    id = Column(Integer, primary_key=True)
    seo_report_id = Column(Integer, ForeignKey('seo_report_details.id'), nullable=False)

    url = Column(String)
    title = Column(String)
    meta_description = Column(String)
    load_time_ms = Column(Integer)
    html_size_kb = Column(Float)
    canonical = Column(String)
    robots = Column(String)
    favicon = Column(String)
    internal_links_count = Column(Integer)
    external_links_count = Column(Integer)
    seo_score = Column(Float)
    grade = Column(String)
    good_practices = Column(ARRAY(String))
    bad_practices = Column(ARRAY(String))
    header_tags = Column(JSONB)
    images_missing_alt = Column(ARRAY(String))

    seo_report = relationship("SEOReportDetails", back_populates="crawled_pages")
