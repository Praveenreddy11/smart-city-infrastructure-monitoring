import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend root or project root
BASE_DIR = Path(__file__).resolve().parent.parent.parent
env_path = BASE_DIR / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    PROJECT_NAME: str = "AI-Enabled Infrastructure Monitoring System for Smart Cities"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://root:password@localhost:3306/smartcity_monitoring"
    )
    
    # JWT Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "smartcity_monitoring_jwt_secret_key_2026_super_secure")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # AI Model
    MODEL_PATH: str = os.getenv("MODEL_PATH", "ai-model/runs/detect/train/weights/best.pt")
    CONFIDENCE_THRESHOLD: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.25"))
    
    # Upload Directories
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "backend/uploads")
    REPORT_UPLOADS: str = os.path.join(UPLOAD_DIR, "reports")
    REPAIR_UPLOADS: str = os.path.join(UPLOAD_DIR, "repair_proofs")
    ANNOTATED_UPLOADS: str = os.path.join(UPLOAD_DIR, "reports", "annotated")

settings = Settings()

# Ensure upload directories exist
for path in [settings.UPLOAD_DIR, settings.REPORT_UPLOADS, settings.REPAIR_UPLOADS, settings.ANNOTATED_UPLOADS]:
    os.makedirs(path, exist_ok=True)
