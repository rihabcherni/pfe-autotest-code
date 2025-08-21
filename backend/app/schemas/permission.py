from pydantic import BaseModel
from typing import List
from enum import Enum

class PermissionType(str, Enum):
    seo = "seo"
    securite = "securite"
    fonctionnel = "fonctionnel"
    full = "full"
    send_reports= "send_reports"
    schedule_scan= "schedule_scan"
    all = "all"

class PermissionCreate(BaseModel):
    user_id: int
    permissions: List[PermissionType]

class PermissionDisplay(BaseModel):
    user_id: int
    permissions: List[PermissionType]

    class Config:
        from_attributes = True
