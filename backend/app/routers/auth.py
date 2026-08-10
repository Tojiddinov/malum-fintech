from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.models.models import User
from app.services.auth import (
    verify_password, create_access_token, get_current_user,
    ROLE_LABELS
)

router = APIRouter(prefix="/auth", tags=["auth"])


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserOut(BaseModel):
    id: str
    tenant_id: str
    full_name: str
    email: str
    role: str
    role_label: str
    bank_name: Optional[str]
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]


import traceback
import app.state as app_state

@router.post("/login", response_model=TokenOut)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Email va parol bilan tizimga kirish (Async Beanie)."""
    if not app_state.db_ready:
        raise HTTPException(
            status_code=503,
            detail="Ma'lumotlar bazasi ulanmagan. Render environment variables va MongoDB Atlas IP whitelist tekshiring."
        )
    try:
        email = form_data.username.strip().lower()
        user = await User.find_one({"email": email})
        
        if not user or not verify_password(form_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email yoki parol noto'g'ri",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Hisob faolsizlashtirilgan")

        user.last_login = datetime.utcnow()
        await user.save()

        token = create_access_token(
            {"sub": user.email, "role": user.role, "tenant_id": user.tenant_id}
        )
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "tenant_id": user.tenant_id,
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role,
                "role_label": ROLE_LABELS.get(user.role, user.role),
                "bank_name": user.bank_name,
            }
        }
    except HTTPException:
        raise
    except Exception as err:
        print(f"LOGIN ERROR TYPE: {type(err).__name__}")
        print(f"LOGIN ERROR MSG: {err}")
        print("LOGIN ERROR TRACEBACK:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Login xizmati vaqtincha ishlamayapti")


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    """Joriy foydalanuvchi ma'lumoti."""
    return {
        "id": str(current_user.id),
        "tenant_id": current_user.tenant_id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "role_label": ROLE_LABELS.get(current_user.role, current_user.role),
        "bank_name": current_user.bank_name,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
        "last_login": current_user.last_login,
    }
