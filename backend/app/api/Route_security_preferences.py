from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.configuration.auth_bearer import get_current_user
from app.database.database import Base, engine, get_session
from app.models.security_preferences import SecurityPreferences
from app.schemas.security_preferences import DefaultPreferences, SecurityPreferencesCreate, SecurityPreferencesUpdate

router = APIRouter(
    prefix="/security-preferences",
    tags=["Security Preferences"]
)

class Controller:
    Base.metadata.create_all(engine)

def get_default_preferences() -> Dict[str, Any]:
    defaults = DefaultPreferences()
    return defaults.dict()

@router.get("/defaults", response_model=Dict[str, Any])
def get_defaults(db: Session = Depends(get_session)):
    try:
        return {
            "success": True,
            "message": "Default preferences retrieved successfully",
            "data": get_default_preferences()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving defaults: {str(e)}"
        )

@router.post("/reset", response_model=Dict[str, Any])
def reset_to_defaults(
    current_user = Depends(get_current_user), 
    db: Session = Depends(get_session)
):
    try:
        user_id = current_user.id
        prefs = db.query(SecurityPreferences).filter_by(user_id=user_id).first()
        
        default_prefs = get_default_preferences()
        
        if prefs:
            for key, value in default_prefs.items():
                setattr(prefs, key, value)
        else:
            prefs = SecurityPreferences(user_id=user_id, **default_prefs)
            db.add(prefs)
        
        db.commit()
        db.refresh(prefs)
        
        return {
            "success": True,
            "message": "Preferences reset to defaults successfully",
            "data": {
                "depth_crawl": prefs.depth_crawl,
                "zap_dc": prefs.zap_dc,
                "zap_d": prefs.zap_d,
                "wapiti_scan_time": prefs.wapiti_scan_time,
                "wapiti_level": prefs.wapiti_level,
                "sqlmap_level": prefs.sqlmap_level,
                "sqlmap_risk": prefs.sqlmap_risk,
                "sqlmap_threads": prefs.sqlmap_threads,
                "sqlmap_technique": prefs.sqlmap_technique,
                "nikto_timeout": prefs.nikto_timeout,
                "nuclei_rate_limit": prefs.nuclei_rate_limit,
                "nmap_timing": prefs.nmap_timing,
                "whatweb_aggression": prefs.whatweb_aggression,
                "pwnxss_threads": prefs.pwnxss_threads,
                "outils_securite_favoris": prefs.outils_securite_favoris or []
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error resetting preferences: {str(e)}"
        )

@router.post("/", response_model=Dict[str, Any])
def create_or_update_preferences(
    preferences: SecurityPreferencesCreate,
    current_user = Depends(get_current_user),  
    db: Session = Depends(get_session)
):
    try:
        user_id = current_user.id
        existing_prefs = db.query(SecurityPreferences).filter_by(user_id=user_id).first()
        
        if existing_prefs:
            for key, value in preferences.dict(exclude_unset=True).items():
                setattr(existing_prefs, key, value)
            
            db.commit()
            db.refresh(existing_prefs)
            prefs = existing_prefs
        else:
            prefs = SecurityPreferences(**preferences.dict(), user_id=user_id)
            db.add(prefs)
            db.commit()
            db.refresh(prefs)
        
        return {
            "success": True,
            "message": "Preferences saved successfully",
            "data": {
                "depth_crawl": prefs.depth_crawl,
                "zap_dc": prefs.zap_dc,
                "zap_d": prefs.zap_d,
                "wapiti_scan_time": prefs.wapiti_scan_time,
                "wapiti_level": prefs.wapiti_level,
                "sqlmap_level": prefs.sqlmap_level,
                "sqlmap_risk": prefs.sqlmap_risk,
                "sqlmap_threads": prefs.sqlmap_threads,
                "sqlmap_technique": prefs.sqlmap_technique,
                "nikto_timeout": prefs.nikto_timeout,
                "nuclei_rate_limit": prefs.nuclei_rate_limit,
                "nmap_timing": prefs.nmap_timing,
                "whatweb_aggression": prefs.whatweb_aggression,
                "pwnxss_threads": prefs.pwnxss_threads,
                "outils_securite_favoris": prefs.outils_securite_favoris or []
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving preferences: {str(e)}"
        )

@router.get("/", response_model=Dict[str, Any])
def get_preferences(
    current_user = Depends(get_current_user), 
    db: Session = Depends(get_session)
):
    try:
        user_id = current_user.id
        
        prefs = db.query(SecurityPreferences).filter_by(user_id=user_id).first()
        
        if not prefs:
            default_prefs = get_default_preferences()
            return {
                "success": True,
                "message": "Default preferences retrieved",
                "data": default_prefs
            }
        
        return {
            "success": True,
            "message": "Preferences retrieved successfully",
            "data": {
                "depth_crawl": prefs.depth_crawl,
                "zap_dc": prefs.zap_dc,
                "zap_d": prefs.zap_d,
                "wapiti_scan_time": prefs.wapiti_scan_time,
                "wapiti_level": prefs.wapiti_level,
                "sqlmap_level": prefs.sqlmap_level,
                "sqlmap_risk": prefs.sqlmap_risk,
                "sqlmap_threads": prefs.sqlmap_threads,
                "sqlmap_technique": prefs.sqlmap_technique,
                "nikto_timeout": prefs.nikto_timeout,
                "nuclei_rate_limit": prefs.nuclei_rate_limit,
                "nmap_timing": prefs.nmap_timing,
                "whatweb_aggression": prefs.whatweb_aggression,
                "pwnxss_threads": prefs.pwnxss_threads,
                "outils_securite_favoris": prefs.outils_securite_favoris or []
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving preferences: {str(e)}"
        )

@router.put("/", response_model=Dict[str, Any])
def update_preferences(
    updated_data: SecurityPreferencesUpdate,
    current_user = Depends(get_current_user),  
    db: Session = Depends(get_session)
):
    try:
        user_id = current_user.id
        
        prefs = db.query(SecurityPreferences).filter_by(user_id=user_id).first()
        
        if not prefs:
            prefs = SecurityPreferences(**updated_data.dict(), user_id=user_id)
            db.add(prefs)
        else:
            for key, value in updated_data.dict(exclude_unset=True).items():
                setattr(prefs, key, value)
        
        db.commit()
        db.refresh(prefs)
        
        return {
            "success": True,
            "message": "Preferences updated successfully",
            "data": {
                "depth_crawl": prefs.depth_crawl,
                "zap_dc": prefs.zap_dc,
                "zap_d": prefs.zap_d,
                "wapiti_scan_time": prefs.wapiti_scan_time,
                "wapiti_level": prefs.wapiti_level,
                "sqlmap_level": prefs.sqlmap_level,
                "sqlmap_risk": prefs.sqlmap_risk,
                "sqlmap_threads": prefs.sqlmap_threads,
                "sqlmap_technique": prefs.sqlmap_technique,
                "nikto_timeout": prefs.nikto_timeout,
                "nuclei_rate_limit": prefs.nuclei_rate_limit,
                "nmap_timing": prefs.nmap_timing,
                "whatweb_aggression": prefs.whatweb_aggression,
                "pwnxss_threads": prefs.pwnxss_threads,
                "outils_securite_favoris": prefs.outils_securite_favoris or []
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating preferences: {str(e)}"
        )

@router.delete("/")
def delete_preferences(
    current_user = Depends(get_current_user),  
    db: Session = Depends(get_session)
):
    try:
        user_id = current_user.id
        
        prefs = db.query(SecurityPreferences).filter_by(user_id=user_id).first()
        
        if not prefs:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Preferences not found"
            )
        
        db.delete(prefs)
        db.commit()
        
        return {
            "success": True,
            "message": "Preferences deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting preferences: {str(e)}"
        )