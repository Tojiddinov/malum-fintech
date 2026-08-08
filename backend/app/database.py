import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = "amanat_db"

async def get_motor_client():
    url = MONGODB_URL
    if "username:password" in url or not url.strip():
        # Fallback to local MongoDB if Atlas placeholder is unchanged
        url = "mongodb://localhost:27017"
    client = AsyncIOMotorClient(
        url,
        serverSelectionTimeoutMS=30000,  # 30s — Render cold start uchun
        connectTimeoutMS=20000,
        socketTimeoutMS=30000,
    )
    return client
