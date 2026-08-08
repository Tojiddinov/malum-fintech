"""
Demo seed script for Amanat MVP (Users + Transactions + Audit Logs)
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, SessionLocal, Base
from app.models.models import User, Transaction, AuditLog
from app.services.auth import hash_password
from app.services.aml_kyc import run_aml_kyc_check
from datetime import datetime, timedelta
import random

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Seed Users
seed_users = [
    {
        "full_name": "Farrukh Muminov (Admin)",
        "email": "admin@amanat.uz",
        "password": "admin123",
        "role": "admin",
        "bank_name": "Amanat Markaziy Banki",
    },
    {
        "full_name": "Dr. Hamidulla Nazarov (Kengash Raisi)",
        "email": "kengash@amanat.uz",
        "password": "kengash123",
        "role": "shariat_board",
        "bank_name": "O'zbekiston Islom Banki Shariat Kengashi",
    },
    {
        "full_name": "Azizbek Karimov (Auditor)",
        "email": "auditor@amanat.uz",
        "password": "auditor123",
        "role": "auditor",
        "bank_name": "O'zbekiston Milliy Auditi",
    },
]

for u in seed_users:
    existing = db.query(User).filter(User.email == u["email"]).first()
    if not existing:
        user = User(
            full_name=u["full_name"],
            email=u["email"],
            password_hash=hash_password(u["password"]),
            role=u["role"],
            bank_name=u["bank_name"],
            is_active=True,
        )
        db.add(user)

db.commit()
print("✅ Seed foydalanuvchilar o'rnatildi: admin@amanat.uz, kengash@amanat.uz, auditor@amanat.uz")

# Seed Transactions if table empty
if db.query(Transaction).count() == 0:
    demo_transactions = [
        {"type": "Murabaha",  "amount": 250_000_000, "currency": "UZS", "responsible_person": "Dilshod Yusupov",  "counterparty": "TashkentAgroLtd",    "description": "Qishloq xo'jaligi jihozlarini moliyalashtirish (Murabaha asosida)",    "status": "approved"},
        {"type": "Musharaka", "amount": 850_000_000, "currency": "UZS", "responsible_person": "Nodira Karimova",  "counterparty": "BuildersCo LLC",       "description": "Ko'p qavatli uy-joy qurilishiga sheriklik (Musharaka)",             "status": "reviewing"},
        {"type": "Murabaha",  "amount":  45_000_000, "currency": "UZS", "responsible_person": "Jasur Mirzayev",   "counterparty": "FastFood Samarkand",   "description": "Restoran jihozlarini sotib olish",                                "status": "pending"},
        {"type": "Musharaka", "amount": 120_000_000, "currency": "USD", "responsible_person": "Zulfiya Hasanova", "counterparty": "GreenEnergy Uz",       "description": "Quyosh energiyasi loyihasiga investitsiya",                       "status": "pending"},
        {"type": "Murabaha",  "amount": 680_000_000, "currency": "UZS", "responsible_person": "Alisher Tojimatov","counterparty": "offshore anon corp",   "description": "Import operatsiyasi",                                             "status": "rejected"},
        {"type": "Murabaha",  "amount":  18_500_000, "currency": "UZS", "responsible_person": "Malika Ergasheva", "counterparty": "UrbanRetail Tashkent", "description": "Do'kon jihozlarini moliyalashtirish",                             "status": "approved"},
    ]

    for d in demo_transactions:
        risk_score, risk_details = run_aml_kyc_check(d["type"], d["amount"], d.get("counterparty"))
        days_ago = random.randint(1, 14)
        created = datetime.utcnow() - timedelta(days=days_ago)
        tx = Transaction(
            type=d["type"],
            amount=d["amount"],
            currency=d["currency"],
            responsible_person=d["responsible_person"],
            counterparty=d.get("counterparty"),
            description=d.get("description"),
            risk_score=risk_score,
            risk_details=risk_details,
            status=d["status"],
            created_at=created,
            updated_at=created,
        )
        db.add(tx)
        db.flush()

        db.add(AuditLog(
            transaction_id=tx.id, action="created",
            actor=d["responsible_person"],
            comment=f"Bitim yaratildi. AML/KYC natija: {risk_score.upper()}",
            new_status="pending", timestamp=created,
        ))

        if d["status"] in ("reviewing", "approved", "rejected"):
            reviewed_at = created + timedelta(hours=random.randint(2, 12))
            db.add(AuditLog(
                transaction_id=tx.id, action="submitted_for_review",
                actor=d["responsible_person"],
                comment="Shariat kengashiga ko'rib chiqish uchun yuborildi",
                previous_status="pending", new_status="reviewing",
                timestamp=reviewed_at,
            ))

        if d["status"] == "approved":
            approved_at = created + timedelta(hours=random.randint(14, 48))
            db.add(AuditLog(
                transaction_id=tx.id, action="approved",
                actor="Dr. Hamidulla Nazarov (Kengash Raisi)",
                comment="Bitim Shariat talablariga mos keladi. Tasdiqlandi.",
                previous_status="reviewing", new_status="approved",
                timestamp=approved_at,
            ))

        if d["status"] == "rejected":
            rejected_at = created + timedelta(hours=random.randint(6, 24))
            db.add(AuditLog(
                transaction_id=tx.id, action="rejected",
                actor="Shariat Kengashi",
                comment="Kontragent noaniq. AML tekshiruvi natijasi yuqori risk ko'rsatdi. Rad etildi.",
                previous_status="reviewing", new_status="rejected",
                timestamp=rejected_at,
            ))

    db.commit()
    print("✅ Demo bitimlar yaratildi.")

db.close()
