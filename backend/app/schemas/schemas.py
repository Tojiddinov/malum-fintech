from datetime import datetime
from typing import Literal, Optional, List
from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


UserRole = Literal["admin", "shariat_board", "auditor"]
TransactionType = Literal["Murabaha", "Musharaka"]
Currency = Literal["UZS", "USD"]


# ── Auth & Users ──────────────────────────────────────────────────────────────

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


class UserCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: UserRole
    bank_name: Optional[str] = Field(
        default="O'zbekiston Islom Banki", max_length=160
    )


class UserUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    full_name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(default=None, min_length=8, max_length=128)
    role: Optional[UserRole] = None
    bank_name: Optional[str] = Field(default=None, max_length=160)
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
    model_config = ConfigDict(str_strip_whitespace=True)

    type: TransactionType
    amount: float = Field(gt=0, le=1_000_000_000_000_000)
    currency: Currency = "UZS"
    responsible_person: Optional[str] = Field(default=None, max_length=120)
    counterparty: Optional[str] = Field(default="", max_length=200)
    description: Optional[str] = Field(default=None, max_length=2_000)


class TransactionUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    type: Optional[TransactionType] = None
    amount: Optional[float] = Field(
        default=None, gt=0, le=1_000_000_000_000_000
    )
    counterparty: Optional[str] = Field(default=None, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2_000)
    responsible_person: Optional[str] = Field(default=None, max_length=120)
    currency: Optional[Currency] = None

    @model_validator(mode="after")
    def prevent_null_required_values(self):
        for field_name in ("type", "amount", "currency", "responsible_person"):
            if field_name in self.model_fields_set and getattr(self, field_name) is None:
                raise ValueError(f"{field_name} null bo'lishi mumkin emas")
        return self


class TransactionStatusChange(BaseModel):
    comment: Optional[str] = Field(default=None, max_length=2_000)


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
    audit_logs: List[AuditLogOut] = Field(default_factory=list)


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


class DemoRequestCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=2, max_length=120)
    bank_name: str = Field(min_length=2, max_length=160)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=40)
    message: Optional[str] = Field(default=None, max_length=2_000)
