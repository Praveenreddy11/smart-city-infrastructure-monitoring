import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.app.core.config import settings

db_url = settings.DATABASE_URL
connect_args = {}

if "sqlite" in db_url:
    connect_args["check_same_thread"] = False

try:
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=False,
        connect_args=connect_args
    )
    # Test connection
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
except Exception as e:
    print(f"[NOTICE] Primary database connection ({db_url.split('@')[-1]}) failed: {e}")
    print("[INFO] Falling back to local SQLite database: sqlite:///./smartcity.db")
    db_url = "sqlite:///./smartcity.db"
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False},
        echo=False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
