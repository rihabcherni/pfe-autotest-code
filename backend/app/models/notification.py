from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime
from datetime import datetime
from app.database.database import Base
from sqlalchemy.orm import relationship

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    message = Column(String, nullable=False)
    is_read = Column(Boolean, nullable=False, default=False, server_default="false")
    type = Column(String, nullable=False, default="info") 
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    user = relationship("User", back_populates="notifications")
