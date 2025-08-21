from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.models.user import User
from app.services.contact_message import create_contact_message, get_contact_messages
from app.database.database import get_session
from app.schemas.contact_message import ContactMessageCreate, ContactMessageOut
from app.database.database import Base, engine, get_session
from app.database.database import get_session
from app.services.notifier import Notifier
notifier = Notifier() 

router = APIRouter(tags=["contact"])
class Controller:
    Base.metadata.create_all(engine)

@router.post("/contact", response_model=ContactMessageCreate)
def create_contact(contact: ContactMessageCreate, session: Session = Depends(get_session)):
    db_contact = create_contact_message(db=session, contact=contact)
    admin_user = session.query(User).filter_by(role="admin").first() 
    if admin_user:
        message= f"New contact message"
        notif = Notification(
            message = message,
            user_id=admin_user.id,
            type="info"  
        )
        session.add(notif)
        session.commit()
        session.refresh(notif)
        notifier.send_to_websocket(message, session, admin_user.id, notif_type="info")

    return db_contact
 
@router.get("/contact", response_model=List[ContactMessageOut])
def read_contacts(
    skip: int = 0,
    limit: int = 10,
    search: str = Query(None),
    db: Session = Depends(get_session),
):
    contacts, total = get_contact_messages(db=db, skip=skip, limit=limit, search=search)
    return contacts
