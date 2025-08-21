from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import Base, engine, get_session
from app.models.notification import Notification
from app.schemas.notification import NotificationOut
from typing import List

router = APIRouter(prefix="/notifications", tags=["notifications"])
class Controller:
    Base.metadata.create_all(engine)

@router.get("/user/{user_id}", response_model=List[NotificationOut])
async def get_user_notifications(user_id: int, db: Session = Depends(get_session)):
    notifications = db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.created_at.desc()).all()
    return [
        {
            "id": notif.id,
            "message": notif.message,
            "type": notif.type,
            "user_id": notif.user_id,
            "is_read": notif.is_read,
            "created_at": notif.created_at.isoformat()
        }
        for notif in notifications
    ]

@router.patch("/{notification_id}/read")
async def mark_notification_as_read(notification_id: int, db: Session = Depends(get_session)):
    notification = db.query(Notification).filter(
        Notification.id == notification_id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification non trouvée"
        )
    
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    
    return {
        "message": "Notification marquée comme lue",
        "notification_id": notification_id
    }

@router.patch("/user/{user_id}/mark-all-read")
async def mark_all_notifications_as_read(user_id: int, db: Session = Depends(get_session)):
    notifications = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).all()
    
    if not notifications:
        return {
            "message": "Aucune notification non lue trouvée",
            "count": 0
        }    
    for notification in notifications:
        notification.is_read = True
    db.commit()
    return {
        "message": f"{len(notifications)} notifications marquées comme lues",
        "count": len(notifications)
    }
@router.delete("/{notification_id}")
async def delete_notification(notification_id: int, db: Session = Depends(get_session)):
    notification = db.query(Notification).filter(
        Notification.id == notification_id
    ).first()
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification non trouvée"
        )
    db.delete(notification)
    db.commit()
    return {"message": "Notification supprimée avec succès"}

@router.get("/user/{user_id}/unread-count")
async def get_unread_count(user_id: int, db: Session = Depends(get_session)):
    count = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).count()
    
    return {"unread_count": count}