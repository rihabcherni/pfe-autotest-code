from sqlalchemy import (
    Boolean, Column, String, Integer,
    Enum, DateTime
)
from sqlalchemy.orm import relationship
from app.database.database import Base
import enum
from app.models.permission import UserPermission

class RoleEnum(enum.Enum):
    admin = "admin"
    tester = "tester"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(225), nullable=False, unique=True)
    password = Column(String, nullable=False)
    first_name = Column(String(225), nullable=False)
    last_name = Column(String(225), nullable=False)
    phone = Column(String(20), nullable=False)
    address = Column(String(225), nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.tester)
    is_verified = Column(Boolean, default=False)
    profile_image = Column(String, nullable=True)
    verification_code = Column(String, nullable=True)
    reset_token = Column(String, nullable=True)
    reset_token_expiry = Column(DateTime, nullable=True)

    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    preferences = relationship("SecurityPreferences", back_populates="user", uselist=False, cascade="all, delete-orphan")
    parametres_envoi_rapports = relationship("ParametresEnvoiRapports", back_populates="user", uselist=False, cascade="all, delete-orphan")
    permission = relationship("UserPermission", back_populates="user", uselist=False, cascade="all, delete-orphan", lazy="joined")
