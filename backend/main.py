import os
import logging
from typing import List, Optional
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException, Query, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import text

import models
import schemas
import utils
from database import engine, get_db, SessionLocal
from seed import seed_default_users

logger = logging.getLogger("capstone_api")

# إنشاء الجداول تلقائياً إن لم تكن موجودة مسبقاً
models.Base.metadata.create_all(bind=engine)

# التحقق من وجود الأعمدة والقيود الحديثة في قاعدة البيانات (PostgreSQL/SQLite) دون تعطيل التشغيل
with engine.connect() as conn:
    for stmt in [
        "ALTER TABLE projects ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'pending'",
        "ALTER TABLE projects ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 4",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS skills TEXT DEFAULT ''",
        "ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS bio TEXT",
        "ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS portfolio_url VARCHAR(255)",
        "ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS course VARCHAR(100)",
        "ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS university VARCHAR(150)",
        "ALTER TABLE applications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_project_student_app ON applications (project_id, student_id)",
    ]:
        try:
            conn.execute(text(stmt))
            conn.commit()
        except Exception as e:
            logger.debug(f"DB check ({stmt}): {e}")

# ضمان تهيئة حساب المشرف الأكاديمي الرسمي والحسابات الأساسية في قاعدة البيانات
try:
    with SessionLocal() as db:
        seed_default_users(db)
except Exception as e:
    logger.warning(f"Error seeding default accounts on startup: {e}")

app = FastAPI(
    title="Capstone Platform API",
    description="واجهة برمجة التطبيقات لمنصة مشاريع التخرج (Capstone Market)",
    version="1.1.0"
)

# إعداد CORS للنطاقات المصرح لها
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
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# معالج عام لأي خطأ غير متوقع لضمان عودة الاستجابة بترويسات CORS دائماً
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin")
    headers = {}
    if origin:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        headers["Access-Control-Allow-Methods"] = "*"
        headers["Access-Control-Allow-Headers"] = "*"
    logger.error(f"Global unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"خطأ داخلي في الخادم: {str(exc)}"},
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


def get_project_accepted_members(project_id: int, db: Session) -> int:
    """حساب عدد المقاعد المشغولة حالياً (الطلبات المقبولة) لمشروع محدد"""
    return db.query(models.Application).filter(
        models.Application.project_id == project_id,
        models.Application.status == "accepted"
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
    except Exception as e:
        logger.error(f"Error in login: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"حدث خطأ أثناء تسجيل الدخول: {str(e)}"
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
    except Exception as e:
        db.rollback()
        logger.error(f"Error in create_user: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"حدث خطأ أثناء إنشاء المستخدم: {str(e)}"
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
def get_my_profile(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """جلب بيانات الملف الشخصي والأكاديمي والمهارات للمستخدم الحالي"""
    return get_user_profile_response(current_user, db)


@app.put("/users/me/profile", response_model=schemas.UserProfileResponse)
@app.put("/profile", response_model=schemas.UserProfileResponse)
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


@app.get("/users/", response_model=List[schemas.UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["supervisor", "admin"]))
):
    """جلب قائمة المستخدمين (محمي للمشرفين والمسؤولين فقط)"""
    return db.query(models.User).all()


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


@app.post("/projects/", response_model=schemas.ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["partner", "company", "business", "supervisor", "student"]))
):
    """طرح مشروع جديد بواسطة الشريك الصناعي أو المشرف، وتسجيل current_user.id كمالك للمشروع وتطهير المهارات"""
    user_role = (current_user.role or "").lower()
    # مشاريع المشرفين أو الإدارة تعتمد تلقائياً، بينما مشاريع الشركات تحتاج اعتماد المشرف
    initial_status = "approved" if user_role in ["supervisor", "admin"] else "pending"
    sanitized_skills = clean_skills(project.required_skills)

    db_project = models.Project(
        title=project.title,
        description=project.description,
        required_skills=sanitized_skills,
        status=initial_status,
        max_members=project.max_members or 4,
        created_by=current_user.id
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    # ربط عدد الأعضاء الحاليين والمقاعد المتاحة للرد
    db_project.current_members = 0
    db_project.available_seats = db_project.max_members or 4
    return db_project


@app.get("/projects/", response_model=List[schemas.ProjectResponse])
def get_projects(
    status: Optional[str] = None,
    created_by: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """جلب المشاريع المتاحة في المنصة مع التحديث الديناميكي للمقاعد المحجوزة والمتاحة ودعم الفلترة بمالك المشروع"""
    query = db.query(models.Project)
    if status:
        query = query.filter(models.Project.status == status.strip().lower())
    if created_by:
        query = query.filter(models.Project.created_by == created_by)
    projects = query.order_by(models.Project.id.desc()).all()

    results = []
    for p in projects:
        p.current_members = get_project_accepted_members(p.id, db)
        p.available_seats = max(0, (p.max_members or 4) - p.current_members)
        results.append(p)
    return results


@app.get("/projects/{id}", response_model=schemas.ProjectResponse)
def get_project(id: int, db: Session = Depends(get_db)):
    """جلب تفاصيل مشروع محدد بواسطة معرّفه مع عدد المقاعد المحجوزة والمتاحة"""
    project = db.query(models.Project).filter(models.Project.id == id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"المشروع برقم {id} غير موجود"
        )
    project.current_members = get_project_accepted_members(project.id, db)
    project.available_seats = max(0, (project.max_members or 4) - project.current_members)
    return project


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

    new_status = None
    if status_update and status_update.status:
        new_status = status_update.status.strip().lower()
    elif status_query:
        new_status = status_query.strip().lower()
    else:
        new_status = "approved"

    if new_status not in ["approved", "rejected", "pending"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="الحالة غير صالحة. الحالات المسموحة: approved, rejected, pending"
        )

    project.status = new_status
    db.commit()
    db.refresh(project)
    project.current_members = get_project_accepted_members(project.id, db)
    project.available_seats = max(0, (project.max_members or 4) - project.current_members)
    return project


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

@app.post("/applications/", response_model=schemas.ApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply_to_project(
    application: schemas.ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["student"]))
):
    """تقديم طلب انضمام لمشروع بواسطة الطالب الحالي مع فحص المقاعد ومنع التقديم المتكرر"""
    project = db.query(models.Project).filter(models.Project.id == application.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="المشروع المطلوب غير موجود"
        )

    # التحقق من أن المشروع معتمد
    if project.status == "rejected":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="لا يمكن التقديم على مشروع تم رفضه من قبل المشرف الأكاديمي"
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
        status="pending",
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

    return new_app


@app.get("/applications/", response_model=List[schemas.ApplicationResponse])
def get_all_applications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """جلب الطلبات حسب الصلاحية: المشرف والأدمن يريان كل الطلبات، الشركة ترى طلبات مشاريعها، والطالب يرى طلباته الخاصة"""
    user_role = (current_user.role or "").lower()

    if user_role in ["supervisor", "admin"]:
        return db.query(models.Application).order_by(models.Application.id.desc()).all()

    if user_role in ["partner", "company", "business"]:
        user_projects = db.query(models.Project.id).filter(models.Project.created_by == current_user.id).all()
        project_ids = [p[0] for p in user_projects]
        return db.query(models.Application).filter(models.Application.project_id.in_(project_ids)).order_by(models.Application.id.desc()).all()

    return db.query(models.Application).filter(models.Application.student_id == current_user.id).order_by(models.Application.id.desc()).all()


@app.get("/projects/{project_id}/applications", response_model=List[schemas.ApplicationResponse])
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

    return db.query(models.Application).filter(models.Application.project_id == project_id).order_by(models.Application.id.desc()).all()


@app.put("/applications/{id}/status", response_model=schemas.ApplicationResponse)
def update_application_status(
    id: int,
    status_update: Optional[schemas.ApplicationStatusUpdate] = None,
    status_query: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """تحديث حالة الطلب (قبول/رفض) من الشركة أو المشرف مع حماية سعة المقاعد (PUT /applications/{id}/status)"""
    application = db.query(models.Application).filter(models.Application.id == id).first()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="طلب الانضمام غير موجود"
        )

    project = db.query(models.Project).filter(models.Project.id == application.project_id).first()
    is_owner = project and project.created_by == current_user.id
    is_supervisor_or_admin = (current_user.role or "").lower() in ["supervisor", "admin"]

    if not (is_owner or is_supervisor_or_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ليس لديك الصلاحية لتغيير حالة هذا الطلب، فقط مالك المشروع أو المشرف يمكنه ذلك"
        )

    new_status = None
    if status_update and status_update.status:
        new_status = status_update.status.strip().lower()
    elif status_query:
        new_status = status_query.strip().lower()

    if not new_status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="يرجى إرسال الحالة الجديدة للطلب"
        )

    if new_status not in ["accepted", "rejected", "pending"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="الحالة غير صالحة. الحالات المقبولة هي: accepted, rejected, pending"
        )

    # التحقق من سعة المقاعد عند القبول وخصم مقعد متاح
    if new_status == "accepted" and application.status != "accepted":
        current_accepted = get_project_accepted_members(application.project_id, db)
        max_cap = project.max_members if (project and project.max_members) else 4
        if current_accepted >= max_cap:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"لا يمكن قبول الطلب، المقاعد مكتملة للمشروع ({current_accepted}/{max_cap})"
            )

    application.status = new_status
    db.commit()
    db.refresh(application)

    # توليد إشعار فوري للطالب بالنتيجة
    action_text = "قبول" if new_status == "accepted" else ("رفض" if new_status == "rejected" else "تحديث")
    status_title = "تم قبول طلب انضمامك! 🎉" if new_status == "accepted" else ("تم رفض طلب انضمامك" if new_status == "rejected" else "تحديث حالة الطلب")
    create_notification(
        db=db,
        user_id=application.student_id,
        title=status_title,
        message=f"تم {action_text} طلب انضمامك لمشروع: {project.title if project else ''}",
        link=f"/projects/{application.project_id}"
    )

    return application


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
    """التحقق من أحقية المستخدم في الوصول لشات المشروع (المالك، المشرف، أو طالب لديه طلب بالمشروع)"""
    user_role = (user.role or "").lower()
    if user_role in ["supervisor", "admin"]:
        return True
    if project.created_by == user.id:
        return True
    app = db.query(models.Application).filter(
        models.Application.project_id == project.id,
        models.Application.student_id == user.id
    ).first()
    if app:
        return True
    return False


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