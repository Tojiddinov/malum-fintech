"""
MIZAN API — MongoDB + Motor + Beanie Entry Point
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from beanie import init_beanie

from app.database import get_motor_client, DB_NAME
from app.models.models import (
    AuditLog,
    DemoRequest,
    Report,
    Sequence,
    Transaction,
    User,
)
from app.services.migration_service import migrate_legacy_data
from app.services.seed_service import seed_data
from app.routers import auth, demo_requests, reports, transactions, users, workflow
import app.state as app_state


db_ready = False

@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI Lifespan handler: init Beanie & seed database."""
    global db_ready
    client = None
    try:
        client = await get_motor_client()
        db = client[DB_NAME]
        print(f"⏳ Connecting to MongoDB: {DB_NAME}...")
        await init_beanie(
            database=db,
            document_models=[
                User,
                Transaction,
                AuditLog,
                Report,
                Sequence,
                DemoRequest,
            ]
        )
        await migrate_legacy_data()
        db_ready = True
        app_state.db_ready = True
        print("✅ Beanie initialized with MongoDB.")
        if os.getenv("ENABLE_DEMO_SEED", "false").lower() == "true":
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

    if client is not None:
        client.close()


app = FastAPI(
    title="MIZAN API",
    description="O'zbekiston Islom banklari uchun Murabaha/Musharaka bitimlarini boshqarish platformasi",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

default_origins = (
    "http://localhost:5173,"
    "https://malum-fintechh.vercel.app"
)
allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", default_origins).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(workflow.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(demo_requests.router, prefix="/api")


@app.middleware("http")
async def require_database(request, call_next):
    public_paths = {"/api/health", "/api/docs", "/api/redoc"}
    if (
        request.url.path.startswith("/api")
        and request.url.path not in public_paths
        and not app_state.db_ready
    ):
        return JSONResponse(
            status_code=503,
            content={"detail": "Ma'lumotlar bazasi vaqtincha mavjud emas"},
        )
    return await call_next(request)


@app.get("/api/health")
async def health_check():
    return {
        "status": "ok" if db_ready else "degraded",
        "service": "MIZAN API",
        "version": "1.0.0",
        "database": DB_NAME,
        "db_connected": db_ready,
    }
