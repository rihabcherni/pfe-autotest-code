from sqlalchemy import Column, Integer, String
from app.database.database import Base

class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), nullable=False)
    subject = Column(String(150), nullable=False)
    message = Column(String, nullable=False)