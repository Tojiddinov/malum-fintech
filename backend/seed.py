"""Explicit CLI entry point for creating the MIZAN demo data."""

import asyncio

from beanie import init_beanie

from app.database import DB_NAME, get_motor_client
from app.models.models import AuditLog, DemoRequest, Report, Sequence, Transaction, User
from app.services.migration_service import migrate_legacy_data
from app.services.seed_service import seed_data


async def main() -> None:
    client = await get_motor_client()
    try:
        database = client[DB_NAME]
        await init_beanie(
            database=database,
            document_models=[User, Transaction, AuditLog, Report, Sequence, DemoRequest],
        )
        await migrate_legacy_data()
        await seed_data()
        print("Demo data is ready.")
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(main())
