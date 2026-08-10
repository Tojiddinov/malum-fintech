from datetime import datetime
from typing import Optional
from pydantic import Field
from beanie import Document, Indexed
from pymongo import ASCENDING, IndexModel


class User(Document):
    tenant_id: str = "amanat"
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
        indexes = [IndexModel([("tenant_id", ASCENDING)])]


class Transaction(Document):
    tenant_id: str = "amanat"
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
        use_revision = True
        indexes = [
            IndexModel(
                [("tenant_id", ASCENDING), ("transaction_id", ASCENDING)],
                unique=True,
            )
        ]


class AuditLog(Document):
    tenant_id: str = "amanat"
    transaction_id: str
    action: str
    actor: str
    actor_role: str = "user"
    comment: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "audit_logs"
        indexes = [
            IndexModel(
                [("tenant_id", ASCENDING), ("transaction_id", ASCENDING)]
            )
        ]


class Report(Document):
    tenant_id: str = "amanat"
    report_type: str
    format: str  # pdf / excel
    filters: dict = Field(default_factory=dict)
    filename: Optional[str] = None
    content_type: Optional[str] = None
    file_data: Optional[bytes] = None
    file_path: Optional[str] = None  # Legacy reports created before Mongo storage
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "reports"
        indexes = [
            IndexModel([("tenant_id", ASCENDING), ("created_at", ASCENDING)])
        ]


class Sequence(Document):
    tenant_id: str
    name: str
    value: int = 0

    class Settings:
        name = "sequences"
        indexes = [
            IndexModel(
                [("tenant_id", ASCENDING), ("name", ASCENDING)],
                unique=True,
            )
        ]


class DemoRequest(Document):
    name: str
    bank_name: str
    email: str
    phone: Optional[str] = None
    message: Optional[str] = None
    status: str = "new"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "demo_requests"
        indexes = [IndexModel([("created_at", ASCENDING)])]
