"""
QA seed script - creates one clearly test-only account per role.

Usage (from repo root):
    set DATABASE_URL=postgresql+psycopg2://postgres@127.0.0.1:54329/capstone_qa
    qa\\.venv\\Scripts\\python qa\\seed.py

How each role is created (and why):
  * student / partner(company): the public API allows self-registration via
    POST /users/ for these roles, but we insert them directly so the seed works
    without a running server.
  * supervisor / admin: POST /users/ explicitly returns 403 for these roles
    (backend/main.py create_user). There is NO admin-creation endpoint and no
    CLI, so the only way the system supports creating them is a direct DB
    insert with a bcrypt hash produced by backend/utils.hash_password. That is
    exactly what this script does. (backend/seed.py only creates *supervisors*,
    never an admin.)

Safety: refuses to run unless DATABASE_URL points at localhost/127.0.0.1.
"""
import os
import sys
from urllib.parse import urlparse

DB_URL = os.environ.get("DATABASE_URL", "postgresql+psycopg2://postgres@127.0.0.1:54329/capstone_qa")
host = urlparse(DB_URL).hostname or ""
if not DB_URL.startswith("sqlite") and host not in ("localhost", "127.0.0.1"):
    sys.exit(f"Refusing to seed a non-local database (host={host!r}).")
os.environ["DATABASE_URL"] = DB_URL
# the seed only hashes passwords (never signs tokens), so the dev key opt-in is safe here (I-41)
os.environ.setdefault("DEV_INSECURE_KEY", "1")

BACKEND = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend")
sys.path.insert(0, os.path.abspath(BACKEND))

import models  # noqa: E402
import utils  # noqa: E402
from database import SessionLocal, engine  # noqa: E402

PASSWORD = "QaTest#2026"

QA_USERS = [
    {"email": "qa_student@test.local", "full_name": "QA Student One", "role": "student"},
    {"email": "qa_student2@test.local", "full_name": "QA Student Two", "role": "student"},
    {"email": "qa_company@test.local", "full_name": "QA Company One", "role": "partner"},
    {"email": "qa_company2@test.local", "full_name": "QA Company Two", "role": "partner"},
    {"email": "qa_supervisor@test.local", "full_name": "QA Supervisor", "role": "supervisor"},
    {"email": "qa_admin@test.local", "full_name": "QA Admin", "role": "admin"},
]


def seed():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for u in QA_USERS:
            user = db.query(models.User).filter(models.User.email == u["email"]).first()
            if user is None:
                user = models.User(email=u["email"], full_name=u["full_name"], role=u["role"], skills="")
                db.add(user)
            user.password_hash = utils.hash_password(PASSWORD)
            user.role = u["role"]
            db.flush()
            if u["role"] == "student" and user.profile is None:
                db.add(models.StudentProfile(user_id=user.id, major="QA Major", skills="", interests=""))
            print(f"  {u['role']:<10} {u['email']:<28} id={user.id}")
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    print(f"Seeding QA users into {urlparse(DB_URL).hostname}:{urlparse(DB_URL).port}{urlparse(DB_URL).path}")
    seed()
    print(f"Done. Password for every QA account: {PASSWORD}")
