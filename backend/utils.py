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

# تقليم المسافات وعلامات الاقتباس المحيطة التي قد تنتج عن النسخ واللصق في لوحة التحكم
raw_secret = os.getenv("SECRET_KEY", "").strip().strip("'\"")
insecure_secrets_lower = {s.lower() for s in INSECURE_SECRETS}

if IS_PRODUCTION:
    key_length = len(raw_secret)
    is_set = bool(raw_secret)

    # تشخيص أمني آمن: تسجيل وجود المتغير وطوله فقط دون طباعة أو كشف أي جزء من قيمته
    logger.info(
        "Production security check: SECRET_KEY present=%s, length=%d characters",
        is_set,
        key_length
    )

    if not raw_secret:
        error_msg = (
            "CRITICAL SECURITY ERROR: Running in production mode without a valid SECRET_KEY. "
            "The SECRET_KEY environment variable is missing or empty in the Render environment. "
            "You MUST set the SECRET_KEY environment variable in your Render dashboard (minimum 32 characters). "
            "Server startup is blocked to protect authentication integrity."
        )
        logger.critical(error_msg)
        raise RuntimeError(error_msg)

    if raw_secret.lower() in insecure_secrets_lower:
        error_msg = (
            "CRITICAL SECURITY ERROR: Running in production mode with a known insecure/example SECRET_KEY. "
            "The value configured in Render matches an insecure default placeholder (e.g. from .env.example). "
            "You MUST generate and set a unique, random SECRET_KEY in your Render dashboard (minimum 32 characters). "
            "Server startup is blocked to protect authentication integrity."
        )
        logger.critical(error_msg)
        raise RuntimeError(error_msg)

    if key_length < 32:
        error_msg = (
            f"CRITICAL SECURITY ERROR: Running in production mode with a weak SECRET_KEY. "
            f"The provided SECRET_KEY length is {key_length} characters, which is less than the required minimum of 32 characters. "
            "You MUST set a stronger SECRET_KEY in your Render dashboard (minimum 32 characters). "
            "Server startup is blocked to protect authentication integrity."
        )
        logger.critical(error_msg)
        raise RuntimeError(error_msg)

    SECRET_KEY = raw_secret
elif raw_secret:
    SECRET_KEY = raw_secret
elif os.getenv("DEV_INSECURE_KEY", "").strip() == "1":
    # opt-in only, for local development: tokens are signed with a key that is public in the repo
    logger.warning("DEV_INSECURE_KEY=1: signing tokens with the public development key. Never use this in a deployment.")
    SECRET_KEY = DEV_DEFAULT_SECRET
else:
    error_msg = (
        "SECRET_KEY is not set. Set SECRET_KEY (a random string of at least 32 characters), "
        "or for local development only set DEV_INSECURE_KEY=1 to use the public development key."
    )
    logger.critical(error_msg)
    raise RuntimeError(error_msg)

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