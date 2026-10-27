import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger("capstone_db")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:1234@localhost:5432/capstone_db")

# Render قد يقدم الرابط بصيغة postgres:// بينما SQLAlchemy تتطلب postgresql://
# نحدد مشغل psycopg2 صراحةً لأن SQLAlchemy 2.1+ يستخدم psycopg (v3) افتراضياً وهو غير مثبت
for prefix in ("postgres://", "postgresql://"):
    if DATABASE_URL.startswith(prefix):
        DATABASE_URL = "postgresql+psycopg2://" + DATABASE_URL[len(prefix):]
        break

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