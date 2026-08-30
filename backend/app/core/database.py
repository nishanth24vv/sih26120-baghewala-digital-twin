"""
Database Engine and Session Factory with SQLite support for 100% offline local execution.
Includes auto-migration and baseline recovery hooks.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
from app.models.db_models import Base

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Create all database tables and seed baseline data if empty."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        from app.models.db_models import Well
        if db.query(Well).count() == 0:
            from scripts.generate_synthetic_data import generate_field_dataset
            generate_field_dataset()
    except Exception as e:
        print(f"Database initialization notice: {e}")
    finally:
        db.close()

def get_db():
    """FastAPI Dependency for database session management."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
