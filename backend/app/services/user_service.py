from fastapi import HTTPException
from typing import List, Type
from sqlalchemy.orm import Session
from app.models.report import Report
from app.schemas.user import UserUpdate
from app.models import user
from app.models.user import User as UserModel
from sqlalchemy.orm import joinedload

class BaseRepoUser:
    def get_user(self, db: Session, user_id: int):
        return db.query(user.User).filter(user.User.id == user_id).first()
    
    def get_user_permission(self, db: Session)-> List[Type[UserModel]]:
        return db.query(UserModel).all().options(joinedload(user.User.permission)).all()


    def get_users(self, db: Session) -> List[Type[UserModel]]:
        return db.query(UserModel).all()

    def get_reports_by_user(self, user_id: int, db: Session):
        return db.query(Report).filter(Report.user_id == user_id).all()

    def delete_user(self, user_id: int, db: Session):
        user_to_delete = self.get_user(db, user_id)
        if user_to_delete:
            reports_to_delete = self.get_reports_by_user(user_id, db)
            for report in reports_to_delete:
                db.delete(report)

            db.delete(user_to_delete)
            db.commit()
            print(f"User with ID {user_id} and their reports deleted successfully.")
        else:
            raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found.")

    def update_user(self, user_id: int, user_update: UserUpdate, db: Session):
        user_to_update = self.get_user(db, user_id)
        if not user_to_update:
            raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found.")

        for key, value in user_update.dict(exclude_unset=True).items():
            setattr(user_to_update, key, value)

        db.commit()
        db.refresh(user_to_update)
        return user_to_update
