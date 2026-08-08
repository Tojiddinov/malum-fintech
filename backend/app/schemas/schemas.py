from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, Field


# ── Auth & Users ──────────────────────────────────────────────────────────────

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserOut(BaseModel):
    id: str
    full_name: str
    email: str
    role: str
    role_label: str
    bank_name: Optional[str]
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str  # admin | shariat_board | auditor
    bank_name: Optional[str] = "O'zbekiston Islom Banki"


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[str] = None
    bank_name: Optional[str] = None
    is_active: Optional[bool] = None


# ── AuditLog ──────────────────────────────────────────────────────────────────

class AuditLogOut(BaseModel):
    id: str
    transaction_id: str
    action: str
    actor: str
    actor_role: str = "user"
    comment: Optional[str] = None
    timestamp: datetime


# ── Transaction ───────────────────────────────────────────────────────────────

class TransactionCreate(BaseModel):
    type: str                          # Murabaha | Musharaka
    amount: float
    currency: str = "UZS"
    responsible_person: Optional[str] = None
    counterparty: Optional[str] = ""
    description: Optional[str] = None


class TransactionUpdate(BaseModel):
    type: Optional[str] = None
    amount: Optional[float] = None
    counterparty: Optional[str] = None
    description: Optional[str] = None
    responsible_person: Optional[str] = None


class TransactionStatusChange(BaseModel):
    actor: Optional[str] = None
    comment: Optional[str] = None


class TransactionOut(BaseModel):
    id: str
    transaction_id: str
    type: str
    amount: float
    currency: str
    status: str
    responsible_person: str
    counterparty: Optional[str]
    description: Optional[str]
    risk_score: Optional[str]
    risk_details: Optional[str]
    created_at: datetime
    updated_at: datetime
    audit_logs: List[AuditLogOut] = []


class TransactionListItem(BaseModel):
    id: str
    transaction_id: str
    type: str
    amount: float
    currency: str
    status: str
    responsible_person: str
    counterparty: Optional[str]
    risk_score: Optional[str]
    created_at: datetime
