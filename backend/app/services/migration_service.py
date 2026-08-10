"""Small startup migrations for documents created by earlier demo releases."""

from app.models.models import AuditLog, Report, Transaction, User


DEFAULT_TENANT_ID = "amanat"


async def migrate_legacy_data() -> None:
    """Attach legacy documents to the default tenant before scoped queries run."""
    for model in (User, Transaction, AuditLog, Report):
        await model.get_motor_collection().update_many(
            {
                "$or": [
                    {"tenant_id": {"$exists": False}},
                    {"tenant_id": None},
                    {"tenant_id": ""},
                ]
            },
            {"$set": {"tenant_id": DEFAULT_TENANT_ID}},
        )

    status_aliases = {
        "kutilmoqda": "pending",
        "korib_chiqilmoqda": "reviewing",
        "tasdiqlangan": "approved",
        "rad_etilgan": "rejected",
    }
    risk_aliases = {"past": "low", "orta": "medium", "yuqori": "high"}
    for legacy_value, canonical_value in status_aliases.items():
        await Transaction.get_motor_collection().update_many(
            {"status": legacy_value},
            {"$set": {"status": canonical_value}},
        )
    for legacy_value, canonical_value in risk_aliases.items():
        await Transaction.get_motor_collection().update_many(
            {"risk_score": legacy_value},
            {"$set": {"risk_score": canonical_value}},
        )

    await User.get_motor_collection().update_many(
        {
            "bank_name": {
                "$in": ["Malum Markaziy Banki", "Amanat Markaziy Banki"]
            }
        },
        {"$set": {"bank_name": "MIZAN Markaziy Banki"}},
    )
