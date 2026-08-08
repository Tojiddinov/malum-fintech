from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from beanie import PydanticObjectId
from pydantic import BaseModel, EmailStr

from app.models.models import User
from app.schemas.schemas import UserCreate, UserUpdate, UserOut
from app.services.auth import (
    require_admin, hash_password, get_current_user, ROLE_LABELS
)

router = APIRouter(prefix="/users", tags=["users"])


def _serialize_user(u: User) -> dict:
    return {
        "id": str(u.id),
        "full_name": u.full_name,
        "email": u.email,
        "role": u.role,
        "role_label": ROLE_LABELS.get(u.role, u.role),
        "bank_name": u.bank_name,
        "is_active": u.is_active,
        "created_at": u.created_at,
        "last_login": u.last_login,
    }


@router.get("/", response_model=List[UserOut])
async def list_users(current_user: User = Depends(require_admin)):
    """Barcha foydalanuvchilar (Async Motor/Beanie)."""
    users = await User.find_all().sort("+created_at").to_list()
    return [_serialize_user(u) for u in users]


@router.post("/", response_model=UserOut, status_code=201)
async def create_user(payload: UserCreate, current_user: User = Depends(require_admin)):
    """Yangi foydalanuvchi yaratish (faqat admin)."""
    existing = await User.find_one(User.email == payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="Ushbu email bilan foydalanuvchi mavjud")

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        bank_name=payload.bank_name or "O'zbekiston Islom Banki",
        is_active=True,
    )
    await user.insert()
    return _serialize_user(user)


@router.put("/{user_id}", response_model=UserOut)
async def update_user(user_id: str, payload: UserUpdate, current_user: User = Depends(require_admin)):
    """Foydalanuvchini tahrirlash (faqat admin)."""
    user = None
    if PydanticObjectId.is_valid(user_id):
        user = await User.get(PydanticObjectId(user_id))

    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")

    if payload.email and payload.email != user.email:
        dup = await User.find_one(User.email == payload.email)
        if dup:
            raise HTTPException(status_code=400, detail="Ushbu email band")
        user.email = payload.email

    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.password:
        user.password_hash = hash_password(payload.password)
    if payload.role is not None:
        user.role = payload.role
    if payload.bank_name is not None:
        user.bank_name = payload.bank_name
    if payload.is_active is not None:
        user.is_active = payload.is_active

    await user.save()
    return _serialize_user(user)


@router.delete("/{user_id}/deactivate", response_model=UserOut)
async def deactivate_user(user_id: str, current_user: User = Depends(require_admin)):
    """Foydalanuvchini faolsizlashtirish (faqat admin)."""
    user = None
    if PydanticObjectId.is_valid(user_id):
        user = await User.get(PydanticObjectId(user_id))

    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")
    if str(user.id) == str(current_user.id):
        raise HTTPException(status_code=400, detail="O'zingizni faolsizlashtira olmaysiz")

    user.is_active = False
    await user.save()
    return _serialize_user(user)


@router.get("/{user_id}/activity")
async def get_user_activity(user_id: str, current_user: User = Depends(require_admin)):
    """Foydalanuvchi so'nggi faollik ma'lumotlari."""
    user = None
    if PydanticObjectId.is_valid(user_id):
        user = await User.get(PydanticObjectId(user_id))

    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")

    return {
        "id": str(user.id),
        "full_name": user.full_name,
        "email": user.email,
        "last_login": user.last_login,
        "is_active": user.is_active,
    }
