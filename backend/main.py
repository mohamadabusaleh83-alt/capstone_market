import os
import re
import json
import uuid
import logging
from typing import List, Optional
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException, Query, Request, Response, status, UploadFile, File
from sqlalchemy import func as sa_func
from fastapi.responses import FileResponse, JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import ValidationError
from sqlalchemy.orm import Session
from sqlalchemy import text, or_

import i18n_messages as i18n
import models
import ratelimit
import storage
import schemas
import utils
from database import engine, get_db

logger = logging.getLogger("capstone_api")

# إنشاء الجداول تلقائياً إن لم تكن موجودة مسبقاً
models.Base.metadata.create_all(bind=engine)

# التحقق من وجود الأعمدة والقيود الحديثة في قاعدة البيانات (PostgreSQL/SQLite) دون تعطيل التشغيل
with engine.connect() as conn:
    from sqlalchemy import inspect as sa_inspect
    inspector = sa_inspect(engine)
    existing_tables = set(inspector.get_table_names())

    def add_col_if_missing(table: str, col: str, ddl_type: str):
        if table in existing_tables:
            cols = {c["name"] for c in inspector.get_columns(table)}
            if col not in cols:
                try:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {ddl_type}"))
                    conn.commit()
                except Exception as e:
                    logger.debug(f"Could not add {col} to {table}: {e}")

    add_col_if_missing("projects", "status", "VARCHAR DEFAULT 'pending'")
    add_col_if_missing("projects", "max_members", "INTEGER DEFAULT 4")
    add_col_if_missing("projects", "category", "VARCHAR(100)")
    add_col_if_missing("projects", "stipend", "VARCHAR(100)")
    add_col_if_missing("projects", "company_name", "VARCHAR(150)")
    add_col_if_missing("projects", "supervisor_id", "INTEGER")
    add_col_if_missing("projects", "supervisor_feedback", "TEXT")
    add_col_if_missing("projects", "decided_at", "TIMESTAMP")
    add_col_if_missing("projects", "rejected_at", "TIMESTAMP")
    add_col_if_missing("users", "phone", "VARCHAR(50)")
    add_col_if_missing("users", "skills", "TEXT DEFAULT ''")
    add_col_if_missing("users", "token_version", "INTEGER NOT NULL DEFAULT 0")
    add_col_if_missing("users", "website", "VARCHAR(255)")
    add_col_if_missing("users", "industry", "VARCHAR(150)")
    add_col_if_missing("users", "is_active", "BOOLEAN NOT NULL DEFAULT 1" if engine.dialect.name == "sqlite" else "BOOLEAN NOT NULL DEFAULT TRUE")
    add_col_if_missing("users", "settings", "TEXT")
    add_col_if_missing("student_profiles", "bio", "TEXT")
    add_col_if_missing("student_profiles", "portfolio_url", "VARCHAR(255)")
    add_col_if_missing("student_profiles", "course", "VARCHAR(100)")
    add_col_if_missing("student_profiles", "university", "VARCHAR(150)")
    add_col_if_missing("student_profiles", "cv_key", "VARCHAR(255)")
    add_col_if_missing("applications", "created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    add_col_if_missing("applications", "feedback", "TEXT")
    add_col_if_missing("reports", "file_key", "VARCHAR(255)")
    add_col_if_missing("notifications", "title_en", "VARCHAR(200)")
    add_col_if_missing("notifications", "message_en", "TEXT")
    add_col_if_missing("notifications", "project_id", "INTEGER")
    add_col_if_missing("notifications", "related_project_id", "INTEGER")
    add_col_if_missing("notifications", "related_application_id", "INTEGER")
    add_col_if_missing("notifications", "notification_type", "VARCHAR(50) DEFAULT 'general'")
    add_col_if_missing("messages", "conversation_type", "VARCHAR(50) DEFAULT 'company_student'")
    add_col_if_missing("messages", "recipient_id", "INTEGER")

    for stmt in [
        "CREATE INDEX IF NOT EXISTS ix_notifications_project_id ON notifications (project_id)",
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_project_student_app ON applications (project_id, student_id)",
        "CREATE TABLE IF NOT EXISTS reports (id SERIAL PRIMARY KEY, project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE, student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, title VARCHAR(200) NOT NULL, description TEXT, file_url VARCHAR(255), status VARCHAR(30) DEFAULT 'pending', supervisor_feedback TEXT, grade VARCHAR(50), deadline_date VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
    ]:
        try:
            conn.execute(text(stmt))
            conn.commit()
        except Exception as e:
            logger.debug(f"DB check ({stmt}): {e}")

# ملاحظة أمنية: لا يتم إنشاء أي حسابات تجريبية عند الإقلاع. للتطوير المحلي فقط: python seed.py

app = FastAPI(
    title="Capstone Platform API",
    description="واجهة برمجة التطبيقات لمنصة مشاريع التخرج (Capstone Market)",
    version="1.1.0"
)

# إعداد CORS: الواجهة الإنتاجية وخوادم التطوير المحلية فقط، ويمكن إضافة نطاقات عبر ALLOWED_ORIGINS
# (لا يوجد نمط عام مثل *.vercel.app: أي موقع على vercel.app كان مسموحاً)
origins = [
    "https://capstone-market.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

env_origins = os.getenv("ALLOWED_ORIGINS", "")
if env_origins:
    for o in env_origins.split(","):
        cleaned = o.strip()
        if cleaned and cleaned not in origins:
            origins.append(cleaned)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# الملفات (السير الذاتية والتقارير) لا تُخدم كملفات ثابتة عامة: التنزيل عبر روابط موقّعة قصيرة الأجل (storage.py)

def is_allowed_origin(origin: Optional[str]) -> bool:
    return bool(origin) and origin in origins


# معرّف فريد لكل طلب يُعاد في الترويسة X-Request-ID ويُسجّل مع أي خطأ لتسهيل التتبع
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = uuid.uuid4().hex
    request.state.request_id = request_id
    # لغة الرد (رسائل الأخطاء والإشعارات) من Accept-Language (I-28)
    lang_token = i18n.current_lang.set(i18n.lang_from_header(request.headers.get("accept-language", "")))
    try:
        response = await call_next(request)
    finally:
        i18n.current_lang.reset(lang_token)
    response.headers["X-Request-ID"] = request_id
    # ترويسات أمان أساسية لكل الردود (I-49)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    if request.url.path not in ("/docs", "/redoc", "/docs/oauth2-redirect"):
        # صفحات التوثيق تحمّل Swagger UI من CDN، باقي الردود JSON أو ملفات فقط
        response.headers.setdefault("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
    return response


@app.exception_handler(StarletteHTTPException)
async def localized_http_exception_handler(request: Request, exc: StarletteHTTPException):
    """أخطاء HTTP بلغة العميل: العربية افتراضياً، والإنجليزية عند Accept-Language: en"""
    detail = exc.detail
    if isinstance(detail, str) and i18n.lang_from_header(request.headers.get("accept-language", "")) == "en":
        detail = i18n.to_english(detail)
    return JSONResponse(status_code=exc.status_code, content={"detail": detail}, headers=getattr(exc, "headers", None))


# معالج عام لأي خطأ غير متوقع: رسالة عامة + معرّف الطلب للمستخدم، والتفاصيل في سجل الخادم فقط
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", None) or uuid.uuid4().hex
    logger.error(f"Unhandled exception [request_id={request_id}] {request.method} {request.url.path}", exc_info=exc)

    # هذا الرد يتجاوز CORSMiddleware، لذا نضيف ترويسات CORS يدوياً للنطاقات المسموحة فقط
    headers = {"X-Request-ID": request_id}
    origin = request.headers.get("origin")
    if is_allowed_origin(origin):
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        headers["Vary"] = "Origin"
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": i18n.to_english("حدث خطأ داخلي في الخادم، يرجى المحاولة لاحقاً")
            if i18n.lang_from_header(request.headers.get("accept-language", "")) == "en"
            else "حدث خطأ داخلي في الخادم، يرجى المحاولة لاحقاً",
            "request_id": request_id
        },
        headers=headers
    )

# نظام استخراج التوكن OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


# ==========================================
# توابع التحقق من الهوية والصلاحيات (Auth & RBAC)
# ==========================================

def user_from_token(token: Optional[str], db: Session) -> Optional[models.User]:
    """المستخدم صاحب التوكن إن كان صالحاً وغير مُبطَل (token_version يطابق قاعدة البيانات)"""
    if not token:
        return None
    payload = utils.decode_access_token(token)
    if not payload:
        return None
    user_id = utils.user_id_from_payload(payload)
    if user_id is None:
        return None
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        return None
    if int(payload.get("tv", 0) or 0) != (user.token_version or 0):
        return None
    if user.is_active is False:
        return None
    return user


def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
) -> models.User:
    """استخراج والتحقق من هوية المستخدم صاحب التوكن الحالي، ورفض الطلب عند عدم صحته"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="جلسة غير صالحة أو منتهية، يرجى تسجيل الدخول مجدداً",
        headers={"WWW-Authenticate": "Bearer"},
    )
    user = user_from_token(token, db)
    if user is None:
        raise credentials_exception
    return user


optional_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login", auto_error=False)


def get_optional_user(
    token: Optional[str] = Depends(optional_oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[models.User]:
    """المستخدم الحالي إن وُجد توكن صالح، وإلا None (زائر). التوكن غير الصالح يُعامل كزائر"""
    if not token:
        return None
    return user_from_token(token, db)


def visible_projects_query(query, user: Optional[models.User]):
    """قواعد ظهور المشاريع: الزائر يرى المعتمد فقط، الطالب والشركة يريان المعتمد ومشاريعهم بأي حالة، المشرف والأدمن يرون الكل"""
    user_role = (user.role or "").lower() if user else ""
    if user_role in ("supervisor", "admin"):
        return query
    if user:
        return query.filter(or_(models.Project.status == "approved", models.Project.created_by == user.id))
    return query.filter(models.Project.status == "approved")


def supervisor_can_manage(project: Optional[models.Project], user: models.User) -> bool:
    """الأدمن يدير كل المشاريع؛ المشرف يدير المشاريع غير المسندة أو المسندة إليه فقط"""
    user_role = (user.role or "").lower()
    if user_role == "admin":
        return True
    if user_role != "supervisor":
        return False
    return project is None or project.supervisor_id in (None, user.id)


def require_role(allowed_roles: List[str]):
    """التحقق من رتبة المستخدم وصلاحياته (Role-Based Access Control)"""
    def role_checker(current_user: models.User = Depends(get_current_user)) -> models.User:
        user_role = (current_user.role or "").lower()
        normalized_allowed = [r.lower() for r in allowed_roles]

        # المسؤول (admin) يمتلك كافة الصلاحيات دائماً
        if user_role == "admin":
            return current_user

        # توافقية مسميات الشركات والشركاء الصناعيين (company, partner, business)
        company_aliases = {"company", "partner", "business"}
        if any(alias in normalized_allowed for alias in company_aliases) and user_role in company_aliases:
            return current_user

        if user_role in normalized_allowed:
            return current_user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ليس لديك الصلاحية لتنفيذ هذا الإجراء"
        )
    return role_checker


APPROVED_MEMBER_STATUSES = ["academically_approved", "accepted"]  # "accepted" = بيانات قديمة


def is_approved_member(project_id: int, user_id: int, db: Session) -> bool:
    """هل المستخدم عضو معتمد أكاديمياً في المشروع"""
    return db.query(models.Application).filter(
        models.Application.project_id == project_id,
        models.Application.student_id == user_id,
        models.Application.status.in_(APPROVED_MEMBER_STATUSES)
    ).first() is not None


def home_link(user_id: Optional[int], db: Session) -> str:
    """صفحة الواجهة التي تعرض مشاريع المستخدم حسب دوره (روابط إشعارات موجودة فعلاً في الواجهة)"""
    user = db.query(models.User).filter(models.User.id == user_id).first() if user_id else None
    role = (user.role or "").lower() if user else ""
    if role in ("partner", "company", "business"):
        return "/company/opportunities"
    if role in ("supervisor", "admin"):
        return "/supervisor"
    return "/my-projects"


def get_project_accepted_members(project_id: int, db: Session) -> int:
    """حساب عدد المقاعد المشغولة حالياً (الطلبات المقبولة والمعتمدة أكاديمياً فقط) لمشروع محدد"""
    return db.query(models.Application).filter(
        models.Application.project_id == project_id,
        models.Application.status.in_(["accepted", "academically_approved"])
    ).count()


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    link: Optional[str] = None,
    title_en: Optional[str] = None,
    message_en: Optional[str] = None,
    project_id: Optional[int] = None,
    notification_type: Optional[str] = "general",
    related_application_id: Optional[int] = None
):
    """إنشاء وحفظ إشعار جديد لمستخدم محدد مع منع التكرار والتحقق الصارم من صلاحيات المستلم"""
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user or not user.is_active:
            return None

        user_role = (user.role or "").lower()
        # منع إرسال إشعارات الإشراف الأكاديمي أو طلبات وسير الطلاب الذاتية للشركات
        if user_role in COMPANY_ROLES and notification_type in (
            "academic_supervision", "student_application", "student_cv", "report_submitted", "application_approved", "application_rejected"
        ):
            logger.warning(f"Blocked sending {notification_type} notification to company user {user_id}")
            return None

        # منع تكرار الإشعارات المتطابقة غير المقروءة للحدث نفسه
        existing = db.query(models.Notification).filter(
            models.Notification.user_id == user_id,
            models.Notification.title == title,
            models.Notification.project_id == project_id,
            models.Notification.is_read == False
        ).order_by(models.Notification.id.desc()).first()
        if existing:
            return existing

        notif = models.Notification(
            user_id=user_id,
            title=title,
            message=message,
            title_en=title_en,
            message_en=message_en,
            link=link,
            project_id=project_id,
            related_project_id=project_id,
            related_application_id=related_application_id,
            notification_type=notification_type or "general",
            is_read=False
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif
    except Exception as e:
        logger.error(f"Error creating notification for user {user_id}: {e}")
        db.rollback()
        return None


# ==========================================
# المسار الترحيبي (Root)
# ==========================================

@app.get("/")
def home():
    return {"message": "Capstone Platform API is running successfully!"}


# ==========================================
# مسارات التوثيق والمستخدمين (Auth & Users)
# ==========================================

def too_many_requests(retry_after: int) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail="محاولات كثيرة جداً، يرجى المحاولة لاحقاً",
        headers={"Retry-After": str(retry_after)},
    )


@app.post("/login", response_model=schemas.Token)
def login(
    request: Request,
    user_credentials: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    """تسجيل الدخول وتوليد رمز الوصول JWT، مع تحديد معدل المحاولات لكل IP ولكل حساب"""
    clean_username = user_credentials.username.strip().lower()
    ip = ratelimit.client_ip(request)
    for limiter, key in ((ratelimit.LOGIN_IP_LIMITER, ip), (ratelimit.LOGIN_ACCOUNT_LIMITER, clean_username)):
        wait = limiter.retry_after(key)
        if wait:
            raise too_many_requests(wait)
    ratelimit.LOGIN_IP_LIMITER.hit(ip)

    try:
        user = db.query(models.User).filter(models.User.email == clean_username).first()

        if not user or not utils.verify_password(user_credentials.password, user.password_hash):
            ratelimit.LOGIN_ACCOUNT_LIMITER.hit(clean_username)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="البريد الإلكتروني أو كلمة المرور غير صحيحة",
                headers={"WWW-Authenticate": "Bearer"},
            )

        ratelimit.LOGIN_ACCOUNT_LIMITER.reset(clean_username)
        if user.is_active is False:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="هذا الحساب معطّل، يرجى التواصل مع إدارة المنصة")
        access_token = issue_token(user)

        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception:
        logger.error("Error in login", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة لاحقاً"
        )


def issue_token(user: models.User) -> str:
    return utils.create_access_token(
        data={"sub": str(user.id), "user_id": user.id, "email": user.email, "role": user.role,
              "tv": user.token_version or 0}
    )


@app.post("/logout", summary="تسجيل الخروج")
def logout(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """تسجيل الخروج: يُبطل كل التوكنات الصادرة لهذا الحساب (على جميع الأجهزة)"""
    current_user.token_version = (current_user.token_version or 0) + 1
    db.commit()
    return {"message": i18n.tr("تم تسجيل الخروج بنجاح"), "user_id": current_user.id}


@app.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    """التحقق من هوية المستخدم الحالية وصلاحياته من الـ JWT Token"""
    return current_user


@app.post("/users/", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, request: Request, db: Session = Depends(get_db)):
    """إنشاء حساب مستخدم جديد مع حماية أمنية لمنع التصعيد الذاتي للصلاحيات وتحديد معدل التسجيل لكل IP"""
    ip = ratelimit.client_ip(request)
    wait = ratelimit.REGISTER_IP_LIMITER.retry_after(ip)
    if wait:
        raise too_many_requests(wait)
    ratelimit.REGISTER_IP_LIMITER.hit(ip)
    try:
        clean_email = user.email.strip().lower()
        db_user = db.query(models.User).filter(models.User.email == clean_email).first()
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="البريد الإلكتروني مسجل مسبقاً لمستخدم آخر"
            )

        raw_role = (user.role or "student").strip().lower()
        # حماية أمنية: منع التسجيل الذاتي برتبة مسؤول أو مشرف أكاديمي
        if raw_role in ["admin", "supervisor"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="غير مصرح بالتسجيل الذاتي برتبة مسؤول أو مشرف أكاديمي"
            )

        allowed_roles = {"student", "partner", "company", "business"}
        if raw_role not in allowed_roles:
            raw_role = "student"

        # توحيد مسميات الشركاء
        user_role = "partner" if raw_role in ["company", "business"] else raw_role

        hashed_pwd = utils.hash_password(user.password)

        new_user = models.User(
            full_name=user.full_name.strip(),
            email=clean_email,
            password_hash=hashed_pwd,
            role=user_role,
            skills=""
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # إنشاء سجل ملف أكاديمي مبدئي للطلبة
        if user_role == "student":
            clean_major = user.major.strip() if user.major and isinstance(user.major, str) and user.major.strip() else None
            student_profile = models.StudentProfile(
                user_id=new_user.id,
                major=clean_major,
                skills="",
                interests=""
            )
            db.add(student_profile)
            db.commit()
            db.refresh(new_user)

        return format_user_item(new_user)
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        logger.error("Error in create_user", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="حدث خطأ أثناء إنشاء المستخدم، يرجى التأكد من البيانات"
        )


def get_user_profile_response(user: models.User, db: Session) -> schemas.UserProfileResponse:
    """بناء نموذج استجابة شامل للملف الشخصي والأكاديمي للمستخدم"""
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == user.id).first()
    return schemas.UserProfileResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        phone=user.phone,
        website=user.website,
        industry=user.industry,
        skills=user.skills or (profile.skills if profile else "") or "",
        major=profile.major if profile else None,
        bio=profile.bio if profile else None,
        portfolio_url=public_portfolio_url(profile),
        course=profile.course if profile else None,
        university=profile.university if profile else None,
        has_cv=bool(profile and profile.cv_key),
        created_at=user.created_at
    )


def public_portfolio_url(profile: Optional[models.StudentProfile]) -> Optional[str]:
    """رابط الأعمال الخارجي فقط؛ المسارات القديمة /uploads/... كانت ملفات عامة على قرص Render ولم تعد متاحة"""
    url = profile.portfolio_url if profile else None
    if url and url.startswith("/uploads/"):
        return None
    return url


@app.get("/users/me/profile", response_model=schemas.UserProfileResponse)
@app.get("/profile", response_model=schemas.UserProfileResponse, include_in_schema=False)
@app.get("/users/me", response_model=schemas.UserProfileResponse, include_in_schema=False)
@app.get("/api/users/me", response_model=schemas.UserProfileResponse, include_in_schema=False)
@app.get("/api/users/me/profile", response_model=schemas.UserProfileResponse, include_in_schema=False)
def get_my_profile(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """جلب بيانات الملف الشخصي والأكاديمي والمهارات للمستخدم الحالي"""
    return get_user_profile_response(current_user, db)


@app.put("/users/me/profile", response_model=schemas.UserProfileResponse)
@app.put("/profile", response_model=schemas.UserProfileResponse, include_in_schema=False)
@app.put("/users/me", response_model=schemas.UserProfileResponse, include_in_schema=False)
@app.put("/api/users/me", response_model=schemas.UserProfileResponse, include_in_schema=False)
@app.put("/api/users/me/profile", response_model=schemas.UserProfileResponse, include_in_schema=False)
def update_my_profile(
    profile_data: schemas.UserProfileUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """تحديث بيانات الملف الشخصي والأكاديمي والسيرة الذاتية للمستخدم الحالي وحفظها في قاعدة البيانات"""
    if profile_data.full_name is not None and profile_data.full_name.strip():
        current_user.full_name = profile_data.full_name.strip()
    if profile_data.phone is not None:
        current_user.phone = profile_data.phone.strip()
    if profile_data.website is not None:
        current_user.website = profile_data.website.strip() or None
    if profile_data.industry is not None:
        current_user.industry = profile_data.industry.strip() or None
    if profile_data.skills is not None:
        sanitized_skills = clean_skills(profile_data.skills)
        current_user.skills = sanitized_skills

    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == current_user.id).first()
    if not profile:
        profile = models.StudentProfile(user_id=current_user.id)
        db.add(profile)

    if profile_data.major is not None:
        profile.major = profile_data.major.strip()
    if profile_data.bio is not None:
        profile.bio = profile_data.bio.strip()
    if profile_data.portfolio_url is not None:
        profile.portfolio_url = profile_data.portfolio_url.strip()
    if profile_data.course is not None:
        profile.course = profile_data.course.strip()
    if profile_data.university is not None:
        profile.university = profile_data.university.strip()
    if profile_data.skills is not None:
        profile.skills = clean_skills(profile_data.skills)

    db.commit()
    db.refresh(current_user)
    return get_user_profile_response(current_user, db)


@app.put("/users/me/skills", response_model=schemas.UserProfileResponse)
def update_my_skills(
    skills_in: schemas.UserSkillsUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """تحديث وتطهير مهارات المستخدم الحالي وحفظها في قاعدة البيانات"""
    sanitized = clean_skills(skills_in.skills)
    current_user.skills = sanitized

    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == current_user.id).first()
    if profile:
        profile.skills = sanitized

    db.commit()
    db.refresh(current_user)
    return get_user_profile_response(current_user, db)


CV_MAX_BYTES = 5 * 1024 * 1024


async def read_upload_limited(file: UploadFile, max_bytes: int) -> bytes:
    data = await file.read(max_bytes + 1)
    if len(data) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"حجم الملف يتجاوز الحد المسموح ({max_bytes // (1024 * 1024)} ميغابايت)"
        )
    return data


def store_file_or_503(key: str, data: bytes, content_type: str) -> None:
    try:
        storage.save(key, data, content_type)
    except storage.StorageError:
        logger.error("File storage failed for %s", key, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="تعذر حفظ الملف حالياً، يرجى المحاولة لاحقاً"
        )


def signed_url_or_503(key: str) -> str:
    try:
        return storage.signed_url(key)
    except storage.StorageError:
        logger.error("Could not sign URL for %s", key, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="تعذر تجهيز رابط التنزيل حالياً، يرجى المحاولة لاحقاً"
        )


@app.post("/users/me/cv-upload")
@app.post("/api/users/me/cv-upload")
async def upload_student_cv(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """رفع السيرة الذاتية (PDF حتى 5 ميغابايت) للطلاب فقط، في تخزين خاص مع حذف الملف السابق"""
    if (current_user.role or "").lower() != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="رفع السيرة الذاتية متاح للطلاب فقط"
        )
    data = await read_upload_limited(file, CV_MAX_BYTES)
    if not (file.filename or "").lower().endswith(".pdf") or not data.startswith(storage.PDF_MAGIC):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="صيغة الملف غير مدعومة، يرجى رفع ملف PDF صالح فقط."
        )

    key = f"cvs/{current_user.id}/{uuid.uuid4().hex}.pdf"
    store_file_or_503(key, data, "application/pdf")

    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == current_user.id).first()
    if not profile:
        profile = models.StudentProfile(user_id=current_user.id)
        db.add(profile)
    old_key = profile.cv_key
    profile.cv_key = key
    db.commit()
    if old_key and old_key != key:
        storage.delete(old_key)

    return {
        "status": "success",
        "message": i18n.tr("تم رفع ملف السيرة الذاتية بنجاح"),
        "has_cv": True
    }


def can_view_student_cv(viewer: models.User, student_id: int, db: Session) -> bool:
    """السيرة الذاتية: صاحبها، المشرف/الأدمن فقط. لا يمكن للشركات الاطلاع على السير الذاتية للطلاب"""
    role = (viewer.role or "").lower()
    return viewer.id == student_id or role in ("supervisor", "admin")


@app.get("/users/{user_id}/cv")
def get_student_cv_link(
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """رابط تنزيل مؤقت (10 دقائق) للسيرة الذاتية لمن يملك صلاحية الاطلاع عليها"""
    if not can_view_student_cv(current_user, user_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="ليس لديك الصلاحية للاطلاع على هذه السيرة الذاتية")
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == user_id).first()
    if not profile or not profile.cv_key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="لا توجد سيرة ذاتية مرفوعة")
    return {"url": signed_url_or_503(profile.cv_key), "expires_in": storage.SIGNED_URL_TTL_SECONDS}


@app.get("/files/{token}", include_in_schema=False)
def download_local_file(token: str):
    """تنزيل ملف من التخزين المحلي الاحتياطي عبر توكن موقّع قصير الأجل"""
    path = storage.resolve_local_token(token)
    if not path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الرابط غير صالح أو منتهي الصلاحية")
    return FileResponse(path, filename=os.path.basename(path))


@app.put("/users/me/password")
def change_my_password(
    pwd_data: schemas.PasswordChangeRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """تغيير كلمة المرور للمستخدم الحالي بعد التحقق الأمني من كلمة المرور السابقة"""
    if not utils.verify_password(pwd_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="كلمة المرور الحالية غير صحيحة"
        )
    if len(pwd_data.new_password) < schemas.PASSWORD_MIN_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="يجب أن تتكون كلمة المرور الجديدة من 8 خانات على الأقل"
        )
    current_user.password_hash = utils.hash_password(pwd_data.new_password)
    # إبطال كل التوكنات القديمة وإصدار توكن جديد للجلسة الحالية
    current_user.token_version = (current_user.token_version or 0) + 1
    db.commit()
    db.refresh(current_user)
    return {"message": i18n.tr("تم تحديث كلمة المرور بنجاح"), "access_token": issue_token(current_user), "token_type": "bearer"}


def format_user_item(u: models.User):
    prof = u.profile
    return schemas.UserResponse(
        id=u.id,
        full_name=u.full_name,
        email=u.email,
        role=u.role,
        skills=(prof.skills if prof and prof.skills else u.skills) or "",
        phone=u.phone,
        major=prof.major if prof else None,
        bio=prof.bio if prof else None,
        portfolio_url=public_portfolio_url(prof),
        course=prof.course if prof else None,
        university=prof.university if prof else None,
        is_active=u.is_active is not False,
        created_at=u.created_at
    )


@app.get("/users/", response_model=List[schemas.UserResponse])
@app.get("/api/users/", response_model=List[schemas.UserResponse])
def get_users(
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["supervisor", "admin"]))
):
    """جلب قائمة المستخدمين (للمشرف والأدمن فقط) مع الفلترة بحسب الدور.
    الشركات ترى بيانات المتقدمين عبر /projects/{id}/applications فقط"""
    query = db.query(models.User)
    if role:
        r = role.lower().strip()
        if r in ["company", "partner", "business"]:
            query = query.filter(models.User.role.in_(["company", "partner", "business"]))
        else:
            query = query.filter(models.User.role == r)
    users = query.order_by(models.User.id.desc()).all()
    return [format_user_item(u) for u in users]


# ==========================================
# مسارات المشاريع (Projects & Approvals)
# ==========================================

def clean_skills(skills_str: Optional[str]) -> str:
    """تطهير وتوحيد مسميات المهارات والتقنيات المدخلة ومنع أي رموز مشوهة"""
    if not skills_str:
        return ""
    # الفاصل هو الفاصلة؛ "<" يُعامل كفاصل أيضاً لأن بيانات قديمة خُزنت بصيغة "python<spl"
    parts = [s.strip().strip("'\"<>") for s in re.split(r"[,<]", skills_str) if s.strip().strip("'\"<>")]
    normalized = []
    canonical_map = {
        'spl': 'SQL', 'sql': 'SQL',
        'python': 'Python', 'react': 'React',
        'fastapi': 'FastAPI', 'docker': 'Docker',
        'postgresql': 'PostgreSQL', 'postgres': 'PostgreSQL',
        'node': 'Node.js', 'nodejs': 'Node.js', 'node.js': 'Node.js',
        'tailwind': 'TailwindCSS', 'tailwindcss': 'TailwindCSS',
        'javascript': 'JavaScript', 'typescript': 'TypeScript'
    }
    seen = set()
    for p in parts:
        clean_p = canonical_map.get(p.lower(), p)
        if clean_p.lower() not in seen:
            seen.add(clean_p.lower())
            normalized.append(clean_p)
    return ", ".join(normalized)


PAGE_MAX_LIMIT = 200


def format_projects(projects: List[models.Project], db: Session) -> List[models.Project]:
    """تنسيق قائمة مشاريع باستعلامين مجمّعين للمقاعد وإحصائيات الطلبات وأسماء المشرفين"""
    ids = [p.id for p in projects]
    counts = dict(
        db.query(models.Application.project_id, sa_func.count(models.Application.id)).filter(
            models.Application.project_id.in_(ids),
            models.Application.status.in_(["accepted", "academically_approved"])
        ).group_by(models.Application.project_id).all()
    ) if ids else {}
    submitted_counts = dict(
        db.query(models.Application.project_id, sa_func.count(models.Application.id)).filter(
            models.Application.project_id.in_(ids)
        ).group_by(models.Application.project_id).all()
    ) if ids else {}
    people_ids = {p.supervisor_id for p in projects if p.supervisor_id} | {p.created_by for p in projects if p.created_by}
    people = {u.id: u for u in db.query(models.User).filter(models.User.id.in_(people_ids)).all()} if people_ids else {}
    for p in projects:
        accepted_cnt = counts.get(p.id, 0)
        total_s = p.max_members or 4
        rem_s = max(0, total_s - accepted_cnt)
        p.current_members = accepted_cnt
        p.available_seats = rem_s
        p.seats = total_s
        p.total_seats = total_s
        p.remaining_seats = rem_s
        p.accepted_students_count = accepted_cnt
        p.submitted_applications_count = submitted_counts.get(p.id, 0)
        sup = people.get(p.supervisor_id)
        p.supervisor_name = sup.full_name if sup else None
        creator = people.get(p.created_by)
        if not p.company_name and creator and (creator.role or "").lower() in COMPANY_ROLES:
            p.company_name = creator.full_name
    return projects


def format_project_item(p: models.Project, db: Session):
    accepted_cnt = get_project_accepted_members(p.id, db)
    total_s = p.max_members or 4
    rem_s = max(0, total_s - accepted_cnt)
    p.current_members = accepted_cnt
    p.available_seats = rem_s
    p.seats = total_s
    p.total_seats = total_s
    p.remaining_seats = rem_s
    p.accepted_students_count = accepted_cnt
    p.submitted_applications_count = db.query(models.Application).filter(models.Application.project_id == p.id).count()
    if p.supervisor_id:
        sup = db.query(models.User).filter(models.User.id == p.supervisor_id).first()
        p.supervisor_name = sup.full_name if sup else None
    else:
        p.supervisor_name = None  # لا مشرف مسند بعد - لا اسم افتراضي مختلق
    if not p.company_name and p.creator and (p.creator.role or "").lower() in ["company", "partner", "business"]:
        p.company_name = p.creator.full_name
    return p


@app.post("/projects/", response_model=schemas.ProjectResponse, status_code=status.HTTP_201_CREATED)
@app.post("/api/projects/", response_model=schemas.ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["partner", "company", "business", "supervisor", "student"]))
):
    """طرح مشروع جديد بواسطة الشريك الصناعي أو المشرف، وتسجيل current_user.id كمالك للمشروع وتطهير المهارات"""
    user_role = (current_user.role or "").lower()
    initial_status = "approved" if user_role in ["supervisor", "admin"] else "pending"
    sanitized_skills = clean_skills(project.required_skills)

    # اسم الشركة يُشتق دائماً من حساب المنشئ (يُتجاهل company_name المرسل لمنع انتحال اسم شركة أخرى)
    comp_name = current_user.full_name if user_role in COMPANY_ROLES else None

    sup_id = current_user.id if user_role == "supervisor" else None

    db_project = models.Project(
        title=project.title,
        description=project.description,
        required_skills=sanitized_skills,
        status=initial_status,
        max_members=project.max_members or 4,
        category=project.category,
        stipend=project.stipend,
        company_name=comp_name,
        supervisor_id=sup_id,
        created_by=current_user.id
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)

    # إشعار المشرفين بوجود مشروع جديد بانتظار الاعتماد
    if db_project.status == "pending":
        for sup in db.query(models.User).filter(models.User.role == "supervisor").all():
            create_notification(
                db=db,
                user_id=sup.id,
                title="مشروع جديد بانتظار الاعتماد ⏳",
                message=f"قام {current_user.full_name} بطرح مشروع جديد: {db_project.title}. يرجى مراجعته واعتماده أو رفضه.",
                link="/supervisor",
                title_en="New project awaiting approval ⏳",
                message_en=f"{current_user.full_name} posted a new project: {db_project.title}. Please review it and approve or reject it.",
                project_id=db_project.id
            )

    return format_project_item(db_project, db)


@app.get("/projects/my", response_model=Optional[schemas.ProjectResponse])
@app.get("/api/projects/my", response_model=Optional[schemas.ProjectResponse])
def get_my_assigned_project(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """جلب المشروع الفعلي المعتمد التابع للطالب أو الشركة أو المشرف من قاعدة البيانات دون أي بيانات وهمية"""
    user_role = (current_user.role or "").lower()

    if user_role == "student":
        # 1. فحص طلبات الانضمام المعتمدة أكاديمياً فقط
        accepted_app = db.query(models.Application).filter(
            models.Application.student_id == current_user.id,
            models.Application.status.in_(["accepted", "academically_approved"])
        ).order_by(models.Application.id.desc()).first()
        if accepted_app:
            proj = db.query(models.Project).filter(models.Project.id == accepted_app.project_id).first()
            if proj and proj.status in ["approved", "academically_approved"]:
                return format_project_item(proj, db)

        # 2. فحص المشاريع التي أنشأها الطالب بنفسه والمعتمدة أكاديمياً
        my_created = db.query(models.Project).filter(
            models.Project.created_by == current_user.id,
            models.Project.status.in_(["approved", "academically_approved"])
        ).order_by(models.Project.id.desc()).first()
        if my_created:
            return format_project_item(my_created, db)

        return None

    # للشركة أو المشرف: أحدث مشروع تم إنشاؤه
    proj = db.query(models.Project).filter(models.Project.created_by == current_user.id).order_by(models.Project.id.desc()).first()
    if proj:
        return format_project_item(proj, db)
    return None


@app.get("/projects/", response_model=List[schemas.ProjectResponse])
@app.get("/api/projects/", response_model=List[schemas.ProjectResponse])
def get_projects(
    response: Response,
    status: Optional[str] = None,
    created_by: Optional[int] = None,
    limit: Optional[int] = Query(None, ge=1, le=PAGE_MAX_LIMIT),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user)
):
    """جلب المشاريع المسموح للمستخدم برؤيتها مع المقاعد، ودعم الفلترة والتقسيم (limit/offset + X-Total-Count)"""
    query = visible_projects_query(db.query(models.Project), current_user)
    if status:
        query = query.filter(models.Project.status == status.strip().lower())
    if created_by:
        query = query.filter(models.Project.created_by == created_by)
    response.headers["X-Total-Count"] = str(query.count())
    query = query.order_by(models.Project.id.desc()).offset(offset)
    if limit:
        query = query.limit(limit)
    return format_projects(query.all(), db)


@app.get("/projects/{id}", response_model=schemas.ProjectResponse)
@app.get("/api/projects/{id}", response_model=schemas.ProjectResponse)
def get_project(
    id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user)
):
    """جلب تفاصيل مشروع محدد (404 إن لم يكن مسموحاً للمستخدم برؤيته)"""
    project = visible_projects_query(db.query(models.Project), current_user).filter(models.Project.id == id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"المشروع برقم {id} غير موجود"
        )
    return format_project_item(project, db)


# تعديل هذه الحقول على مشروع معتمد يعيده لقيد المراجعة الأكاديمية
PROJECT_CONTENT_FIELDS = {"title", "description", "required_skills", "category"}


@app.put("/projects/{id}", response_model=schemas.ProjectResponse)
@app.put("/api/projects/{id}", response_model=schemas.ProjectResponse)
def update_project(
    id: int, 
    updated_project: schemas.ProjectSupervisorUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """تعديل مشروع: المالك يعدّل المحتوى فقط (ProjectOwnerUpdate)، والمشرف/الأدمن يضيف إسناد المشرف والملاحظات"""
    project = db.query(models.Project).filter(models.Project.id == id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"المشروع برقم {id} غير موجود"
        )

    is_owner = project.created_by == current_user.id
    is_supervisor_or_admin = supervisor_can_manage(project, current_user)

    if not (is_owner or is_supervisor_or_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="ليس لديك الصلاحية لتعديل هذا المشروع، فقط المالك أو المشرف يمكنه ذلك"
        )

    update_data = updated_project.model_dump(exclude_unset=True)
    if not is_supervisor_or_admin:
        # المالك يُقيَّد بمخطط المالك: أي حقل خاص بالمشرف أو المقاعد يُرفض
        if "max_members" in update_data or "seats" in update_data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="تحديد عدد المقاعد مخصص للمشرف الأكاديمي فقط"
            )
        try:
            update_data = schemas.ProjectOwnerUpdate(**update_data).model_dump(exclude_unset=True)
        except ValidationError as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=[{"loc": list(err["loc"]), "msg": err["msg"]} for err in e.errors()]
            )

    update_data = {k: v for k, v in update_data.items() if v is not None}

    if "seats" in update_data and "max_members" not in update_data:
        update_data["max_members"] = update_data.pop("seats")
    else:
        update_data.pop("seats", None)

    if "required_skills" in update_data:
        update_data["required_skills"] = clean_skills(update_data["required_skills"])

    if "max_members" in update_data:
        if update_data["max_members"] < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="عدد المقاعد يجب أن يكون رقماً صحيحاً موجباً (1 على الأقل)"
            )
        current_members = get_project_accepted_members(project.id, db)
        if update_data["max_members"] < current_members:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"لا يمكن تقليل عدد المقاعد إلى أقل من عدد الطلاب المقبولين حالياً ({current_members})"
            )

    if "supervisor_id" in update_data:
        sup = db.query(models.User).filter(models.User.id == update_data["supervisor_id"]).first()
        if not sup or (sup.role or "").lower() not in ("supervisor", "admin"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="المشرف المحدد غير موجود أو ليس مشرفاً أكاديمياً"
            )

    content_changed = any(
        key in PROJECT_CONTENT_FIELDS and getattr(project, key) != value
        for key, value in update_data.items()
    )
    for key, value in update_data.items():
        setattr(project, key, value)

    # تعديل محتوى مشروع معتمد من قِبل مالكه يتطلب إعادة الاعتماد الأكاديمي
    if content_changed and not is_supervisor_or_admin and project.status == "approved":
        project.status = "pending"

    db.commit()
    db.refresh(project)
    return format_project_item(project, db)


@app.put("/projects/{id}/seats", response_model=schemas.ProjectResponse)
@app.put("/api/projects/{id}/seats", response_model=schemas.ProjectResponse)
def update_project_seats(
    id: int,
    seats_in: schemas.ProjectSeatsUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """تحديد عدد مقاعد المشروع بواسطة المشرف الأكاديمي أو الأدمن فقط مع حماية المقاعد الحالية"""
    project = db.query(models.Project).filter(models.Project.id == id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"المشروع برقم {id} غير موجود"
        )
    user_role = (current_user.role or "").lower()
    if user_role not in ("supervisor", "admin") or not supervisor_can_manage(project, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ليس لديك الصلاحية لتحديد مقاعد هذا المشروع، فقط المشرف الأكاديمي أو الأدمن"
        )
    if seats_in.seats < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="عدد المقاعد يجب أن يكون رقماً صحيحاً موجباً (1 على الأقل)"
        )
    current_members = get_project_accepted_members(project.id, db)
    if seats_in.seats < current_members:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"لا يمكن تقليل عدد المقاعد إلى أقل من عدد الطلاب المقبولين حالياً ({current_members})"
        )
    project.max_members = seats_in.seats
    db.commit()
    db.refresh(project)
    return format_project_item(project, db)


@app.put("/projects/{project_id}/status", response_model=schemas.ProjectResponse)
@app.put("/projects/{project_id}/approve", response_model=schemas.ProjectResponse)
@app.put("/api/projects/{project_id}/status", response_model=schemas.ProjectResponse)
def update_project_status(
    project_id: int,
    status_update: Optional[schemas.ProjectStatusUpdate] = None,
    status_query: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """اعتماد أو رفض مشروع بواسطة المشرف الأكاديمي أو الأدمن فقط، مع منع تكرار القرار وحفظ التاريخ والسبب"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"المشروع برقم {project_id} غير موجود"
        )

    user_role = (current_user.role or "").lower()
    if user_role not in ("supervisor", "admin") or not supervisor_can_manage(project, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="ليس لديك الصلاحية لتعديل حالة هذا المشروع، فقط المشرف الأكاديمي أو الأدمن يمكنه ذلك"
        )

    raw_status = (status_update.status if status_update and status_update.status else status_query) or ""
    new_status = raw_status.strip().lower()
    if new_status == "academically_approved":
        new_status = "approved"

    if new_status not in ["approved", "rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="يرجى تحديد قرار صالح للمشروع: approved أو rejected"
        )

    # منع تكرار الاعتماد أو الرفض من خلال Backend API
    if project.status == "approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="المشروع معتمد بالفعل ولا يمكن إعادة اتخاذ القرار بشأنه أو تغييره"
        )
    if project.status == "rejected":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="المشروع مرفوض بالفعل ولا يمكن تغيير حالته مجدداً"
        )

    previous_status = project.status
    project.status = new_status
    project.supervisor_id = current_user.id
    now_ts = sa_func.now()
    project.decided_at = now_ts

    if new_status == "rejected":
        project.rejected_at = now_ts
        if status_update and status_update.feedback:
            project.supervisor_feedback = status_update.feedback.strip()
    elif new_status == "approved":
        if status_update and status_update.seats:
            project.max_members = status_update.seats
        if status_update and status_update.feedback:
            project.supervisor_feedback = status_update.feedback.strip()

    db.commit()
    db.refresh(project)

    # إشعار مالك المشروع بقرار المشرف
    if new_status != previous_status and project.created_by and project.created_by != current_user.id:
        status_titles = {
            "approved": "تم اعتماد مشروعك ✅",
            "rejected": "تم رفض مشروعك ❌",
        }
        status_titles_en = {
            "approved": "Your project was approved ✅",
            "rejected": "Your project was rejected ❌",
        }
        feedback_note = f" ملاحظات المشرف: {project.supervisor_feedback}" if project.supervisor_feedback else ""
        feedback_note_en = f" Supervisor feedback: {project.supervisor_feedback}" if project.supervisor_feedback else ""
        create_notification(
            db=db,
            user_id=project.created_by,
            title=status_titles[new_status],
            message=f"قام المشرف الأكاديمي {current_user.full_name} بتحديث حالة مشروع: {project.title}.{feedback_note}",
            link=home_link(project.created_by, db),
            title_en=status_titles_en[new_status],
            message_en=f"Academic supervisor {current_user.full_name} updated the status of project: {project.title}.{feedback_note_en}",
            project_id=project.id
        )
    return format_project_item(project, db)


@app.delete("/projects/{id}", status_code=status.HTTP_204_NO_CONTENT)
@app.delete("/api/projects/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """حذف مشروع بشكل نهائي مع الحذف المتسلسل لجميع السجلات المرتبطة به - مسموح للمالك والمشرف والأدمن"""
    project = db.query(models.Project).filter(models.Project.id == id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"المشروع برقم {id} غير موجود"
        )

    user_role = (current_user.role or "").lower()
    is_owner = project.created_by == current_user.id
    is_supervisor = user_role == "supervisor"
    is_admin = user_role == "admin"

    if not (is_owner or is_supervisor or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="ليس لديك الصلاحية لحذف هذا المشروع، فقط المالك أو المشرف أو المسؤول يمكنه ذلك"
        )

    try:
        # تسجيل سجل التدقيق الأمني (Audit Trail)
        logger.info(
            f"AUDIT TRAIL: Project ID={id} ('{project.title}') permanently deleted by "
            f"user ID={current_user.id} ({current_user.email}, role={current_user.role})"
        )

        # الحذف المتسلسل (Cascading Deletion) الآمن داخل معاملة ذرية تمنع أي تعارض قيود خارجية
        db.query(models.Notification).filter(models.Notification.project_id == id).delete(synchronize_session=False)
        db.query(models.Message).filter(models.Message.project_id == id).delete(synchronize_session=False)
        db.query(models.Report).filter(models.Report.project_id == id).delete(synchronize_session=False)
        db.query(models.Favorite).filter(models.Favorite.project_id == id).delete(synchronize_session=False)
        db.query(models.Application).filter(models.Application.project_id == id).delete(synchronize_session=False)
        db.delete(project)
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.error(f"Error during cascading delete of project {id}: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="حدث خطأ أثناء حذف المشروع وسجلاته المرتبطة"
        )

    return None


@app.get("/projects/{id}/members", response_model=List[schemas.ProjectMemberOut])
@app.get("/api/projects/{id}/members", response_model=List[schemas.ProjectMemberOut])
def get_project_members(
    id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user)
):
    """جلب قائمة الطلاب المقبولين بالمشروع مع تخصصاتهم الأكاديمية وسجلاتهم"""
    project = db.query(models.Project).filter(models.Project.id == id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"المشروع برقم {id} غير موجود"
        )
    apps = db.query(models.Application).filter(
        models.Application.project_id == id,
        models.Application.status.in_(["accepted", "academically_approved"])
    ).all()
    members = []
    for a in apps:
        student = db.query(models.User).filter(models.User.id == a.student_id).first()
        if student:
            prof = student.profile
            members.append(schemas.ProjectMemberOut(
                id=a.id,
                user_id=student.id,
                full_name=student.full_name,
                email=student.email,
                role="student",
                major=prof.major if prof else None,
                skills=(prof.skills if prof and prof.skills else student.skills) or ""
            ))
    return members


# ==========================================
# مسارات التقديم على المشاريع (Applications & Seats)
# ==========================================

def format_application_item(app_item: models.Application, db: Session):
    """تنسيق وتزويد سجل الطلب ببيانات الطالب والمشروع الحقيقية من قاعدة البيانات"""
    if not app_item:
        return None
    student = db.query(models.User).filter(models.User.id == app_item.student_id).first()
    project = db.query(models.Project).filter(models.Project.id == app_item.project_id).first()
    app_item.student_name = student.full_name if student else f"#{app_item.student_id}"
    app_item.student_email = student.email if student else None
    # بيانات التخصص والنبذة والسيرة الذاتية محفوظة في StudentProfile وليس في جدول المستخدمين
    profile = student.profile if student else None
    app_item.student_major = profile.major if profile else None
    app_item.major = profile.major if profile else None
    app_item.student_skills = (student.skills or (profile.skills if profile else None)) if student else None
    app_item.student_bio = profile.bio if profile else None
    app_item.student_portfolio_url = public_portfolio_url(profile)
    app_item.student_has_cv = bool(profile and profile.cv_key)
    app_item.project_title = project.title if project else f"#{app_item.project_id}"
    app_item.company_name = getattr(project, "company_name", None) if project else None
    app_item.feedback = getattr(app_item, "feedback", None)
    return app_item


@app.post("/applications/", response_model=schemas.ApplicationResponse, status_code=status.HTTP_201_CREATED)
@app.post("/api/applications/", response_model=schemas.ApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply_to_project(
    application: schemas.ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """تقديم طلب انضمام لمشروع بواسطة الطالب الحالي مع فحص المقاعد ومنع التقديم المتكرر"""
    # التقديم للطلاب فقط (require_role يمرّر الأدمن دائماً، لذا نفحص الدور صراحةً)
    if (current_user.role or "").lower() != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="التقديم على المشاريع متاح للطلاب فقط"
        )

    project = db.query(models.Project).filter(models.Project.id == application.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="المشروع المطلوب غير موجود"
        )

    # التقديم على المشاريع المعتمدة فقط
    if project.status != "approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="لا يمكن التقديم إلا على مشروع معتمد من المشرف الأكاديمي"
        )

    if project.created_by == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="لا يمكنك التقديم على مشروع قمت بإنشائه"
        )

    # التحقق من توفر مقاعد شاغرة في المشروع
    accepted_count = get_project_accepted_members(project.id, db)
    max_cap = project.max_members or 4
    if accepted_count >= max_cap:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"المشروع مكتمل المقاعد بالفعل ({accepted_count}/{max_cap}) ولا يقبل طلبات جديدة"
        )

    # منع الطالب من التقديم على نفس المشروع أكثر من مرة
    existing_app = db.query(models.Application).filter(
        models.Application.project_id == application.project_id,
        models.Application.student_id == current_user.id
    ).first()
    if existing_app:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="لقد قمت بالتقديم على هذا المشروع مسبقاً ولا يمكنك التقديم أكثر من مرة"
        )

    new_app = models.Application(
        project_id=application.project_id,
        student_id=current_user.id,
        status="applied",
        message=application.message
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)

    # توليد إشعار فوري للمشرف الأكاديمي فقط (لا إشعار للشركة)
    if project.supervisor_id:
        create_notification(
            db=db,
            user_id=project.supervisor_id,
            title="طلب انضمام جديد لمشروعك 📋",
            message=f"قام الطالب {current_user.full_name} بتقديم طلب انضمام لمشروع: {project.title}",
            link="/supervisor",
            title_en="New project application 📋",
            message_en=f"Student {current_user.full_name} applied to project: {project.title}",
            project_id=project.id
        )
    else:
        for sup in db.query(models.User).filter(models.User.role.in_(["supervisor", "admin"])).all():
            create_notification(
                db=db,
                user_id=sup.id,
                title="طلب انضمام جديد بانتظار المراجعة 📋",
                message=f"قام الطالب {current_user.full_name} بتقديم طلب انضمام لمشروع: {project.title}",
                link="/supervisor",
                title_en="New application awaiting review 📋",
                message_en=f"Student {current_user.full_name} applied to project: {project.title}",
                project_id=project.id
            )

    return format_application_item(new_app, db)


@app.get("/applications/", response_model=List[schemas.ApplicationResponse])
@app.get("/api/applications/", response_model=List[schemas.ApplicationResponse])
def get_all_applications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """جلب الطلبات حسب الصلاحية: المشرف والأدمن يريان كل الطلبات، الطالب يرى طلباته الخاصة فقط.
    الشركات لا تملك أي صلاحية للاطلاع على طلبات الطلاب لحماية خصوصيتهم."""
    user_role = (current_user.role or "").lower()

    if user_role in ["supervisor", "admin"]:
        apps = db.query(models.Application).order_by(models.Application.id.desc()).all()
    elif user_role in COMPANY_ROLES:
        # لا تظهر طلبات الطلاب للشركة
        return []
    else:
        apps = db.query(models.Application).filter(models.Application.student_id == current_user.id).order_by(models.Application.id.desc()).all()

    return [format_application_item(a, db) for a in apps]


@app.get("/projects/{project_id}/applications", response_model=List[schemas.ApplicationResponse])
@app.get("/api/projects/{project_id}/applications", response_model=List[schemas.ApplicationResponse])
def get_project_applications(
    project_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """عرض طلبات مشروع محدد - متاح فقط للمشرف الأكاديمي أو الأدمن أو الطالب صاحب الطلب. الشركات ممنوعة تماماً."""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"المشروع برقم {project_id} غير موجود"
        )

    user_role = (current_user.role or "").lower()
    if user_role in COMPANY_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="الشركات لا تملك صلاحية الاطلاع على طلبات الطلاب أو بياناتهم"
        )

    is_supervisor_or_admin = supervisor_can_manage(project, current_user)
    if not is_supervisor_or_admin:
        if user_role == "student":
            apps = db.query(models.Application).filter(
                models.Application.project_id == project_id,
                models.Application.student_id == current_user.id
            ).all()
            return [format_application_item(a, db) for a in apps]
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="ليس لديك الصلاحية لعرض طلبات هذا المشروع"
        )

    apps = db.query(models.Application).filter(models.Application.project_id == project_id).order_by(models.Application.id.desc()).all()
    return [format_application_item(a, db) for a in apps]


# ==========================================
# آلة حالات طلبات الانضمام (Application State Machine)
# ==========================================

COMPANY_ROLES = {"company", "partner", "business"}

# الحالات التي تحجز مقعداً في المشروع
SEAT_STATUSES = {"company_accepted", "academically_approved"}

# توحيد الحالات القديمة أو المرادفة إلى مجموعة الحالات الرسمية
LEGACY_STATUS_MAP = {
    "pending": "applied",
    "pending_academic_approval": "company_accepted",
    "accepted": "academically_approved",
    "approved": "academically_approved",
}

# الانتقالات المسموحة لكل طرف: {الحالة الحالية: {الحالات الجديدة المسموحة}}
OWNER_TRANSITIONS = {
    "applied": {"company_accepted", "rejected"},
    "company_accepted": {"rejected"},
}
SUPERVISOR_TRANSITIONS = {
    "applied": {"academically_approved", "rejected"},
    "company_accepted": {"academically_approved", "rejected"},
    "academically_approved": {"rejected"},
}


def normalize_application_status(value: Optional[str]) -> str:
    value = (value or "").strip().lower()
    return LEGACY_STATUS_MAP.get(value, value)


def get_application_actor(project: Optional[models.Project], user: models.User) -> Optional[str]:
    """تحديد صفة المستخدم في قرار الطلب: supervisor (مشرف/أدمن) أو owner (الشركة المالكة) أو None"""
    user_role = (user.role or "").lower()
    if user_role in ("supervisor", "admin"):
        return "supervisor" if supervisor_can_manage(project, user) else None
    if project and project.created_by == user.id and user_role in COMPANY_ROLES:
        return "owner"
    return None


def project_has_company_owner(project: Optional[models.Project], db: Session) -> bool:
    if not project or not project.created_by:
        return False
    creator = db.query(models.User).filter(models.User.id == project.created_by).first()
    return bool(creator) and (creator.role or "").lower() in COMPANY_ROLES


@app.put("/applications/{id}/status", response_model=schemas.ApplicationResponse)
@app.put("/api/applications/{id}/status", response_model=schemas.ApplicationResponse)
def update_application_status(
    id: int,
    status_update: Optional[schemas.ApplicationStatusUpdate] = None,
    status_query: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """تحديث حالة الطلب بواسطة المشرف الأكاديمي أو الأدمن فقط مع فحص السعة وحماية التنافس المتزامن"""
    application = db.query(models.Application).filter(models.Application.id == id).first()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="طلب الانضمام غير موجود"
        )

    project = db.query(models.Project).filter(models.Project.id == application.project_id).first()
    user_role = (current_user.role or "").lower()
    if user_role in COMPANY_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="الشركات لا تملك صلاحية إدارة أو اعتماد طلبات الطلاب، القرار مخصص للمشرف الأكاديمي فقط"
        )

    if user_role not in ("supervisor", "admin") or not supervisor_can_manage(project, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ليس لديك الصلاحية لتغيير حالة هذا الطلب، فقط المشرف الأكاديمي المسؤول أو الأدمن"
        )

    requested = (status_update.status if status_update and status_update.status else status_query) or ""
    feedback_text = status_update.feedback.strip() if status_update and status_update.feedback else None
    if not requested.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="يرجى إرسال الحالة الجديدة للطلب"
        )

    new_status = normalize_application_status(requested)
    current_status = normalize_application_status(application.status)

    if new_status == current_status:
        return format_application_item(application, db)
    if new_status not in SUPERVISOR_TRANSITIONS.get(current_status, set()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"انتقال غير مسموح من الحالة '{current_status}' إلى '{new_status}'"
        )

    if new_status == "academically_approved" and (not project or project.status != "approved"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="لا يمكن اعتماد الطلب أكاديمياً قبل اعتماد المشروع نفسه"
        )

    # فحص السعة عند أي انتقال يحجز مقعداً جديداً مع قفل التنافس المتزامن
    if new_status in ("academically_approved", "accepted") and current_status not in ("academically_approved", "accepted"):
        locked_proj = db.query(models.Project).filter(models.Project.id == application.project_id).with_for_update().first()
        current_accepted = get_project_accepted_members(application.project_id, db)
        max_cap = (locked_proj.max_members if locked_proj else (project.max_members if project else 4)) or 4
        if current_accepted >= max_cap:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"لا يمكن قبول الطلب، المقاعد مكتملة للمشروع ({current_accepted}/{max_cap})"
            )

    application.status = new_status
    if feedback_text:
        application.feedback = feedback_text
    # المشرف الذي يعتمد أول طالب يصبح المشرف المسند للمشروع (دون تغيير حالة المشروع)
    if new_status == "academically_approved" and project and not project.supervisor_id:
        project.supervisor_id = current_user.id
    db.commit()
    db.refresh(application)

    student = db.query(models.User).filter(models.User.id == application.student_id).first()
    student_name = student.full_name if student else ""
    proj_title = project.title if project else f"#{application.project_id}"
    feedback_note = f"ملاحظات: {feedback_text}" if feedback_text else ""
    feedback_note_en = f"Feedback: {feedback_text}" if feedback_text else ""

    if new_status == "academically_approved":
        create_notification(
            db=db,
            user_id=application.student_id,
            title="تم الاعتماد الأكاديمي رسمياً! 🎓",
            message=f"اعتمد المشرف الأكاديمي {current_user.full_name} انضمامك لمشروع: {proj_title}. تم تفعيل مساحة العمل ومتابعة التقارير رسمياً! {feedback_note}",
            link="/my-projects",
            title_en="Academically approved! 🎓",
            message_en=f"Academic supervisor {current_user.full_name} approved your membership in: {proj_title}. Your workspace and reports are now active! {feedback_note_en}",
            project_id=application.project_id
        )
    elif new_status == "rejected":
        create_notification(
            db=db,
            user_id=application.student_id,
            title="تحديث بخصوص طلب الانضمام",
            message=f"تم رفض طلب انضمامك لمشروع: {proj_title}. {feedback_note}",
            link="/my-projects",
            title_en="Application update",
            message_en=f"Your application to project: {proj_title} was rejected. {feedback_note_en}",
            project_id=application.project_id
        )

    return format_application_item(application, db)


# ==========================================
# مسارات الرسائل والشات التفاعلي (Project Messages)
# ==========================================

def is_project_student_member(project: models.Project, user: models.User, db: Session) -> bool:
    """التحقق مما إذا كان الطالب عضواً معتمداً في فريق المشروع"""
    role = (user.role or "").lower()
    if role != "student":
        return False
    if project.created_by == user.id:
        return True
    return is_approved_member(project.id, user.id, db)


def check_channel_access(project: models.Project, conversation_type: str, user: models.User, db: Session) -> bool:
    """التحقق الصارم من صلاحيات الوصول لقناة المحادثة المحددة"""
    role = (user.role or "").lower()
    conv = (conversation_type or "company_student").lower()

    if role == "admin":
        return True

    # 1. قناة الإشراف والمتابعة الأكاديمية (supervisor_student)
    if conv in ("supervisor_student", "supervisor"):
        # الشركات محظورة تماماً ومطلقاً من الوصول لهذه القناة
        if role in ("company", "partner", "business"):
            return False
        if role == "supervisor":
            return bool(project.supervisor_id and project.supervisor_id == user.id)
        if role == "student":
            return is_project_student_member(project, user, db)
        return False

    # 2. قناة نقاش الشركة والطلاب الفني (company_student)
    if role in ("company", "partner", "business"):
        return project.created_by == user.id
    if role == "supervisor":
        return bool(project.supervisor_id and project.supervisor_id == user.id)
    if role == "student":
        return is_project_student_member(project, user, db)
    return False


def check_project_access(project: models.Project, user: models.User, db: Session) -> bool:
    """الوصول العام لشات المشروع"""
    if (user.role or "").lower() == "admin":
        return True
    if project.created_by == user.id:
        return True
    if project.supervisor_id and project.supervisor_id == user.id:
        return True
    return is_approved_member(project.id, user.id, db)


@app.post("/projects/{project_id}/messages", response_model=schemas.MessageResponse, status_code=status.HTTP_201_CREATED)
@app.post("/api/projects/{project_id}/messages", response_model=schemas.MessageResponse, status_code=status.HTTP_201_CREATED)
def create_project_message(
    project_id: int,
    msg_in: schemas.MessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """إرسال رسالة جديدة في شات المشروع مع حماية الخصوصية وفصل القنوات"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"المشروع برقم {project_id} غير موجود"
        )

    # تحديد وتوحيد نوع القناة
    conv_type = (msg_in.conversation_type or "company_student").strip().lower()
    if conv_type in ("supervisor", "supervisor_student"):
        conv_type = "supervisor_student"
    else:
        conv_type = "company_student"

    if not check_channel_access(project, conv_type, current_user, db):
        if conv_type == "supervisor_student" and (current_user.role or "").lower() in ("company", "partner", "business"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="لا يمكن للشركات الوصول إلى قناة الإشراف الأكاديمي أو إرسال رسائل فيها"
            )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ليس لديك الصلاحية للدخول أو المشاركة في قناة هذه المحادثة"
        )

    text_content = msg_in.text.strip()
    if not text_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="لا يمكن إرسال رسالة فارغة"
        )

    recipient_id = msg_in.recipient_id
    if recipient_id:
        if recipient_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="لا يمكن إرسال رسالة خاصة إلى نفسك"
            )
        recipient_user = db.query(models.User).filter(models.User.id == recipient_id).first()
        if not recipient_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="المستلم المحدد غير موجود"
            )
        if not check_channel_access(project, conv_type, recipient_user, db):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="المستلم المحدد ليس مصرحاً له بالمشاركة في هذه القناة"
            )

    new_msg = models.Message(
        project_id=project_id,
        sender_id=current_user.id,
        recipient_id=recipient_id,
        conversation_type=conv_type,
        text=text_content
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)

    # إرسال الإشعارات للمستهدفين في القناة فقط
    notify_user_ids = set()
    approved_students = {
        a.student_id for a in db.query(models.Application.student_id).filter(
            models.Application.project_id == project.id,
            models.Application.status.in_(APPROVED_MEMBER_STATUSES)
        ).all()
    }
    if project.created_by and (current_user.role or "").lower() == "student" and project.created_by == current_user.id:
        approved_students.add(project.created_by)

    if conv_type == "supervisor_student":
        # في قناة الإشراف: المشرف والطلاب المعنيون فقط (الشركة مستبعدة تماماً)
        if recipient_id:
            notify_user_ids.add(recipient_id)
            if current_user.id != project.supervisor_id and project.supervisor_id:
                notify_user_ids.add(project.supervisor_id)
        else:
            if project.supervisor_id:
                notify_user_ids.add(project.supervisor_id)
            notify_user_ids.update(approved_students)
        notify_user_ids.discard(current_user.id)

        for u_id in notify_user_ids:
            create_notification(
                db=db,
                user_id=u_id,
                title="رسالة جديدة في الإشراف الأكاديمي",
                message=f"أرسل {current_user.full_name} في إشراف مشروع {project.title}: '{text_content[:60]}'",
                link=home_link(u_id, db),
                title_en="New academic supervision message",
                message_en=f"{current_user.full_name} sent a message in supervision for {project.title}: '{text_content[:60]}'",
                project_id=project.id
            )
    else:
        # قناة الشركة والطلاب: إشعار المستلم المحدد فقط في الرسائل الخاصة، أو إشعار الفريق في الرسائل العامة
        if recipient_id:
            notify_user_ids.add(recipient_id)
        else:
            if project.created_by:
                notify_user_ids.add(project.created_by)
            notify_user_ids.update(approved_students)
            if project.supervisor_id:
                notify_user_ids.add(project.supervisor_id)
        notify_user_ids.discard(current_user.id)

        for u_id in notify_user_ids:
            create_notification(
                db=db,
                user_id=u_id,
                title="رسالة جديدة في شات المشروع الفني",
                message=f"أرسل {current_user.full_name} رسالة في مشروع {project.title}: '{text_content[:60]}'",
                link=home_link(u_id, db),
                title_en="New message in technical project chat",
                message_en=f"{current_user.full_name} sent a message in {project.title}: '{text_content[:60]}'",
                project_id=project.id
            )

    return schemas.MessageResponse(
        id=new_msg.id,
        project_id=new_msg.project_id,
        sender_id=new_msg.sender_id,
        recipient_id=new_msg.recipient_id,
        conversation_type=new_msg.conversation_type,
        sender_name=current_user.full_name,
        sender_role=current_user.role,
        text=new_msg.text,
        created_at=new_msg.created_at
    )


@app.get("/projects/{project_id}/messages", response_model=List[schemas.MessageResponse])
@app.get("/api/projects/{project_id}/messages", response_model=List[schemas.MessageResponse])
def get_project_messages(
    project_id: int,
    conversation_type: str = Query("company_student"),
    student_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """جلب سجل رسائل قناة محددة بالترتيب الزمني مع الحماية الصارمة من تسريب البيانات والرسائل الخاصة"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"المشروع برقم {project_id} غير موجود"
        )

    conv_type = (conversation_type or "company_student").strip().lower()
    if conv_type in ("supervisor", "supervisor_student"):
        conv_type = "supervisor_student"
    else:
        conv_type = "company_student"

    if not check_channel_access(project, conv_type, current_user, db):
        if conv_type == "supervisor_student" and (current_user.role or "").lower() in ("company", "partner", "business"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="لا يمكن للشركات الوصول إلى قناة الإشراف الأكاديمي"
            )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ليس لديك الصلاحية لعرض رسائل هذه القناة"
        )

    query = db.query(models.Message).filter(models.Message.project_id == project_id)
    role = (current_user.role or "").lower()
    is_admin = role == "admin"
    is_supervisor = role == "supervisor" and bool(project.supervisor_id and project.supervisor_id == current_user.id)

    if conv_type == "supervisor_student":
        query = query.filter(models.Message.conversation_type == "supervisor_student")
        if role == "student":
            query = query.filter(
                (models.Message.recipient_id == None) |
                (models.Message.recipient_id == current_user.id) |
                (models.Message.sender_id == current_user.id)
            )
        elif (is_supervisor or is_admin) and student_id:
            query = query.filter(
                (models.Message.recipient_id == None) |
                (models.Message.recipient_id == student_id) |
                (models.Message.sender_id == student_id)
            )
    else:
        # قناة نقاش الشركة والطلاب (company_student)
        query = query.filter(
            (models.Message.conversation_type == "company_student") |
            (models.Message.conversation_type == None)
        )
        if role == "student":
            # الطالب يرى الرسائل العامة لمشروعه أو الرسائل الخاصة التي هو مرسلها أو مستلمها
            query = query.filter(
                (models.Message.recipient_id == None) |
                (models.Message.recipient_id == current_user.id) |
                (models.Message.sender_id == current_user.id)
            )
        elif role in COMPANY_ROLES:
            # الشركة ترى الرسائل العامة لمشروعها أو الرسائل الخاصة الموجهة إليها أو الصادرة منها
            # ولا يمكنها رؤية الرسائل الخاصة بين الطلاب أو بين الطالب والمشرف
            query = query.filter(
                (models.Message.recipient_id == None) |
                (models.Message.recipient_id == current_user.id) |
                (models.Message.sender_id == current_user.id)
            )
        elif (is_supervisor or is_admin) and student_id:
            query = query.filter(
                (models.Message.recipient_id == None) |
                (models.Message.recipient_id == student_id) |
                (models.Message.sender_id == student_id)
            )

    messages = query.order_by(models.Message.created_at.asc()).all()

    results = []
    for m in messages:
        sender_name = m.sender.full_name if m.sender else f"#{m.sender_id}"
        sender_role = m.sender.role if m.sender else "user"
        results.append(schemas.MessageResponse(
            id=m.id,
            project_id=m.project_id,
            sender_id=m.sender_id,
            recipient_id=m.recipient_id,
            conversation_type=m.conversation_type or "company_student",
            sender_name=sender_name,
            sender_role=sender_role,
            text=m.text,
            created_at=m.created_at
        ))
    return results


@app.delete("/projects/{project_id}/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
@app.delete("/api/projects/{project_id}/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project_message(
    project_id: int,
    message_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """حذف رسالة محددة مع التحقق الصارم من ملكية الرسالة أو الصلاحية الإشرافية"""
    msg = db.query(models.Message).filter(
        models.Message.id == message_id,
        models.Message.project_id == project_id
    ).first()
    if not msg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="الرسالة غير موجودة في هذا المشروع"
        )

    user_role = (current_user.role or "").lower()
    is_author = msg.sender_id == current_user.id
    is_admin = user_role == "admin"
    is_supervisor = user_role == "supervisor" and bool(msg.project and msg.project.supervisor_id == current_user.id)

    if not (is_author or is_admin or is_supervisor):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ليس لديك الصلاحية لحذف هذه الرسالة"
        )

    db.delete(msg)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ==========================================
# مسارات الإشعارات والتنبيهات (Notifications)
# ==========================================

@app.get("/notifications", response_model=List[schemas.NotificationResponse])
@app.get("/notifications/", response_model=List[schemas.NotificationResponse])
@app.get("/api/notifications", response_model=List[schemas.NotificationResponse])
def get_user_notifications(
    response: Response,
    limit: int = Query(50, ge=1, le=PAGE_MAX_LIMIT),
    offset: int = Query(0, ge=0),
    is_read: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """جلب إشعارات المستخدم الحالي (الأحدث أولاً) بلغة الطلب، مع التقسيم limit/offset و X-Total-Count وإمكانية الفلترة بحالة القراءة"""
    query = db.query(models.Notification).filter(models.Notification.user_id == current_user.id)
    if is_read is not None:
        query = query.filter(models.Notification.is_read == is_read)
    response.headers["X-Total-Count"] = str(query.count())
    rows = query.order_by(models.Notification.created_at.desc(), models.Notification.id.desc()).offset(offset).limit(limit).all()
    return [localize_notification(n) for n in rows]


def localize_notification(n: models.Notification) -> schemas.NotificationResponse:
    english = i18n.current_lang.get() == "en"
    proj_id = n.project_id or getattr(n, "related_project_id", None)
    return schemas.NotificationResponse(
        id=n.id,
        user_id=n.user_id,
        title=(n.title_en if english and n.title_en else n.title),
        message=(n.message_en if english and n.message_en else n.message),
        link=n.link,
        project_id=proj_id,
        related_project_id=getattr(n, "related_project_id", None) or proj_id,
        related_application_id=getattr(n, "related_application_id", None),
        notification_type=getattr(n, "notification_type", None) or "general",
        is_read=bool(n.is_read),
        created_at=n.created_at,
    )


@app.get("/notifications/unread-count", response_model=schemas.UnreadCountResponse)
@app.get("/api/notifications/unread-count", response_model=schemas.UnreadCountResponse)
def get_unread_notifications_count(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """عدد الإشعارات غير المقروءة للمستخدم الحالي"""
    count = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False
    ).count()
    return schemas.UnreadCountResponse(unread_count=count)


@app.patch("/notifications/{id}/read", response_model=schemas.NotificationResponse)
@app.patch("/api/notifications/{id}/read", response_model=schemas.NotificationResponse)
@app.put("/notifications/{id}/read", response_model=schemas.NotificationResponse)
@app.put("/api/notifications/{id}/read", response_model=schemas.NotificationResponse)
def mark_notification_as_read(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """تحديد الإشعار كمقروء للمستخدم الحالي مع منع التعديل على إشعارات الآخرين"""
    notif = db.query(models.Notification).filter(models.Notification.id == id).first()
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="الإشعار غير موجود"
        )
    if notif.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ليس لديك الصلاحية لتعديل إشعار مستخدم آخر"
        )
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return localize_notification(notif)


@app.patch("/notifications/read-all", status_code=status.HTTP_200_OK)
@app.patch("/api/notifications/read-all", status_code=status.HTTP_200_OK)
@app.put("/notifications/read-all", status_code=status.HTTP_200_OK)
@app.put("/api/notifications/read-all", status_code=status.HTTP_200_OK)
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """تحديد كافة إشعارات المستخدم الحالي فقط كمقروءة"""
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return {"message": i18n.tr("تم تحديد جميع الإشعارات كمقروءة")}


@app.delete("/notifications/{id}", status_code=status.HTTP_204_NO_CONTENT)
@app.delete("/api/notifications/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """حذف إشعار محدد للمستخدم الحالي مع حظر حذف إشعارات المستخدمين الآخرين"""
    notif = db.query(models.Notification).filter(models.Notification.id == id).first()
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="الإشعار غير موجود"
        )
    if notif.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ليس لديك الصلاحية لحذف إشعار مستخدم آخر"
        )
    db.delete(notif)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ==========================================
# مسارات مراحل التسليم والتقارير الأكاديمية (Reports & Deliverables)
# ==========================================

REPORT_MAX_BYTES = 10 * 1024 * 1024


def can_review_report(project: Optional[models.Project], user: models.User) -> bool:
    """مراجعة التقرير: مالك المشروع، المشرف المسند إليه، أو الأدمن"""
    if (user.role or "").lower() == "admin":
        return True
    return bool(project) and user.id in (project.created_by, project.supervisor_id)


def can_view_report(report: models.Report, project: Optional[models.Project], user: models.User, db: Session) -> bool:
    role = (user.role or "").lower()
    if role in ("supervisor", "admin") or report.student_id == user.id:
        return True
    if project and project.created_by == user.id:
        return True
    return role == "student" and is_approved_member(report.project_id, user.id, db)


def format_report_item(r: models.Report, db: Session, viewer: Optional[models.User] = None):
    """تنسيق سجل التقرير ببيانات الطالب والمشروع وصلاحية المراجعة للمستخدم الحالي"""
    if not r:
        return None
    st = db.query(models.User).filter(models.User.id == r.student_id).first()
    pj = db.query(models.Project).filter(models.Project.id == r.project_id).first()
    r.student_name = st.full_name if st else f"#{r.student_id}"
    r.project_title = pj.title if pj else f"#{r.project_id}"
    r.has_file = bool(r.file_key)
    r.can_review = bool(viewer) and can_review_report(pj, viewer)
    return r


@app.get("/reports/", response_model=List[schemas.ReportResponse])
@app.get("/api/reports/", response_model=List[schemas.ReportResponse])
def get_reports(
    project_id: Optional[int] = None,
    student_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """جلب التقارير المسموح للمستخدم برؤيتها مع الفلترة بحسب المشروع أو الطالب أو الحالة"""
    user_role = (current_user.role or "").lower()
    query = db.query(models.Report)

    if user_role == "student":
        # تقاريره وتقارير زملائه في المشاريع المعتمد فيها (academically_approved أو accepted القديمة)
        member_proj_ids = [
            a.project_id for a in db.query(models.Application.project_id).filter(
                models.Application.student_id == current_user.id,
                models.Application.status.in_(APPROVED_MEMBER_STATUSES)
            ).all()
        ]
        query = query.filter(
            (models.Report.student_id == current_user.id) |
            (models.Report.project_id.in_(member_proj_ids))
        )
    elif user_role in COMPANY_ROLES:
        company_projects = db.query(models.Project.id).filter(models.Project.created_by == current_user.id).all()
        p_ids = [p[0] for p in company_projects]
        query = query.filter(models.Report.project_id.in_(p_ids))

    if project_id:
        query = query.filter(models.Report.project_id == project_id)
    if student_id:
        query = query.filter(models.Report.student_id == student_id)
    if status:
        query = query.filter(models.Report.status == status.strip().lower())

    reports = query.order_by(models.Report.id.desc()).all()
    return [format_report_item(r, db, current_user) for r in reports]


@app.post("/reports/upload")
@app.post("/api/reports/upload")
async def upload_report_file(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user)
):
    """رفع ملف تقرير (PDF/DOCX/PPTX/ZIP/DOC حتى 10 ميغابايت) إلى التخزين الخاص، يعيد file_key لاستخدامه في POST /reports/"""
    if (current_user.role or "").lower() != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="رفع ملفات التقارير متاح للطلاب فقط")
    data = await read_upload_limited(file, REPORT_MAX_BYTES)
    ext = os.path.splitext((file.filename or "").lower())[1]
    allowed = storage.REPORT_TYPES.get(ext)
    if not allowed or not data.startswith(allowed[1]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="صيغة الملف غير مدعومة. الصيغ المسموحة: PDF, DOCX, PPTX, ZIP, DOC"
        )
    key = f"reports/{current_user.id}/{uuid.uuid4().hex}{ext}"
    store_file_or_503(key, data, allowed[0])
    return {"file_key": key, "filename": file.filename}


@app.get("/reports/{id}/file")
@app.get("/api/reports/{id}/file")
def get_report_file_link(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """رابط تنزيل مؤقت لملف التقرير لمن يحق له رؤية التقرير"""
    report = db.query(models.Report).filter(models.Report.id == id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="التقرير المطلوب غير موجود")
    project = db.query(models.Project).filter(models.Project.id == report.project_id).first()
    if not can_view_report(report, project, current_user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="ليس لديك الصلاحية للاطلاع على هذا التقرير")
    if not report.file_key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="لا يوجد ملف مرفوع لهذا التقرير")
    return {"url": signed_url_or_503(report.file_key), "expires_in": storage.SIGNED_URL_TTL_SECONDS}


@app.post("/reports/", response_model=schemas.ReportResponse, status_code=status.HTTP_201_CREATED)
@app.post("/api/reports/", response_model=schemas.ReportResponse, status_code=status.HTTP_201_CREATED)
def submit_report(
    report_in: schemas.ReportCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["student"]))
):
    """رفع مرحلة تسليم أو تقرير جديد من قبل الطالب مع إشعار فوري للمشرف وصاحب المشروع"""
    project = db.query(models.Project).filter(models.Project.id == report_in.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="المشروع المرتبط بهذا التقرير غير موجود"
        )

    if not is_approved_member(project.id, current_user.id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="لا يمكنك رفع تقرير إلا لمشروع أنت عضو معتمد فيه"
        )

    # الملف المرفوع يجب أن يكون ملف هذا الطالب نفسه
    if report_in.file_key and not report_in.file_key.startswith(f"reports/{current_user.id}/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ملف التقرير غير صالح")

    new_report = models.Report(
        project_id=report_in.project_id,
        student_id=current_user.id,
        title=report_in.title,
        description=report_in.description.strip() if report_in.description else None,
        file_url=report_in.file_url,
        file_key=report_in.file_key,
        deadline_date=report_in.deadline_date,
        status="pending"
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    # إشعار المشرف المسند ومالك المشروع
    for user_id in {project.supervisor_id, project.created_by} - {None, current_user.id}:
        create_notification(
            db=db,
            user_id=user_id,
            title="تسليم تقرير جديد 📄",
            message=f"قام الطالب {current_user.full_name} برفع تقرير جديد '{new_report.title}' لمشروع '{project.title}'",
            link="/reports",
            title_en="New report submitted 📄",
            message_en=f"Student {current_user.full_name} submitted a new report '{new_report.title}' for '{project.title}'",
            project_id=project.id
        )

    return format_report_item(new_report, db, current_user)


@app.put("/reports/{id}/status", response_model=schemas.ReportResponse)
@app.put("/api/reports/{id}/status", response_model=schemas.ReportResponse)
def update_report_status(
    id: int,
    status_update: schemas.ReportStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["supervisor", "admin", "partner", "company", "business"]))
):
    """تقييم واعتماد أو طلب تعديل تقرير من قبل المشرف الأكاديمي أو الشريك"""
    report = db.query(models.Report).filter(models.Report.id == id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="التقرير المطلوب غير موجود"
        )

    # المراجعة لمالك المشروع أو المشرف المسند إليه أو الأدمن فقط
    project = db.query(models.Project).filter(models.Project.id == report.project_id).first()
    is_admin = (current_user.role or "").lower() == "admin"
    is_owner = bool(project) and project.created_by == current_user.id
    is_assigned_supervisor = bool(project) and project.supervisor_id == current_user.id
    if not (is_admin or is_owner or is_assigned_supervisor):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ليس لديك الصلاحية لمراجعة هذا التقرير، فقط مالك المشروع أو مشرفه أو الأدمن"
        )

    st = status_update.status.strip().lower()
    if st not in ["approved", "needs_changes", "pending", "rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="حالة التقرير غير صالحة. الحالات المسموحة: approved, needs_changes, pending, rejected"
        )

    report.status = st
    if status_update.supervisor_feedback is not None:
        report.supervisor_feedback = status_update.supervisor_feedback.strip()
    if status_update.grade is not None:
        report.grade = status_update.grade.strip()

    db.commit()
    db.refresh(report)

    status_titles = {
        "approved": "تم اعتماد تقريرك الأكاديمي بنجاح! 🎉",
        "needs_changes": "مطلوب تعديلات على التقرير الأكاديمي ⚠️",
        "rejected": "تم رفض التقرير الأكاديمي"
    }
    status_titles_en = {
        "approved": "Your report was approved! 🎉",
        "needs_changes": "Changes requested on your report ⚠️",
        "rejected": "Your report was rejected"
    }
    create_notification(
        db=db,
        user_id=report.student_id,
        title=status_titles.get(st, "تحديث حالة التقرير"),
        message=f"تم تحديث حالة تقريرك '{report.title}' إلى {st}. ملاحظات: {report.supervisor_feedback or 'لا توجد ملاحظات'}",
        link="/reports",
        title_en=status_titles_en.get(st, "Report status updated"),
        message_en=f"Your report '{report.title}' was updated to {st}. Feedback: {report.supervisor_feedback or 'none'}",
        project_id=report.project_id
    )

    return format_report_item(report, db, current_user)


# ==========================================
# مسارات الإحصائيات الحية للمنصة (Platform Analytics)
# ==========================================

@app.get("/analytics/overview", response_model=schemas.AnalyticsOverviewResponse)
@app.get("/api/analytics/overview", response_model=schemas.AnalyticsOverviewResponse)
def get_platform_analytics(db: Session = Depends(get_db)):
    """حساب وإرجاع إحصائيات المنصة الحية مباشرة من قاعدة البيانات بنسبة 100% دون أي أرقام وهمية"""
    total_projects = db.query(models.Project).count()
    approved_projects = db.query(models.Project).filter(models.Project.status == "approved").count()
    pending_projects = db.query(models.Project).filter(models.Project.status == "pending").count()
    total_students = db.query(models.User).filter(models.User.role == "student").count()
    total_companies = db.query(models.User).filter(models.User.role.in_(["company", "partner", "business"])).count()
    total_supervisors = db.query(models.User).filter(models.User.role == "supervisor").count()
    total_applications = db.query(models.Application).count()
    total_reports = db.query(models.Report).count()
    pending_reports = db.query(models.Report).filter(models.Report.status == "pending").count()
    approved_reports = db.query(models.Report).filter(models.Report.status == "approved").count()

    projects = db.query(models.Project.required_skills).all()
    skill_counts = {}
    for (skills_str,) in projects:
        if skills_str:
            for s in re.split(r"[,<]", skills_str):
                s_clean = s.strip()
                if s_clean:
                    skill_counts[s_clean] = skill_counts.get(s_clean, 0) + 1

    top_skills_list = []
    tot_skills_count = sum(skill_counts.values()) or 1
    sorted_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    for skill_name, cnt in sorted_skills:
        pct = int(round((cnt / tot_skills_count) * 100))
        top_skills_list.append(schemas.TopSkillItem(name=skill_name, count=cnt, percent=pct))

    return schemas.AnalyticsOverviewResponse(
        total_projects=total_projects,
        approved_projects=approved_projects,
        pending_projects=pending_projects,
        total_students=total_students,
        total_companies=total_companies,
        total_supervisors=total_supervisors,
        total_applications=total_applications,
        total_reports=total_reports,
        pending_reports=pending_reports,
        approved_reports=approved_reports,
        top_skills=top_skills_list
    )


# ==========================================
# إدارة المستخدمين (للأدمن فقط) - I-47
# ==========================================

def require_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    if (current_user.role or "").lower() != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="ليس لديك الصلاحية لتنفيذ هذا الإجراء")
    return current_user


def get_user_or_404(user_id: int, db: Session) -> models.User:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المستخدم غير موجود")
    return user


@app.get("/admin/users", response_model=List[schemas.UserResponse])
@app.get("/api/admin/users", response_model=List[schemas.UserResponse])
def admin_list_users(
    response: Response,
    role: Optional[str] = None,
    q: Optional[str] = Query(None, max_length=120),
    limit: int = Query(50, ge=1, le=PAGE_MAX_LIMIT),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin)
):
    """قائمة المستخدمين مع البحث بالاسم/البريد والفلترة بالدور والتقسيم"""
    query = db.query(models.User)
    if role:
        r = role.strip().lower()
        query = query.filter(models.User.role.in_(list(COMPANY_ROLES)) if r in COMPANY_ROLES else models.User.role == r)
    if q and q.strip():
        like = f"%{q.strip().lower()}%"
        query = query.filter(or_(sa_func.lower(models.User.full_name).like(like), sa_func.lower(models.User.email).like(like)))
    response.headers["X-Total-Count"] = str(query.count())
    users = query.order_by(models.User.id.desc()).offset(offset).limit(limit).all()
    return [format_user_item(u) for u in users]


@app.post("/admin/users", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
@app.post("/api/admin/users", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def admin_create_user(
    payload: schemas.AdminUserCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin)
):
    """إنشاء حساب مشرف أكاديمي أو أدمن (لا يمكن إنشاؤهما بالتسجيل الذاتي)"""
    role = payload.role.strip().lower()
    if role not in ("supervisor", "admin"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="الدور غير صالح. الأدوار المسموحة: supervisor, admin")
    email = payload.email.strip().lower()
    if db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="البريد الإلكتروني مسجل مسبقاً لمستخدم آخر")
    user = models.User(full_name=payload.full_name, email=email, password_hash=utils.hash_password(payload.password),
                       role=role, skills="")
    db.add(user)
    db.commit()
    db.refresh(user)
    return format_user_item(user)


@app.patch("/admin/users/{user_id}", response_model=schemas.UserResponse)
@app.patch("/api/admin/users/{user_id}", response_model=schemas.UserResponse)
def admin_update_user(
    user_id: int,
    payload: schemas.AdminUserUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin)
):
    """تعطيل أو تفعيل حساب؛ التعطيل يُبطل كل توكنات الحساب"""
    user = get_user_or_404(user_id, db)
    if user.id == admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="لا يمكنك تعطيل أو حذف حسابك الخاص")
    if user.is_active != payload.is_active:
        user.is_active = payload.is_active
        if not payload.is_active:
            user.token_version = (user.token_version or 0) + 1
        db.commit()
        db.refresh(user)
    return format_user_item(user)


@app.post("/admin/users/{user_id}/reset-password")
@app.post("/api/admin/users/{user_id}/reset-password")
def admin_reset_password(
    user_id: int,
    payload: schemas.AdminPasswordReset,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin)
):
    """تعيين كلمة مرور جديدة لمستخدم وإبطال جلساته الحالية"""
    user = get_user_or_404(user_id, db)
    user.password_hash = utils.hash_password(payload.new_password)
    user.token_version = (user.token_version or 0) + 1
    db.commit()
    return {"message": i18n.tr("تم تحديث كلمة المرور بنجاح")}


@app.delete("/admin/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
@app.delete("/api/admin/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin)
):
    """حذف حساب. المفاتيح الخارجية في قاعدة البيانات تحذف ملفه وطلباته وتقاريره ورسائله وإشعاراته،
    وتجعل منشئ/مشرف مشاريعه فارغاً (المشاريع نفسها تبقى)."""
    user = get_user_or_404(user_id, db)
    if user.id == admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="لا يمكنك تعطيل أو حذف حسابك الخاص")
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == user.id).first()
    cv_key = profile.cv_key if profile else None
    db.query(models.User).filter(models.User.id == user.id).delete(synchronize_session=False)
    db.commit()
    storage.delete(cv_key)
    return None


# ==========================================
# المفضلة والإعدادات (محفوظة في الخادم) - I-30
# ==========================================

@app.get("/users/me/favorites", response_model=List[int])
@app.get("/api/users/me/favorites", response_model=List[int])
def list_my_favorites(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """معرّفات المشاريع المفضلة للمستخدم الحالي"""
    rows = db.query(models.Favorite.project_id).filter(models.Favorite.user_id == current_user.id).order_by(models.Favorite.id).all()
    return [r[0] for r in rows]


@app.put("/users/me/favorites/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
@app.put("/api/users/me/favorites/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def add_my_favorite(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """إضافة مشروع للمفضلة (عملية متكررة آمنة) - فقط لمشروع يحق للمستخدم رؤيته"""
    visible = visible_projects_query(db.query(models.Project), current_user).filter(models.Project.id == project_id).first()
    if not visible:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المشروع المطلوب غير موجود")
    exists = db.query(models.Favorite).filter(models.Favorite.user_id == current_user.id, models.Favorite.project_id == project_id).first()
    if not exists:
        db.add(models.Favorite(user_id=current_user.id, project_id=project_id))
        db.commit()
    return None


@app.delete("/users/me/favorites/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
@app.delete("/api/users/me/favorites/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_my_favorite(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db.query(models.Favorite).filter(models.Favorite.user_id == current_user.id, models.Favorite.project_id == project_id).delete(synchronize_session=False)
    db.commit()
    return None


def read_user_settings(user: models.User) -> schemas.UserSettings:
    try:
        return schemas.UserSettings(**json.loads(user.settings)) if user.settings else schemas.UserSettings()
    except (ValueError, TypeError):
        return schemas.UserSettings()


@app.get("/users/me/settings", response_model=schemas.UserSettings)
@app.get("/api/users/me/settings", response_model=schemas.UserSettings)
def get_my_settings(current_user: models.User = Depends(get_current_user)):
    return read_user_settings(current_user)


@app.put("/users/me/settings", response_model=schemas.UserSettings)
@app.put("/api/users/me/settings", response_model=schemas.UserSettings)
def update_my_settings(
    settings_in: schemas.UserSettings,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    current_user.settings = settings_in.model_dump_json()
    db.commit()
    return settings_in
