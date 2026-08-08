"""
Malum API — MongoDB + Motor + Beanie Entry Point
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from beanie import init_beanie

from app.database import get_motor_client, DB_NAME
from app.models.models import User, Transaction, AuditLog, Report
from app.services.seed_service import seed_data
from app.routers import transactions, auth, workflow, reports, users
import app.state as app_state


db_ready = False

@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI Lifespan handler: init Beanie & seed database."""
    global db_ready
    try:
        client = await get_motor_client()
        db = client[DB_NAME]
        print(f"⏳ Connecting to MongoDB: {DB_NAME}...")
        await init_beanie(
            database=db,
            document_models=[User, Transaction, AuditLog, Report]
        )
        db_ready = True
        app_state.db_ready = True
        print("✅ Beanie initialized with MongoDB.")
        try:
            await seed_data()
        except Exception as seed_err:
            print(f"⚠️ Seed notice: {seed_err}")
    except Exception as e:
        db_ready = False
        app_state.db_ready = False
        print(f"❌ CRITICAL: MongoDB connection FAILED: {type(e).__name__}: {e}")
        print("⚠️  Check MONGODB_URL env var and Atlas IP whitelist (allow 0.0.0.0/0 for Render)")

    yield


app = FastAPI(
    title="Malum API",
    description="O'zbekiston Islom banklari uchun Murabaha/Musharaka bitimlarini boshqarish platformasi",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

import os

allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if os.getenv("ALLOWED_ORIGINS") else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(workflow.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(users.router, prefix="/api")


@app.get("/api/health")
async def health_check():
    return {
        "status": "ok" if db_ready else "degraded",
        "service": "Malum API",
        "version": "1.0.0",
        "database": DB_NAME,
        "db_connected": db_ready,
    }
