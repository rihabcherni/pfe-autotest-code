from pydantic import BaseModel, Field
from typing import Optional, List

class SecurityPreferencesBase(BaseModel):
    depth_crawl: Optional[int] = Field(default=3, ge=1, le=10)
    zap_dc: Optional[int] = Field(default=5, ge=1, le=10)
    zap_d: Optional[int] = Field(default=5, ge=1, le=10)
    wapiti_scan_time: Optional[int] = Field(default=5, ge=1, le=60)
    wapiti_level: Optional[int] = Field(default=2, ge=1, le=2)
    sqlmap_level: Optional[int] = Field(default=3, ge=1, le=5)
    sqlmap_risk: Optional[int] = Field(default=3, ge=1, le=3)
    sqlmap_threads: Optional[int] = Field(default=5, ge=1, le=20)
    sqlmap_technique: Optional[str] = Field(default='BEUSTQ', pattern=r'^[BEUSTQ]+$')
    nikto_timeout: Optional[int] = Field(default=300, ge=60, le=3600)
    nuclei_rate_limit: Optional[int] = Field(default=100, ge=10, le=1000)
    nmap_timing: Optional[int] = Field(default=4, ge=0, le=5)
    whatweb_aggression: Optional[int] = Field(default=3, ge=1, le=4)
    pwnxss_threads: Optional[int] = Field(default=10, ge=1, le=50)
    outils_securite_favoris: Optional[List[str]] = Field(default_factory=list)

class SecurityPreferencesCreate(SecurityPreferencesBase):
    pass

class SecurityPreferencesUpdate(SecurityPreferencesBase):
    pass

class SecurityPreferencesOut(SecurityPreferencesBase):
    id: int
    user_id: int
    
    class Config:
        from_attributes = True

# Schema for default preferences
class DefaultPreferences(BaseModel):
    depth_crawl: int = 3
    zap_dc: int = 5
    zap_d: int = 5
    wapiti_scan_time: int = 5
    wapiti_level: int = 2
    sqlmap_level: int = 3
    sqlmap_risk: int = 3
    sqlmap_threads: int = 5
    sqlmap_technique: str = 'BEUSTQ'
    nikto_timeout: int = 300
    nuclei_rate_limit: int = 100
    nmap_timing: int = 4
    whatweb_aggression: int = 3
    pwnxss_threads: int = 10
    outils_securite_favoris: List[str] = []