import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger("capstone_db")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:1234@localhost:5432/capstone_db")

# Render قد يقدم الرابط بصيغة postgres:// بينما SQLAlchemy تتطلب postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if os.getenv("RENDER") == "true" and ("localhost" in DATABASE_URL or "127.0.0.1" in DATABASE_URL):
    logger.critical("WARNING: Running in cloud environment but DATABASE_URL points to localhost! Configure DATABASE_URL in Render dashboard.")

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()