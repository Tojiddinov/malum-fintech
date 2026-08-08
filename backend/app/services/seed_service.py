"""
Async Seed Data Service for MongoDB / Beanie
"""
import random
from datetime import datetime, timedelta
from app.models.models import User, Transaction, AuditLog
from app.services.auth import hash_password
from app.services.aml_kyc import run_aml_kyc_check


async def seed_data():
    """Seeds demo users and demo transactions if collections are empty."""
    # 1. Seed Users
    if await User.count() == 0:
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
            user = User(
                full_name=u["full_name"],
                email=u["email"],
                password_hash=hash_password(u["password"]),
                role=u["role"],
                bank_name=u["bank_name"],
                is_active=True,
            )
            await user.insert()
        print("✅ MongoDB Seed users created.")

    # 2. Seed Transactions & Audit Logs
    if await Transaction.count() == 0:
        demo_transactions = [
            {"type": "Murabaha",  "amount": 250_000_000, "currency": "UZS", "responsible_person": "Dilshod Yusupov",  "counterparty": "TashkentAgroLtd",    "description": "Qishloq xo'jaligi jihozlarini moliyalashtirish (Murabaha asosida)",    "status": "approved"},
            {"type": "Musharaka", "amount": 850_000_000, "currency": "UZS", "responsible_person": "Nodira Karimova",  "counterparty": "BuildersCo LLC",       "description": "Ko'p qavatli uy-joy qurilishiga sheriklik (Musharaka)",             "status": "reviewing"},
            {"type": "Murabaha",  "amount":  45_000_000, "currency": "UZS", "responsible_person": "Jasur Mirzayev",   "counterparty": "FastFood Samarkand",   "description": "Restoran jihozlarini sotib olish",                                "status": "pending"},
            {"type": "Musharaka", "amount": 120_000_000, "currency": "USD", "responsible_person": "Zulfiya Hasanova", "counterparty": "GreenEnergy Uz",       "description": "Quyosh energiyasi loyihasiga investitsiya",                       "status": "pending"},
            {"type": "Murabaha",  "amount": 680_000_000, "currency": "UZS", "responsible_person": "Alisher Tojimatov","counterparty": "offshore anon corp",   "description": "Import operatsiyasi",                                             "status": "rejected"},
            {"type": "Murabaha",  "amount":  18_500_000, "currency": "UZS", "responsible_person": "Malika Ergasheva", "counterparty": "UrbanRetail Tashkent", "description": "Do'kon jihozlarini moliyalashtirish",                             "status": "approved"},
        ]

        for i, d in enumerate(demo_transactions, start=1):
            risk_score, risk_details = run_aml_kyc_check(d["type"], d["amount"], d.get("counterparty"))
            days_ago = random.randint(1, 14)
            created = datetime.utcnow() - timedelta(days=days_ago)

            tx_code = f"#{str(i).zfill(4)}"
            tx = Transaction(
                transaction_id=tx_code,
                type=d["type"],
                amount=d["amount"],
                currency=d["currency"],
                responsible_person=d["responsible_person"],
                counterparty=d.get("counterparty") or "—",
                description=d.get("description"),
                risk_score=risk_score,
                risk_details=risk_details,
                status=d["status"],
                created_at=created,
                updated_at=created,
            )
            await tx.insert()

            # Audit logs
            log1 = AuditLog(
                transaction_id=str(tx.id),
                action="created",
                actor=d["responsible_person"],
                actor_role="user",
                comment=f"Bitim yaratildi. AML/KYC natija: {risk_score.upper()}",
                timestamp=created,
            )
            await log1.insert()

            if d["status"] in ("reviewing", "approved", "rejected"):
                reviewed_at = created + timedelta(hours=random.randint(2, 12))
                log2 = AuditLog(
                    transaction_id=str(tx.id),
                    action="submitted_for_review",
                    actor=d["responsible_person"],
                    actor_role="user",
                    comment="Shariat kengashiga ko'rib chiqish uchun yuborildi",
                    timestamp=reviewed_at,
                )
                await log2.insert()

            if d["status"] == "approved":
                approved_at = created + timedelta(hours=random.randint(14, 48))
                log3 = AuditLog(
                    transaction_id=str(tx.id),
                    action="approved",
                    actor="Dr. Hamidulla Nazarov (Kengash Raisi)",
                    actor_role="shariat_board",
                    comment="Bitim Shariat talablariga mos keladi. Tasdiqlandi.",
                    timestamp=approved_at,
                )
                await log3.insert()

            if d["status"] == "rejected":
                rejected_at = created + timedelta(hours=random.randint(6, 24))
                log4 = AuditLog(
                    transaction_id=str(tx.id),
                    action="rejected",
                    actor="Shariat Kengashi",
                    actor_role="shariat_board",
                    comment="Kontragent noaniq. AML tekshiruvi natijasi yuqori risk ko'rsatdi. Rad etildi.",
                    timestamp=rejected_at,
                )
                await log4.insert()

        print("✅ MongoDB Seed transactions created.")
