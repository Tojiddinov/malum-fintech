"""
JWT Authentication Service for MongoDB / Beanie
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.hash import pbkdf2_sha256
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv

from app.models.models import User

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "amanat-super-secret-key-2024-change-in-production")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8  # 8 hours

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

ROLE_PERMISSIONS = {
    "admin": ["read", "write", "approve", "reject", "manage_users", "reports"],
    "shariat_board": ["read", "approve", "reject", "workflow"],
    "auditor": ["read", "reports"],
}

ROLE_LABELS = {
    "admin": "Administrator",
    "shariat_board": "Shariat Kengashi",
    "auditor": "Auditor",
}


def verify_password(plain: str, hashed: str) -> bool:
    if not hashed:
        return False
    try:
        return pbkdf2_sha256.verify(plain, hashed)
    except Exception:
        return False


def hash_password(plain: str) -> str:
    return pbkdf2_sha256.hash(plain)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token noto'g'ri yoki muddati o'tgan",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    payload = decode_token(token)
    email: str = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Token noto'g'ri")
    user = await User.find_one(User.email == email)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Foydalanuvchi topilmadi yoki faol emas")
    return user


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Faqat adminlar uchun")
    return current_user


async def require_shariat_or_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ("admin", "shariat_board"):
        raise HTTPException(status_code=403, detail="Faqat Shariat kengashi yoki admin uchun")
    return current_user
