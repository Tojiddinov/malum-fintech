import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = "amanat_db"
IS_PRODUCTION = (
    os.getenv("ENVIRONMENT", "development").lower() == "production"
    or os.getenv("RENDER", "").lower() == "true"
)

async def get_motor_client():
    url = MONGODB_URL
    if "username:password" in url or not url.strip():
        if IS_PRODUCTION:
            raise RuntimeError("MONGODB_URL must be configured in production")
        # Development fallback when the example placeholder is unchanged.
        url = "mongodb://localhost:27017"
    client = AsyncIOMotorClient(
        url,
        serverSelectionTimeoutMS=30000,  # 30s — Render cold start uchun
        connectTimeoutMS=20000,
        socketTimeoutMS=30000,
    )
    return client
