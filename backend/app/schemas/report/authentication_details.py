from typing import Optional
from pydantic import BaseModel

class AuthenticationDetailsBase(BaseModel):
    login_page_url: Optional[str]
    cookies: Optional[str]
    username: Optional[str]
    password: Optional[str]
    token: Optional[str]

class AuthenticationDetailsCreate(AuthenticationDetailsBase):
    pass

class AuthenticationDetailsRead(AuthenticationDetailsBase):
    id: int

    class Config:
        from_attributes = True

 