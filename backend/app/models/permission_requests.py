from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.types import JSON  # important
from app.database.database import Base

class PermissionRequest(Base):
    __tablename__ = "permission_requests"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    requested_permissions = Column(JSON, nullable=False)  
    created_at = Column(DateTime, default=datetime.utcnow)
