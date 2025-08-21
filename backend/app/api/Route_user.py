
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.database import Base, engine, get_session
from app.schemas.user import UserOut, UserUpdate, UserCreate
from app.configuration.utils import get_hashed_password
from app.services.user_service import BaseRepoUser

router = APIRouter(tags=["users"])

class Controller:
    Base.metadata.create_all(engine)

@router.get("/all_users/", response_model=List[UserOut])
def get_user_permission(db: Session = Depends(get_session)):
    repo = BaseRepoUser()
    users = repo.get_users(db)
    for user in users:
        if user.permission:
            user.permissions = user.permission.get_permissions_list()
        else:
            user.permissions = []

    return users


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_session)):
    repo = BaseRepoUser()
    user_to_delete = repo.get_user(db, user_id)
    if user_to_delete:
        repo.delete_user(user_id, db)
        return {"message": f"User with ID {user_id} deleted successfully."}
    else:
        raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found.")
