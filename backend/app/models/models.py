from datetime import datetime
from typing import Optional, List, Any
from pydantic import Field
from beanie import Document, Indexed


class User(Document):
    full_name: str
    email: Indexed(str, unique=True)
    password_hash: str
    role: str  # admin / shariat_board / auditor
    bank_name: str = "O'zbekiston Islom Banki"
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None

    class Settings:
        name = "users"


class Transaction(Document):
    transaction_id: str  # "#0001" formatida
    type: str  # Murabaha / Musharaka
    amount: float
    currency: str = "UZS"  # UZS / USD
    status: str = "pending"  # pending / reviewing / approved / rejected (or kutilmoqda / korib_chiqilmoqda / tasdiqlangan / rad_etilgan)
    responsible_person: str
    counterparty: str
    description: Optional[str] = None
    risk_score: str = "low"  # low / medium / high (or past / orta / yuqori)
    risk_details: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "transactions"


class AuditLog(Document):
    transaction_id: str
    action: str
    actor: str
    actor_role: str = "user"
    comment: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "audit_logs"


class Report(Document):
    report_type: str
    format: str  # pdf / excel
    filters: dict = {}
    file_path: str
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "reports"
