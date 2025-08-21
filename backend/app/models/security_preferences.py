from sqlalchemy import Column, Integer, String, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from app.database.database import Base

class SecurityPreferences(Base):
    __tablename__ = 'security_preferences'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True, nullable=False)
    
    depth_crawl = Column(Integer, default=3)
    zap_dc = Column(Integer, default=5)
    zap_d = Column(Integer, default=5)
    wapiti_scan_time = Column(Integer, default=5)
    wapiti_level = Column(Integer, default=2)
    sqlmap_level = Column(Integer, default=3)
    sqlmap_risk = Column(Integer, default=3)
    sqlmap_threads = Column(Integer, default=5)
    sqlmap_technique = Column(String, default='BEUSTQ')
    nikto_timeout = Column(Integer, default=300)
    nuclei_rate_limit = Column(Integer, default=100)
    nmap_timing = Column(Integer, default=4)
    whatweb_aggression = Column(Integer, default=3)
    pwnxss_threads = Column(Integer, default=10)
    
    # Favorite security tools (stored as JSON array)
    outils_securite_favoris = Column(JSON, default=lambda: [])

    user = relationship("User", back_populates="preferences")