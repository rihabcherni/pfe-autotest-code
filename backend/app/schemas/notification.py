from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Literal

NotificationType = Literal["info", "success", "warning", "error", "alert", "progression"]

class NotificationBase(BaseModel):
    message: str
    is_read: bool = False
    type: NotificationType = "info" 

class NotificationCreate(NotificationBase):
    user_id: int

class NotificationUpdate(BaseModel):
    message: Optional[str] = None
    is_read: Optional[bool] = None
    type: Optional[NotificationType] = None

class NotificationOut(NotificationBase):
    id: int
    created_at: datetime
    user_id: int

    class Config:
        from_attributes = True