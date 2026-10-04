import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.app.core.config import settings
from backend.app.database.session import get_db, engine
from backend.app.ai.model_loader import ModelLoader
from backend.app.routers import auth, public_reports, authority, workers, payments

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    print("--- Starting Smart City Infrastructure Monitoring API ---")
    print(f"Project Name: {settings.PROJECT_NAME}")
    try:
        # Pre-load YOLO model once on startup
        ModelLoader.load_model()
    except Exception as e:
        print(f"[WARNING] YOLO model load during startup encountered notice: {e}")
    yield
    # Shutdown logic
    print("--- Shutting down API server ---")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploaded files directory statically
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(public_reports.router, prefix=settings.API_V1_STR)
app.include_router(authority.router, prefix=settings.API_V1_STR)
app.include_router(workers.router, prefix=settings.API_V1_STR)
app.include_router(payments.router, prefix=settings.API_V1_STR)

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    # Verify Database connectivity
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    # Verify Model status
    model_info = ModelLoader.get_info()

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": db_status,
        "model": model_info
    }
