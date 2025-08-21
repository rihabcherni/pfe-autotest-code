import json
from sqlalchemy import Column, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.database.database import Base

class UserPermission(Base):
    __tablename__ = "user_permissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    permission = Column(Text, nullable=False, default="[]")

    user = relationship("User", back_populates="permission", uselist=False)


    def get_permissions_list(self):
        return json.loads(self.permission) if self.permission else []

    def set_permissions_list(self, permissions: list[str]):
        self.permission = json.dumps(permissions)

    def __repr__(self):
        return f"<UserPermission(id={self.id}, user_id={self.user_id}, permissions={self.get_permissions_list()})>"
