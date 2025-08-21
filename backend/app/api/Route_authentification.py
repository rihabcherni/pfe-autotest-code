import base64
from datetime import datetime, timedelta
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
import os
from uuid import uuid4
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from typing import Set
import random
from app.configuration.auth_bearer import get_current_user
from app.database.database import get_session
from app.models.notification import Notification
from app.models.permission import UserPermission
from app.schemas.user import ( ChangePassword, EditProfile, UserCreate, UserProfile, VerifyCode, authenticationRequest, TokenSchema)
from jinja2 import Environment, FileSystemLoader
from app.configuration.utils import (get_hashed_password, verify_password, create_access_token)
from app.models.user import User
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv
import os
load_dotenv()

router = APIRouter(tags=["Authentification"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
token_blacklist: Set[str] = set()

@router.post("/signup")
async def register_user(users: UserCreate, session: Session = Depends(get_session)):
    existing_user = session.query(User).filter_by(email=users.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    verification_code = str(random.randint(100000, 999999))
    new_user = User(
        email=users.email,
        password=get_hashed_password(users.password),
        first_name=users.first_name,
        last_name=users.last_name,
        phone=users.phone,
        address=users.address,
        verification_code=verification_code,
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    user_permission = UserPermission(
        user_id=new_user.id,
        permission="[]" 
    )
    admin_user = session.query(User).filter_by(role="admin").first() 
    if admin_user:
        notif = Notification(
            message = f"New user registration: {new_user.first_name} {new_user.last_name} ({new_user.email})",
            user_id=admin_user.id,
            type="info"  
        )
        session.add(notif)
        session.commit()
        session.refresh(notif)

    session.add(user_permission)
    session.commit()

    SMTP_USERNAME = os.getenv("SMTP_USERNAME")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
    SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")

    current_dir = os.path.dirname(__file__)
    logo_path = os.path.join(current_dir, "..", "static", "logo.png")
    logo_path = os.path.abspath(logo_path)

    with open(logo_path, "rb") as image_file:
        base64_image = base64.b64encode(image_file.read()).decode()

    template_env = Environment(loader=FileSystemLoader("templates"))
    template = template_env.get_template("verify_email_template.html")
    name= users.first_name+" "+ users.last_name
    html_content = template.render(name=name, email=users.email,code=verification_code, logo=base64_image, front_link= os.getenv("FRONT_LINK"))

    msg = MIMEMultipart()
    msg['Subject'] = "Verify your email address"
    msg['From'] = SMTP_USERNAME
    msg['To'] = users.email

    msg.attach(MIMEText(html_content, "html"))

    image_part = MIMEImage(base64.b64decode(base64_image))
    image_part.add_header('Content-ID', '<logo_image>') 
    msg.attach(image_part)

    try:
        with smtplib.SMTP_SSL(SMTP_SERVER, 465) as smtp:
            smtp.login(SMTP_USERNAME, SMTP_PASSWORD)
            smtp.sendmail(SMTP_USERNAME, users.email, msg.as_string())
        print("✅ Email de vérification envoyé avec succès.")
    except Exception as e:
        print(f"❌ Erreur lors de l'envoi de l'email : {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de l'envoi de l'e-mail.")
    
    return {"message": "Utilisateur créé avec succès. Veuillez vérifier votre email."}

@router.post('/login', response_model=TokenSchema)
def login(request: authenticationRequest, db: Session = Depends(get_session)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.password):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Please verify your email before logging in.")

    access_token = create_access_token(user)
    return {"access_token": access_token}

@router.get("/profile", response_model=UserProfile)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_session)):
    user_permission = db.query(UserPermission).filter(UserPermission.user_id == current_user.id).first()
    permissions = user_permission.get_permissions_list() if user_permission else []
    user_permission = db.query(UserPermission).filter_by(user_id=current_user.id).first()
    print("Permission entry:", user_permission)

    return UserProfile(
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        phone=current_user.phone,
        address=current_user.address,
        role=current_user.role.value,
        profile_image=current_user.profile_image,
        permissions= permissions
    )


@router.put("/edit-profile")
def edit_profile(
    updated_data: EditProfile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    user_db = db.query(User).filter(User.id == current_user.id).first()
    if not user_db:
        raise HTTPException(status_code=404, detail="User not found")

    for field, value in updated_data.dict(exclude_unset=True).items():
        setattr(user_db, field, value.strip() if isinstance(value, str) else value)

    db.commit()
    db.refresh(user_db)
    
    new_access_token = create_access_token(user_db)
    
    return {
        "message": "Profile updated successfully",
        "user": {
            "id": user_db.id,
            "email": user_db.email,
            "first_name": user_db.first_name,
            "last_name": user_db.last_name,
            "phone": user_db.phone,
            "address": user_db.address,
            "profile_image": user_db.profile_image,
            "is_verified": user_db.is_verified
        },
        "access_token": new_access_token
    }

@router.post("/logout")
def logout(token: str = Depends(oauth2_scheme)):
    token_blacklist.add(token)
    return {"msg": "Déconnexion réussie"}

@router.post("/verify-email")
def verify_email(data: VerifyCode, session: Session = Depends(get_session)):
    user = session.query(User).filter_by(email=data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_verified:
        return {"message": "User already verified"}
    if user.verification_code != data.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    user.is_verified = True
    user.verification_code = None
    session.commit()
    return {"message": "Email verified successfully"}

class PasswordResetRequest(BaseModel):
    email: str

@router.post("/forgot-password")
def request_password_reset(data: PasswordResetRequest, db: Session = Depends(get_session)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    reset_token = str(uuid4())
    user.reset_token = reset_token
    user.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)

    db.commit()

    reset_link = f"{os.getenv('FRONT_LINK')}/reset-password?token={reset_token}"
    template_env = Environment(loader=FileSystemLoader("templates"))
    template = template_env.get_template("reset_password_template.html")
    html_content = template.render(
        reset_link=reset_link,
        front_link=os.getenv("FRONT_LINK") 
    )
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Reset Your Password"
    msg["From"] = os.getenv("SMTP_USERNAME")
    msg["To"] = data.email

    msg.attach(MIMEText(html_content, "html"))
    try:
        with smtplib.SMTP_SSL(os.getenv("SMTP_SERVER", "smtp.gmail.com"), 465) as smtp:
            smtp.login(os.getenv("SMTP_USERNAME"), os.getenv("SMTP_PASSWORD"))
            smtp.sendmail(msg["From"], [msg["To"]], msg.as_string())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send reset email: {str(e)}")

    return {"message": "Un email de réinitialisation de mot de passe a été envoyé."}

class ResetPasswordData(BaseModel):
    token: str
    new_password: str

@router.post("/reset-password")
def reset_password(data: ResetPasswordData, db: Session = Depends(get_session)):
    user = db.query(User).filter(User.reset_token == data.token).first()
    if not user or not user.reset_token_expiry or user.reset_token_expiry < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user.password = get_hashed_password(data.new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    db.commit()
    return {"message": "Password has been reset successfully"}

@router.post("/change-password")
def change_password(
    passwords: ChangePassword, current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(passwords.current_password, user.password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    if passwords.current_password == passwords.new_password:
        raise HTTPException(status_code=400, detail="The new password must be different from the old one")
    user.password = get_hashed_password(passwords.new_password)
    db.commit()
    return {"message": "Password changed successfully"}

@router.post("/upload-profile-image")
def upload_profile_image(
    file: UploadFile = File(...), db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Ce fichier n'est pas une image")
    
    ext = file.filename.split('.')[-1]
    filename = f"{uuid4()}.{ext}"
    UPLOAD_DIR = "static/profile_images"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    user = db.query(User).filter(User.id == current_user.id).first()
    
    if user.profile_image:
        old_image_path = os.path.join(UPLOAD_DIR, user.profile_image)
        if os.path.isfile(old_image_path):
            os.remove(old_image_path)
    
    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())
    
    user.profile_image = filename
    db.commit()
    db.refresh(user)
    
    new_access_token = create_access_token(user)
    
    return {
        "message": "Profile image updated successfully",
        "profile_image": filename,
        "access_token": new_access_token
    }