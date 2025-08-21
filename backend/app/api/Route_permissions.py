from typing import List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.configuration.auth_bearer import get_current_user
from app.models.notification import Notification
from app.models.permission import UserPermission
from app.models.permission_requests import PermissionRequest
from app.models.user import User
from app.schemas.permission import PermissionCreate, PermissionDisplay, PermissionType
from app.database.database import Base, engine, get_session
from app.schemas.permission_requests import PermissionRequestSchema
from app.services.notifier import Notifier

router = APIRouter(
    prefix="/permissions",
    tags=["Permissions Utilisateur"]
)
notifier= Notifier()
Base.metadata.create_all(engine)

@router.post("/attribuer", response_model=PermissionDisplay)
def attribuer_permissions(payload: PermissionCreate, db: Session = Depends(get_session)):
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    perm = db.query(UserPermission).filter_by(user_id=user.id).first()
    if not perm:
        perm = UserPermission(user_id=user.id)
        db.add(perm)

    perm.set_permissions_list([p.value for p in payload.permissions])
    db.commit()
    db.refresh(perm)

    return PermissionDisplay(
        user_id=user.id,
        permissions=perm.get_permissions_list()
    )

@router.get("/{user_id}", response_model=PermissionDisplay)
def visualiser_permissions(user_id: int, db: Session = Depends(get_session)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    if user.role == "admin":
        return PermissionDisplay(
            user_id=user.id,
            permissions=[t.value for t in PermissionType]
        )

    perm = db.query(UserPermission).filter_by(user_id=user.id).first()
    if not perm:
        return PermissionDisplay(user_id=user.id, permissions=[])

    return PermissionDisplay(
        user_id=user.id,
        permissions=perm.get_permissions_list()
    )
@router.delete("/revoquer", response_model=dict)
def revoquer_permissions(payload: PermissionCreate, db: Session = Depends(get_session)):
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    perm = db.query(UserPermission).filter_by(user_id=user.id).first()
    if not perm:
        return {"permissions_revoquees": 0}

    current_permissions = perm.get_permissions_list()
    updated_permissions = [p for p in current_permissions if p not in [t.value for t in payload.permissions]]

    perm.set_permissions_list(updated_permissions)
    db.commit()

    return {"permissions_revoquees": len(current_permissions) - len(updated_permissions)}

@router.get("/users/{user_id}", response_model=PermissionDisplay)
def get_user_permissions(user_id: int, db: Session = Depends(get_session)):
    user_permission = db.query(UserPermission).filter(UserPermission.user_id == user_id).first()
    if not user_permission:
        raise HTTPException(status_code=404, detail="Permissions not found for this user")
    permissions = user_permission.get_permissions_list()
    return {
        "user_id": user_id,
        "permissions": permissions
    }

@router.post("/request-permissions", response_model=dict)
def request_permissions(data: PermissionRequestSchema, session: Session = Depends(get_session)):
    user = session.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    request_entry = PermissionRequest(
        user_id=data.user_id,
        requested_permissions=data.requested_permissions
    )
    session.add(request_entry)
    session.commit()

    admin_user = session.query(User).filter_by(role="admin").first()
    if admin_user:
        message = f"L'utilisateur {user.first_name} {user.last_name} a demandé les permissions : {', '.join(data.requested_permissions)}"
        notifier.send_to_websocket(message, session, admin_user.id, notif_type="warning")

    return {"message": "La demande de permissions a été envoyée à l'administrateur."}
