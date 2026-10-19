"""
Seed script for Capstone Market Platform.
Inserts or updates the official academic supervisor and default demo accounts in the database.
"""
import sys
import logging
from sqlalchemy.orm import Session

import models
import utils
from database import SessionLocal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed")

OFFICIAL_SUPERVISOR = {
    "full_name": "د. أسامة أمين مرعي",
    "email": "osama.merhi@capstone.ps",
    "password": "password123",
    "role": "supervisor",
    "skills": "نظم معلومات حاسوبية - كلية التكنولوجيا والعلوم التطبيقية"
}

OFFICIAL_SUPERVISOR_ALT = {
    "full_name": "د. أسامة أمين مرعي",
    "email": "omarie@qou.edu",
    "password": "Doctor@2025",
    "role": "supervisor",
    "skills": "نظم معلومات حاسوبية - كلية التكنولوجيا والعلوم التطبيقية"
}

DEFAULT_USERS = [
    OFFICIAL_SUPERVISOR,
    OFFICIAL_SUPERVISOR_ALT,
    {
        "full_name": "أحمد منصور",
        "email": "student@capstone.ps",
        "password": "pass1234",
        "role": "student",
        "skills": "React, Python, FastAPI, Tailwind CSS"
    },
    {
        "full_name": "شركة النور للحلول البرمجية",
        "email": "company@capstone.ps",
        "password": "pass1234",
        "role": "partner",
        "skills": "Software Development, Cloud, AI Solutions"
    }
]


def seed_user(db: Session, user_data: dict) -> models.User:
    """إدراج أو تحديث حساب مستخدم بالاعتماد على البريد الإلكتروني مع تشفير آمن لكلمة المرور"""
    email = user_data["email"].strip().lower()
    user = db.query(models.User).filter(models.User.email == email).first()

    password_hash = utils.hash_password(user_data["password"])

    if user:
        user.full_name = user_data["full_name"]
        user.role = user_data["role"]
        user.password_hash = password_hash
        user.skills = user_data.get("skills", "")
        logger.info(f"Updated existing user: {email} ({user_data['full_name']})")
    else:
        user = models.User(
            full_name=user_data["full_name"],
            email=email,
            password_hash=password_hash,
            role=user_data["role"],
            skills=user_data.get("skills", "")
        )
        db.add(user)
        logger.info(f"Created new user: {email} ({user_data['full_name']})")

    db.commit()
    db.refresh(user)
    return user


def seed_default_users(db: Session = None):
    """تهيئة كافة الحسابات الافتراضية مع ضمان وجود حساب المشرف الأكاديمي الرسمي"""
    owns_session = False
    if db is None:
        db = SessionLocal()
        owns_session = True

    try:
        results = []
        for u in DEFAULT_USERS:
            results.append(seed_user(db, u))
        return results
    except Exception as e:
        db.rollback()
        logger.error(f"Error during seeding: {e}")
        raise
    finally:
        if owns_session:
            db.close()


if __name__ == "__main__":
    print("Seeding default accounts into database...")
    seed_default_users()
    print("Seeding completed successfully!")
