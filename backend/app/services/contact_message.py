import logging
from sqlalchemy.orm import Session
from app.models.contact_message import ContactMessage
from app.schemas.contact_message import ContactMessageCreate
from sqlalchemy import or_

def create_contact_message(db: Session, contact: ContactMessageCreate):
    try:
        db_message = ContactMessage(**contact.dict())
        db.add(db_message)        
        db.commit()
        db.refresh(db_message)
        return db_message
    except Exception as e:
        db.rollback()
        logging.error(f"Error while creating contact message: {e}")
        raise e

def get_contact_messages(
    db: Session,
    skip: int = 0,
    limit: int = 10,
    search: str = None,
):
    query = db.query(ContactMessage)
    if search:
        query = query.filter(
            or_(
                ContactMessage.name.ilike(f"%{search}%"),
                ContactMessage.email.ilike(f"%{search}%"),
                ContactMessage.subject.ilike(f"%{search}%"),
                ContactMessage.message.ilike(f"%{search}%"),
            )
        )
    total = query.count()
    results = query.offset(skip).limit(limit).all()
    return results, total
