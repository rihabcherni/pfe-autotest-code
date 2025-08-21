import secrets
from passlib.context import CryptContext
from jose import jwt
from sqlalchemy.orm import Session

from app.models.permission import UserPermission
from app.models.user import User

ALGORITHM = "HS256"
JWT_SECRET_KEY = secrets.token_urlsafe(32) 
password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_hashed_password(password: str) -> str:
    return password_context.hash(password)

def verify_password(password: str, hashed_pass: str) -> bool:
    return password_context.verify(password, hashed_pass)

def create_access_token(user: User):
    claims = {
        "id": int(user.id),
        "email": str(user.email),
        "first_name": str(user.first_name),
        "last_name": str(user.last_name),
        "phone": str(user.phone),
        "address": str(user.address),
        "is_verified": bool(user.is_verified),
        "role": str(user.role),
        "profile_image": str(user.profile_image),
    }
    return jwt.encode(claims, JWT_SECRET_KEY, algorithm=ALGORITHM)

def add_administrator(db: Session):
    admin_email = "admin@gmail.com"
    
    existing_admin = db.query(User).filter_by(email=admin_email).first()
    if existing_admin:
        print("Administrator already exists.")
        existing_permission = db.query(UserPermission).filter_by(user_id=existing_admin.id).first()
        if not existing_permission:
            user_permission = UserPermission(
                user_id=existing_admin.id,
                permission='["all"]'
            )
            db.add(user_permission)
            db.commit()
            print("Admin permissions added.")
        else:
            print("Admin permissions already exist.")
        return
    new_admin = User(
        email=admin_email,
        password=get_hashed_password("admin123"),
        first_name="admin",
        last_name="admin",
        phone="55142365",
        address="Tunis",
        role="admin",
        is_verified=True
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)  

    user_permission = UserPermission(
        user_id=new_admin.id,
        permission='["all"]' 
    )
    db.add(user_permission)
    db.commit()
    print("Administrator added successfully.")
