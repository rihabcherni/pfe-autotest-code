from pydantic import BaseModel

class ContactMessageCreate(BaseModel):
    name: str
    email: str
    subject: str
    message: str

    class Config:
        from_attributes = True

class ContactMessageOut(ContactMessageCreate):
    id: int

    class Config:
        from_attributes = True