import os
import bcrypt
import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt, JWTError

logger = logging.getLogger("capstone_security")

DEV_DEFAULT_SECRET = "your-super-secret-key-change-this-in-production"
INSECURE_SECRETS = {
    DEV_DEFAULT_SECRET,
    "capstone_secret_key_change_in_production",
    "secret",
    "changeme",
    "admin",
    "password"
}

IS_PRODUCTION = (
    os.getenv("RENDER") == "true" or 
    os.getenv("ENVIRONMENT", "").lower() in ["production", "prod"]
)

raw_secret = os.getenv("SECRET_KEY", "").strip()

if IS_PRODUCTION:
    if not raw_secret or raw_secret in INSECURE_SECRETS or len(raw_secret) < 32:
        error_msg = (
            "CRITICAL SECURITY ERROR: Running in production mode without a valid, strong SECRET_KEY. "
            "You MUST set the SECRET_KEY environment variable in your Render dashboard (minimum 32 characters). "
            "Server startup is blocked to protect authentication integrity."
        )
        logger.critical(error_msg)
        raise RuntimeError(error_msg)
    SECRET_KEY = raw_secret
else:
    SECRET_KEY = raw_secret or DEV_DEFAULT_SECRET

ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))


def hash_password(password: str) -> str:
    """تشفير كلمة المرور عبر bcrypt مباشرة مع تقليمها لـ 72 بايت لتفادي حدود bcrypt"""
    if not password:
        password = ""
    pwd_bytes = password.encode("utf-8")[:72]
    hashed = bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode("utf-8")
    return hashed


# مرادف لدعم استدعاء get_password_hash
get_password_hash = hash_password


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """التحقق من صحة كلمة المرور باستخدام bcrypt مباشرة مع تقليمها لـ 72 بايت"""
    try:
        if not plain_password or not hashed_password:
            return False
        pwd_bytes = plain_password.encode("utf-8")[:72]
        return bcrypt.checkpw(pwd_bytes, hashed_password.encode("utf-8"))
    except Exception as e:
        print(f"Error in verify_password: {e}")
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """إنشاء JWT Access Token يحمل بيانات المستخدم وتاريخ انتهاء الصلاحية"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """فك تشفير التوكن والتحقق من صحته، وإرجاع الـ payload أو None عند الفشل"""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


def verify_access_token(token: str) -> Optional[int]:
    """استخراج والتحقق من معرف المستخدم (user_id) من التوكن"""
    payload = decode_access_token(token)
    if not payload:
        return None

    user_id = payload.get("user_id")
    if user_id is None:
        sub = payload.get("sub")
        if sub and str(sub).isdigit():
            return int(sub)
        return None

    try:
        return int(user_id)
    except (ValueError, TypeError):
        return None