import os
import re
import uuid
import shutil
import logging
from typing import List, Optional
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException, Query, Request, status, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import text, or_

import models
import schemas
import utils
from database import engine, get_db

logger = logging.getLogger("capstone_api")

# إنشاء الجداول تلقائياً إن لم تكن موجودة مسبقاً
models.Base.metadata.create_all(bind=engine)

# التحقق من وجود الأعمدة والقيود الحديثة في قاعدة البيانات (PostgreSQL/SQLite) دون تعطيل التشغيل
with engine.connect() as conn:
    for stmt in [
        "ALTER TABLE projects ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'pending'",
        "ALTER TABLE projects ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 4",
        "ALTER TABLE projects ADD COLUMN IF NOT EXISTS category VARCHAR(100)",
        "ALTER TABLE projects ADD COLUMN IF NOT EXISTS stipend VARCHAR(100)",
        "ALTER TABLE projects ADD COLUMN IF NOT EXISTS company_name VARCHAR(150)",
        "ALTER TABLE projects ADD COLUMN IF NOT EXISTS supervisor_id INTEGER",
        "ALTER TABLE projects ADD COLUMN IF NOT EXISTS supervisor_feedback TEXT",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS skills TEXT DEFAULT ''",
        "ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS bio TEXT",
        "ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS portfolio_url VARCHAR(255)",
        "ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS course VARCHAR(100)",
        "ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS university VARCHAR(150)",
        "ALTER TABLE applications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        "ALTER TABLE applications ADD COLUMN IF NOT EXISTS feedback TEXT",
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

# إعداد CORS للنطاقات المصرح لها
ALLOWED_ORIGIN_REGEX = re.compile(r"https://.*\.vercel\.app")
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
    allow_origin_regex=ALLOWED_ORIGIN_REGEX.pattern,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# تهيئة مجلد الرفع وخدمة الملفات الثابتة (مثل ملفات PDF للسيرة الذاتية)
uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

def is_allowed_origin(origin: Optional[str]) -> bool:
    return bool(origin) and (origin in origins or bool(ALLOWED_ORIGIN_REGEX.fullmatch(origin)))


# معرّف فريد لكل طلب يُعاد في الترويسة X-Request-ID ويُسجّل مع أي خطأ لتسهيل التتبع
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = uuid.uuid4().hex
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


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
        content={"detail": "حدث خطأ داخلي في الخادم، يرجى المحاولة لاحقاً", "request_id": request_id},
        headers=headers
    )

# نظام استخراج التوكن OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


# ==========================================
# توابع التحقق من الهوية والصلاحيات (Auth & RBAC)
# ==========================================

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
    user_id = utils.verify_access_token(token)
    if user_id is None:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == user_id).first()
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
    user_id = utils.verify_access_token(token)
    if user_id is None:
        return None
    return db.query(models.User).filter(models.User.id == user_id).first()


def visible_projects_query(query, user: Optional[models.User]):
    """قواعد ظهور المشاريع: الزائر والطالب يرون المعتمد فقط، الشركة ترى المعتمد ومشاريعها، المشرف والأدمن يرون الكل"""
    user_role = (user.role or "").lower() if user else ""
    if user_role in ("supervisor", "admin"):
        return query
    if user_role in COMPANY_ROLES:
        return query.filter(or_(models.Project.status == "approved", models.Project.created_by == user.id))
    return query.filter(models.Project.status == "approved")


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


def get_project_accepted_members(project_id: int, db: Session) -> int:
    """حساب عدد المقاعد المشغولة حالياً (الطلبات المقبولة أو المرشحة) لمشروع محدد"""
    return db.query(models.Application).filter(
        models.Application.project_id == project_id,
        models.Application.status.in_(["accepted", "academically_approved", "company_accepted"])
    ).count()


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    link: Optional[str] = None
):
    """إنشاء وحفظ إشعار جديد لمستخدم محدد"""
    try:
        notif = models.Notification(
            user_id=user_id,
            title=title,
            message=message,
            link=link,
            is_read=False
        )
        db.add(notif)
        db.commit()
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

@app.post("/login", response_model=schemas.Token)
def login(
    user_credentials: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    """تسجيل الدخول وتوليد رمز الوصول JWT"""
    try:
        clean_username = user_credentials.username.strip().lower()
        user = db.query(models.User).filter(models.User.email == clean_username).first()

        if not user or not utils.verify_password(user_credentials.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="البريد الإلكتروني أو كلمة المرور غير صحيحة",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token = utils.create_access_token(
            data={"sub": str(user.id), "user_id": user.id, "email": user.email, "role": user.role}
        )

        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception:
        logger.error("Error in login", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة لاحقاً"
        )


@app.post("/logout", summary="تسجيل الخروج")
def logout(current_user: models.User = Depends(get_current_user)):
    """تأكيد تسجيل الخروج وإنهاء جلسة المستخدم"""
    return {"message": "تم تسجيل الخروج بنجاح", "user_id": current_user.id}


@app.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    """التحقق من هوية المستخدم الحالية وصلاحياته من الـ JWT Token"""
    return current_user


@app.post("/users/", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """إنشاء حساب مستخدم جديد مع حماية أمنية لمنع التصعيد الذاتي للصلاحيات"""
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
            student_profile = models.StudentProfile(
                user_id=new_user.id,
                major="أنظمة المعلومات الحاسوبية (CIS)",
                skills="",
                interests=""
            )
            db.add(student_profile)
            db.commit()

        return new_user
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
        skills=user.skills or (profile.skills if profile else "") or "",
        major=profile.major if profile else None,
        bio=profile.bio if profile else None,
        portfolio_url=profile.portfolio_url if profile else None,
        course=profile.course if profile else None,
        university=profile.university if profile else None,
        created_at=user.created_at
    )


@app.get("/users/me/profile", response_model=schemas.UserProfileResponse)
@app.get("/profile", response_model=schemas.UserProfileResponse)
@app.get("/users/me", response_model=schemas.UserProfileResponse)
@app.get("/api/users/me", response_model=schemas.UserProfileResponse)
@app.get("/api/users/me/profile", response_model=schemas.UserProfileResponse)
def get_my_profile(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """جلب بيانات الملف الشخصي والأكاديمي والمهارات للمستخدم الحالي"""
    return get_user_profile_response(current_user, db)


@app.put("/users/me/profile", response_model=schemas.UserProfileResponse)
@app.put("/profile", response_model=schemas.UserProfileResponse)
@app.put("/users/me", response_model=schemas.UserProfileResponse)
@app.put("/api/users/me", response_model=schemas.UserProfileResponse)
@app.put("/api/users/me/profile", response_model=schemas.UserProfileResponse)
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


@app.post("/users/me/cv-upload")
@app.post("/api/users/me/cv-upload")
async def upload_student_cv(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """رفع ملف السيرة الذاتية (PDF) وتحديث رابط الملف الشخصي للمستخدم الحالي"""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="صيغة الملف غير مدعومة، يرجى رفع ملف بصيغة PDF فقط."
        )

    cvs_dir = os.path.join(uploads_dir, "cvs")
    os.makedirs(cvs_dir, exist_ok=True)
    safe_filename = f"cv_{current_user.id}_{int(datetime.now().timestamp())}.pdf"
    file_path = os.path.join(cvs_dir, safe_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    portfolio_url = f"/uploads/cvs/{safe_filename}"
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == current_user.id).first()
    if not profile:
        profile = models.StudentProfile(user_id=current_user.id)
        db.add(profile)
    profile.portfolio_url = portfolio_url
    db.commit()
    db.refresh(current_user)

    return {
        "status": "success",
        "message": "تم رفع ملف السيرة الذاتية بنجاح",
        "portfolio_url": portfolio_url
    }


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
    if len(pwd_data.new_password.strip()) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="يجب أن تتكون كلمة المرور الجديدة من 6 خانات على الأقل"
        )
    current_user.password_hash = utils.hash_password(pwd_data.new_password.strip())
    db.commit()
    return {"message": "تم تحديث كلمة المرور بنجاح"}


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
        portfolio_url=prof.portfolio_url if prof else None,
        course=prof.course if prof else None,
        university=prof.university if prof else None,
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
    import re
    cleaned = re.sub(r'<spl', ', SQL', skills_str, flags=re.IGNORECASE)
    parts = [s.strip().strip("'\"<>") for s in cleaned.split(',') if s.strip()]
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


def format_project_item(p: models.Project, db: Session):
    p.current_members = get_project_accepted_members(p.id, db)
    p.available_seats = max(0, (p.max_members or 4) - p.current_members)
    if p.supervisor_id:
        sup = db.query(models.User).filter(models.User.id == p.supervisor_id).first()
        p.supervisor_name = sup.full_name if sup else None
    elif not getattr(p, "supervisor_name", None):
        p.supervisor_name = "د. أسامة أمين مرعي"
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

    comp_name = project.company_name
    if not comp_name and user_role in ["partner", "company", "business"]:
        comp_name = current_user.full_name

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
    status: Optional[str] = None,
    created_by: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user)
):
    """جلب المشاريع المسموح للمستخدم برؤيتها (حسب دوره) مع المقاعد المحجوزة والمتاحة ودعم الفلترة"""
    query = visible_projects_query(db.query(models.Project), current_user)
    if status:
        query = query.filter(models.Project.status == status.strip().lower())
    if created_by:
        query = query.filter(models.Project.created_by == created_by)
    projects = query.order_by(models.Project.id.desc()).all()

    return [format_project_item(p, db) for p in projects]


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


@app.put("/projects/{id}", response_model=schemas.ProjectResponse)
def update_project(
    id: int, 
    updated_project: schemas.ProjectUpdate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """تعديل مشروع - مسموح فقط لمالك المشروع أو المشرف أو الأدمن"""
    project = db.query(models.Project).filter(models.Project.id == id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"المشروع برقم {id} غير موجود"
        )

    is_owner = project.created_by == current_user.id
    is_supervisor_or_admin = (current_user.role or "").lower() in ["supervisor", "admin"]

    if not (is_owner or is_supervisor_or_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="ليس لديك الصلاحية لتعديل هذا المشروع، فقط المالك أو المشرف يمكنه ذلك"
        )

    update_data = updated_project.dict(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(project, key, value)

    db.commit()
    db.refresh(project)
    project.current_members = get_project_accepted_members(project.id, db)
    project.available_seats = max(0, (project.max_members or 4) - project.current_members)
    return project


@app.put("/projects/{project_id}/status", response_model=schemas.ProjectResponse)
@app.put("/projects/{project_id}/approve", response_model=schemas.ProjectResponse)
def update_project_status(
    project_id: int,
    status_update: Optional[schemas.ProjectStatusUpdate] = None,
    status_query: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """اعتماد أو رفض أو تعليق مشروع بواسطة المشرف الأكاديمي أو مالك المشروع (PUT /projects/{project_id}/status)"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"المشروع برقم {project_id} غير موجود"
        )

    is_supervisor_or_admin = (current_user.role or "").lower() in ["supervisor", "admin"]

    if not is_supervisor_or_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="ليس لديك الصلاحية لتعديل حالة هذا المشروع، فقط المشرف الأكاديمي أو الأدمن يمكنه ذلك"
        )

    # الحالة مطلوبة صراحةً (في الجسم أو كمعامل status) - لا اعتماد افتراضي عند غيابها
    raw_status = (status_update.status if status_update and status_update.status else status_query) or ""
    new_status = raw_status.strip().lower()
    if not new_status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="يرجى تحديد حالة المشروع الجديدة: approved, rejected, pending"
        )

    if new_status not in ["approved", "academically_approved", "rejected", "pending"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="الحالة غير صالحة. الحالات المسموحة: approved, rejected, pending"
        )

    if new_status == "academically_approved":
        new_status = "approved"

    project.status = new_status
    if status_update and status_update.feedback is not None:
        project.supervisor_feedback = status_update.feedback.strip()
    if is_supervisor_or_admin:
        project.supervisor_id = current_user.id
        project.supervisor_name = current_user.full_name

    db.commit()
    db.refresh(project)
    return format_project_item(project, db)


@app.delete("/projects/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """حذف مشروع - مسموح فقط لمالك المشروع أو المشرف أو الأدمن"""
    project = db.query(models.Project).filter(models.Project.id == id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"المشروع برقم {id} غير موجود"
        )

    is_owner = project.created_by == current_user.id
    is_supervisor_or_admin = (current_user.role or "").lower() in ["supervisor", "admin"]

    if not (is_owner or is_supervisor_or_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="ليس لديك الصلاحية لحذف هذا المشروع، فقط المالك أو المشرف يمكنه ذلك"
        )

    # حذف الرسائل والطلبات المرتبطة بالمشروع لتفادي تعارض المفاتيح الخارجية
    db.query(models.Message).filter(models.Message.project_id == id).delete(synchronize_session=False)
    db.query(models.Application).filter(models.Application.project_id == id).delete(synchronize_session=False)
    db.query(models.Project).filter(models.Project.id == id).delete(synchronize_session=False)
    db.commit()
    return None


# ==========================================
# مسارات التقديم على المشاريع (Applications & Seats)
# ==========================================

def format_application_item(app_item: models.Application, db: Session):
    """تنسيق وتزويد سجل الطلب ببيانات الطالب والمشروع الحقيقية من قاعدة البيانات"""
    if not app_item:
        return None
    student = db.query(models.User).filter(models.User.id == app_item.student_id).first()
    project = db.query(models.Project).filter(models.Project.id == app_item.project_id).first()
    app_item.student_name = student.full_name if student else f"طالب #{app_item.student_id}"
    app_item.student_email = student.email if student else None
    # بيانات التخصص والنبذة والسيرة الذاتية محفوظة في StudentProfile وليس في جدول المستخدمين
    profile = student.profile if student else None
    app_item.student_major = profile.major if profile else None
    app_item.student_skills = (student.skills or (profile.skills if profile else None)) if student else None
    app_item.student_bio = profile.bio if profile else None
    app_item.student_portfolio_url = profile.portfolio_url if profile else None
    app_item.project_title = project.title if project else f"مشروع #{app_item.project_id}"
    app_item.company_name = (getattr(project, "company_name", None) or "شركة شريكة") if project else "شركة شريكة"
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

    # توليد إشعار فوري لصاحب المشروع (الشركة أو المشرف)
    if project.created_by:
        create_notification(
            db=db,
            user_id=project.created_by,
            title="طلب انضمام جديد",
            message=f"قام الطالب {current_user.full_name} بتقديم طلب انضمام لمشروعك: {project.title}",
            link=f"/projects/{project.id}"
        )

    return format_application_item(new_app, db)


@app.get("/applications/", response_model=List[schemas.ApplicationResponse])
@app.get("/api/applications/", response_model=List[schemas.ApplicationResponse])
def get_all_applications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """جلب الطلبات حسب الصلاحية: المشرف والأدمن يريان كل الطلبات، الشركة ترى طلبات مشاريعها، والطالب يرى طلباته الخاصة"""
    user_role = (current_user.role or "").lower()

    if user_role in ["supervisor", "admin"]:
        apps = db.query(models.Application).order_by(models.Application.id.desc()).all()
    elif user_role in ["partner", "company", "business"]:
        user_projects = db.query(models.Project.id).filter(models.Project.created_by == current_user.id).all()
        project_ids = [p[0] for p in user_projects]
        apps = db.query(models.Application).filter(models.Application.project_id.in_(project_ids)).order_by(models.Application.id.desc()).all()
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
    """عرض طلبات مشروع محدد - متاح فقط لصاحب المشروع أو المشرف الأكاديمي أو الأدمن"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"المشروع برقم {project_id} غير موجود"
        )

    is_owner = project.created_by == current_user.id
    is_supervisor_or_admin = (current_user.role or "").lower() in ["supervisor", "admin"]

    if not (is_owner or is_supervisor_or_admin):
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
        return "supervisor"
    if project and project.created_by == user.id and user_role in COMPANY_ROLES:
        return "owner"
    return None


@app.put("/applications/{id}/status", response_model=schemas.ApplicationResponse)
@app.put("/api/applications/{id}/status", response_model=schemas.ApplicationResponse)
def update_application_status(
    id: int,
    status_update: Optional[schemas.ApplicationStatusUpdate] = None,
    status_query: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """تحديث حالة الطلب عبر آلة حالات صريحة:
    - الشركة المالكة: ترشيح (company_accepted) أو رفض فقط، وعلى مشاريعها فقط
    - المشرف/الأدمن: اعتماد أكاديمي (academically_approved) أو رفض، مع فحص سعة المقاعد
    - الطالب: لا يغيّر حالة أي طلب
    """
    application = db.query(models.Application).filter(models.Application.id == id).first()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="طلب الانضمام غير موجود"
        )

    project = db.query(models.Project).filter(models.Project.id == application.project_id).first()
    actor = get_application_actor(project, current_user)
    if actor is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ليس لديك الصلاحية لتغيير حالة هذا الطلب، فقط الشركة المالكة للمشروع أو المشرف الأكاديمي"
        )

    requested = (status_update.status if status_update and status_update.status else status_query) or ""
    feedback_text = status_update.feedback.strip() if status_update and status_update.feedback else None
    if not requested.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="يرجى إرسال الحالة الجديدة للطلب"
        )

    # "accepted" يعني ترشيحاً عند الشركة واعتماداً أكاديمياً عند المشرف (للتوافق مع الواجهة الحالية)
    if actor == "owner" and requested.strip().lower() == "accepted":
        new_status = "company_accepted"
    else:
        new_status = normalize_application_status(requested)
    current_status = normalize_application_status(application.status)

    transitions = OWNER_TRANSITIONS if actor == "owner" else SUPERVISOR_TRANSITIONS
    if new_status == current_status:
        return format_application_item(application, db)
    if new_status not in transitions.get(current_status, set()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"انتقال غير مسموح من الحالة '{current_status}' إلى '{new_status}'"
        )

    if new_status == "academically_approved" and (not project or project.status != "approved"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="لا يمكن اعتماد الطلب أكاديمياً قبل اعتماد المشروع نفسه"
        )

    # فحص السعة عند أي انتقال يحجز مقعداً جديداً (للشركة والمشرف على حد سواء)
    if new_status in SEAT_STATUSES and current_status not in SEAT_STATUSES:
        current_accepted = get_project_accepted_members(application.project_id, db)
        max_cap = project.max_members if (project and project.max_members) else 4
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
    proj_title = project.title if project else "المشروع"
    feedback_note = f"ملاحظات: {feedback_text}" if feedback_text else ""

    if new_status == "company_accepted":
        create_notification(
            db=db,
            user_id=application.student_id,
            title="ترشيح صناعي من الشركة! 🌟",
            message=f"قامت الشركة باختيارك وترشيحك لمشروع: {proj_title}. الطلب الآن بانتظار الاعتماد الأكاديمي النهائي من المشرف.",
            link=f"/projects/{application.project_id}"
        )
        for sup in db.query(models.User).filter(models.User.role.in_(["supervisor", "admin"])).all():
            create_notification(
                db=db,
                user_id=sup.id,
                title="طلب اعتماد أكاديمي معلق ⏳",
                message=f"قامت الشركة بترشيح الطالب {student_name} لمشروع: {proj_title}. يرجى المراجعة والاعتماد الأكاديمي.",
                link="/supervisor"
            )
    elif new_status == "academically_approved":
        create_notification(
            db=db,
            user_id=application.student_id,
            title="تم الاعتماد الأكاديمي رسمياً! 🎓",
            message=f"اعتمد المشرف الأكاديمي {current_user.full_name} انضمامك لمشروع: {proj_title}. تم تفعيل مساحة العمل ومتابعة التقارير رسمياً!",
            link="/workspace"
        )
        if project and project.created_by and project.created_by != current_user.id:
            create_notification(
                db=db,
                user_id=project.created_by,
                title="تم الاعتماد الأكاديمي للمشروع",
                message=f"اعتمد المشرف الأكاديمي {current_user.full_name} مشروع: {proj_title} والطالب {student_name} رسمياً.",
                link=f"/projects/{project.id}"
            )
    elif new_status == "rejected" and actor == "owner":
        create_notification(
            db=db,
            user_id=application.student_id,
            title="تحديث حالة طلب الانضمام",
            message=f"نعتذر، لم يتم اختيار طلبك لمشروع: {proj_title}. {feedback_note}",
            link="/browse"
        )
    elif new_status == "rejected":
        create_notification(
            db=db,
            user_id=application.student_id,
            title="قرار المشرف الأكاديمي بخصوص المشروع",
            message=f"لم يتم الاعتماد الأكاديمي لطلبك في مشروع: {proj_title}. {feedback_note}",
            link="/browse"
        )
        if project and project.created_by and project.created_by != current_user.id:
            create_notification(
                db=db,
                user_id=project.created_by,
                title="قرار الاعتماد الأكاديمي",
                message=f"رفض المشرف الأكاديمي الاعتماد لمشروع: {proj_title}. {feedback_note}",
                link=f"/projects/{project.id}"
            )

    return format_application_item(application, db)


@app.put("/applications/{application_id}/status", response_model=schemas.ApplicationResponse, include_in_schema=False)
def update_application_status_alias(
    application_id: int,
    status_update: Optional[schemas.ApplicationStatusUpdate] = None,
    status_query: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return update_application_status(application_id, status_update, status_query, db, current_user)


# ==========================================
# مسارات الرسائل والشات التفاعلي (Project Messages)
# ==========================================

def check_project_access(project: models.Project, user: models.User, db: Session) -> bool:
    """الوصول لشات المشروع: الأدمن، مالك المشروع، المشرف المسند إليه، والأعضاء المعتمدون أكاديمياً فقط"""
    if (user.role or "").lower() == "admin":
        return True
    if project.created_by == user.id:
        return True
    if project.supervisor_id and project.supervisor_id == user.id:
        return True
    return is_approved_member(project.id, user.id, db)


@app.post("/projects/{project_id}/messages", response_model=schemas.MessageResponse, status_code=status.HTTP_201_CREATED)
def create_project_message(
    project_id: int,
    msg_in: schemas.MessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """إرسال رسالة جديدة في شات المشروع مع حماية الخصوصية ومنع الوصول غير المصرح به"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"المشروع برقم {project_id} غير موجود"
        )

    if not check_project_access(project, current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ليس لديك الصلاحية للدخول أو المشاركة في شات هذا المشروع"
        )

    text_content = msg_in.text.strip()
    if not text_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="لا يمكن إرسال رسالة فارغة"
        )

    new_msg = models.Message(
        project_id=project_id,
        sender_id=current_user.id,
        text=text_content
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)

    # توليد إشعار فوري لصاحب المشروع عند إرسال رسالة جديدة
    if project.created_by and project.created_by != current_user.id:
        create_notification(
            db=db,
            user_id=project.created_by,
            title="رسالة جديدة في شات المشروع",
            message=f"أرسل {current_user.full_name} رسالة في مشروع {project.title}: '{text_content[:60]}'",
            link=f"/projects/{project.id}"
        )

    return schemas.MessageResponse(
        id=new_msg.id,
        project_id=new_msg.project_id,
        sender_id=new_msg.sender_id,
        sender_name=current_user.full_name,
        sender_role=current_user.role,
        text=new_msg.text,
        created_at=new_msg.created_at
    )


@app.get("/projects/{project_id}/messages", response_model=List[schemas.MessageResponse])
def get_project_messages(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """جلب سجل رسائل شات مشروع محدد بالترتيب الزمني مع حماية الخصوصية"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"المشروع برقم {project_id} غير موجود"
        )

    if not check_project_access(project, current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ليس لديك الصلاحية لعرض شات هذا المشروع"
        )

    messages = db.query(models.Message).filter(
        models.Message.project_id == project_id
    ).order_by(models.Message.created_at.asc()).all()

    results = []
    for m in messages:
        sender_name = m.sender.full_name if m.sender else f"مستخدم #{m.sender_id}"
        sender_role = m.sender.role if m.sender else "user"
        results.append(schemas.MessageResponse(
            id=m.id,
            project_id=m.project_id,
            sender_id=m.sender_id,
            sender_name=sender_name,
            sender_role=sender_role,
            text=m.text,
            created_at=m.created_at
        ))
    return results


# ==========================================
# مسارات الإشعارات والتنبيهات (Notifications)
# ==========================================

@app.get("/notifications", response_model=List[schemas.NotificationResponse])
@app.get("/notifications/", response_model=List[schemas.NotificationResponse])
def get_user_notifications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """جلب إشعارات المستخدم الحالي مرتبة حسب الأحدث تنازلياً"""
    return db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).order_by(models.Notification.created_at.desc()).limit(50).all()


@app.put("/notifications/{id}/read", response_model=schemas.NotificationResponse)
def mark_notification_as_read(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """تحديد الإشعار كمقروء للمستخدم الحالي"""
    notif = db.query(models.Notification).filter(
        models.Notification.id == id,
        models.Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="الإشعار غير موجود"
        )
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif


@app.put("/notifications/read-all", status_code=status.HTTP_200_OK)
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """تحديد كافة إشعارات المستخدم كمقروءة"""
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return {"message": "تم تحديد جميع الإشعارات كمقروءة"}


# ==========================================
# مسارات مراحل التسليم والتقارير الأكاديمية (Reports & Deliverables)
# ==========================================

def format_report_item(r: models.Report, db: Session):
    """تنسيق وتزويد سجل التقرير ببيانات الطالب واسم المشروع الحقيقي"""
    if not r:
        return None
    if not getattr(r, "student_name", None):
        st = db.query(models.User).filter(models.User.id == r.student_id).first()
        r.student_name = st.full_name if st else f"طالب #{r.student_id}"
    if not getattr(r, "project_title", None):
        pj = db.query(models.Project).filter(models.Project.id == r.project_id).first()
        r.project_title = pj.title if pj else f"مشروع #{r.project_id}"
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
    """جلب قائمة التقارير ومراحل التسليم مع الفلترة بحسب المشروع أو الطالب أو الحالة"""
    user_role = (current_user.role or "").lower()
    query = db.query(models.Report)

    if user_role == "student":
        accepted_proj_ids = [
            a.project_id for a in db.query(models.Application.project_id).filter(
                models.Application.student_id == current_user.id,
                models.Application.status == "accepted"
            ).all()
        ]
        query = query.filter(
            (models.Report.student_id == current_user.id) | 
            (models.Report.project_id.in_(accepted_proj_ids))
        )
    elif user_role in ["partner", "company", "business"]:
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
    return [format_report_item(r, db) for r in reports]


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

    new_report = models.Report(
        project_id=report_in.project_id,
        student_id=current_user.id,
        title=report_in.title.strip(),
        description=report_in.description.strip() if report_in.description else None,
        file_url=report_in.file_url.strip() if report_in.file_url else None,
        deadline_date=report_in.deadline_date,
        status="pending"
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    target_user_id = project.supervisor_id or project.created_by
    if target_user_id:
        create_notification(
            db=db,
            user_id=target_user_id,
            title="تسليم تقرير جديد 📄",
            message=f"قام الطالب {current_user.full_name} برفع تقرير جديد '{new_report.title}' لمشروع '{project.title}'",
            link="/reports"
        )

    return format_report_item(new_report, db)


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
    create_notification(
        db=db,
        user_id=report.student_id,
        title=status_titles.get(st, "تحديث حالة التقرير"),
        message=f"تم تحديث حالة تقريرك '{report.title}' إلى {st}. ملاحظات: {report.supervisor_feedback or 'لا توجد ملاحظات'}",
        link="/reports"
    )

    return format_report_item(report, db)


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
            for s in skills_str.split(','):
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
