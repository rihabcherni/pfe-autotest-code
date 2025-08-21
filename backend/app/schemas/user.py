from typing import Annotated, List, Optional
from pydantic import BaseModel, StringConstraints

from app.schemas.permission import PermissionType

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str
    phone: str
    address: str
    role: str
    is_verified: bool = None
    verification_code: str= None
    
class UserUpdate(BaseModel):
    first_name: str = None
    email: str = None
    password: str = None
    last_name: str = None
    phone: str = None
    address: str = None

class authenticationRequest(BaseModel):
    email: str
    password: str

class TokenSchema(BaseModel):
    access_token: str


class UserProfile(BaseModel):
    email: str
    first_name: str
    last_name: str
    phone: str
    address: str
    role: str
    profile_image: Optional[str] = None
    permissions: List[PermissionType] = []

    class Config:
        from_attributes = True


class EditProfile(BaseModel):
    first_name: Optional[Annotated[str, StringConstraints(strip_whitespace=True)]] = None
    last_name: Optional[Annotated[str, StringConstraints(strip_whitespace=True)]] = None
    email: Optional[Annotated[str, StringConstraints(strip_whitespace=True)]] = None
    phone: Optional[Annotated[str, StringConstraints(strip_whitespace=True)]] = None
    address: Optional[Annotated[str, StringConstraints(strip_whitespace=True)]] = None


class VerifyCode(BaseModel):
    email: str
    code: str

class ChangePassword(BaseModel):
    current_password: str
    new_password: str

class UserOut(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    phone: str
    address: str
    role: str
    is_verified: bool
    profile_image: Optional[str] = None
    permissions: List[PermissionType] = []

    class Config:
        from_attributes = True

class UserReadNested(BaseModel):
    first_name: str
    last_name: str
    profile_image: Optional[str] = None

    class Config:
        from_attributes = True