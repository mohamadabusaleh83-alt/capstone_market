import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext

# تهيئة سياق تشفير كلمات المرور باستخدام bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# قراءة إعدادات التشفير والتوكن من متغيرات البيئة مع قيم افتراضية للتطوير
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-change-this-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))


def hash_password(password: str) -> str:
    """تشفير كلمة المرور مع تقليمها إلى 72 بايت لتفادي حدود bcrypt"""
    pwd_bytes = password.encode("utf-8")[:72].decode("utf-8", errors="ignore")
    return pwd_context.hash(pwd_bytes)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """التحقق من مطابقة كلمة المرور المدخلة مع الهاش المخزن"""
    pwd_bytes = plain_password.encode("utf-8")[:72].decode("utf-8", errors="ignore")
    return pwd_context.verify(pwd_bytes, hashed_password)


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