import sys
import os
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pymysql import connect, err
from sqlalchemy_utils import database_exists, create_database
from backend.app.core.config import settings
from backend.app.core.security import get_password_hash
from backend.app.database.session import engine, SessionLocal, Base
from backend.app.models.models import User, Worker

def ensure_database_exists():
    """Ensure the target database exists in MySQL before creating tables."""
    print(f"Connecting to database via URL: {settings.DATABASE_URL.split('@')[-1]}")
    try:
        if not database_exists(engine.url):
            print(f"Database does not exist. Creating database: {engine.url.database}")
            create_database(engine.url)
            print("Database created successfully.")
    except Exception as e:
        print(f"[NOTICE] Direct SQLAlchemy database check: {e}")
        # Try raw PyMySQL fallback connection to server
        try:
            url = engine.url
            connection = connect(
                host=url.host or "localhost",
                user=url.username or "root",
                password=url.password or "",
                port=url.port or 3306
            )
            with connection.cursor() as cursor:
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{url.database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            connection.close()
            print(f"Database `{url.database}` verified/created via PyMySQL fallback.")
        except Exception as fallback_err:
            print("\n" + "="*70)
            print(" [MYSQL CONFIGURATION NOTICE]")
            print(f" Could not connect to MySQL server at {url.host}:{url.port} with user '{url.username}'.")
            print(" Please open `backend/.env` and update `DATABASE_URL` with your actual MySQL password:")
            print("   DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/smartcity_monitoring")
            print("="*70 + "\n")
            raise fallback_err

def init_db():
    print("Checking/creating MySQL database...")
    try:
        ensure_database_exists()
    except Exception:
        print("[ERROR] Database creation aborted due to MySQL connection failure.")
        return False

    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

    db = SessionLocal()
    try:
        # Check if authority admin exists
        authority_user = db.query(User).filter(User.role == "AUTHORITY").first()
        if not authority_user:
            admin_email = os.getenv("DEMO_ADMIN_EMAIL", "admin@smartcity.gov")
            admin_password = os.getenv("DEMO_ADMIN_PASSWORD", "Admin@123")
            print(f"Seeding demo authority user: {admin_email}")
            admin = User(
                username="authority_admin",
                email=admin_email,
                password_hash=get_password_hash(admin_password),
                role="AUTHORITY",
                is_active=True
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print("Demo authority user created.")

        # Check if demo worker exists
        worker_user = db.query(User).filter(User.role == "WORKER").first()
        if not worker_user:
            worker_email = os.getenv("DEMO_WORKER_EMAIL", "worker1@smartcity.gov")
            worker_password = os.getenv("DEMO_WORKER_PASSWORD", "Worker@123")
            print(f"Seeding demo worker user: {worker_email}")
            worker_usr = User(
                username="worker_john",
                email=worker_email,
                password_hash=get_password_hash(worker_password),
                role="WORKER",
                is_active=True
            )
            db.add(worker_usr)
            db.commit()
            db.refresh(worker_usr)

            # Create corresponding worker record
            w_profile = Worker(
                user_id=worker_usr.id,
                name="John Doe (Municipal Maintenance)",
                phone="+1-555-0199",
                area="North District / Zone 4",
                specialization="Pothole & Asphalt Repair",
                availability=True,
                status="ACTIVE"
            )
            db.add(w_profile)
            db.commit()
            print("Demo worker user & profile created.")

        print("Database initialization and seeding complete!")
        return True

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
