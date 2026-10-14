import os
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

import models
import schemas
import utils
from database import engine, get_db

# إنشاء الجداول تلقائياً إن لم تكن موجودة مسبقاً
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Capstone Platform API",
    description="واجهة برمجة التطبيقات لمنصة مشاريع التخرج (Capstone Market)",
    version="1.0.0"
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


# ==========================================
# المسار الترحيبي (Root)
# ==========================================

@app.get("/")
def home():
    return {"message": "Capstone Backend API is running successfully!"}


# ==========================================
# مسارات التوثيق والمستخدمين (Auth & Users)
# ==========================================

@app.post("/login", response_model=schemas.Token)
def login(
    user_credentials: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    """تسجيل الدخول وتوليد رمز الوصول JWT"""
    user = db.query(models.User).filter(models.User.email == user_credentials.username).first()

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


@app.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    """التحقق من هوية المستخدم الحالية وصلاحياته من الـ JWT Token"""
    return current_user


@app.post("/users/", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """إنشاء حساب مستخدم جديد مع معالجة آمنة للأخطاء لمنع أخطاء 500"""
    try:
        db_user = db.query(models.User).filter(models.User.email == user.email).first()
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="البريد الإلكتروني مسجل مسبقاً لمستخدم آخر"
            )

        hashed_pwd = utils.hash_password(user.password)
        new_user = models.User(
            full_name=user.full_name,
            email=user.email,
            password_hash=hashed_pwd,
            role=user.role.lower() if user.role else "student"
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"حدث خطأ أثناء إنشاء المستخدم: {str(e)}"
        )


@app.get("/users/", response_model=List[schemas.UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["supervisor", "admin"]))
):
    """جلب قائمة المستخدمين (محمي للمشرفين والمسؤولين فقط)"""
    return db.query(models.User).all()


# ==========================================
# مسارات المشاريع (Projects)
# ==========================================

@app.post("/projects/", response_model=schemas.ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["partner", "company", "business", "supervisor"]))
):
    """طرح مشروع جديد بواسطة الشريك الصناعي أو المشرف، وتسجيل current_user.id كمالك للمشروع"""
    db_project = models.Project(
        title=project.title,
        description=project.description,
        required_skills=project.required_skills,
        created_by=current_user.id
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


@app.get("/projects/", response_model=List[schemas.ProjectResponse])
def get_projects(db: Session = Depends(get_db)):
    """جلب جميع المشاريع المتاحة في المنصة"""
    return db.query(models.Project).all()


@app.get("/projects/{id}", response_model=schemas.ProjectResponse)
def get_project(id: int, db: Session = Depends(get_db)):
    """جلب تفاصيل مشروع محدد بواسطة معرّفه"""
    project = db.query(models.Project).filter(models.Project.id == id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"المشروع برقم {id} غير موجود"
        )
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

    # حذف الطلبات المرتبطة بالمشروع أولاً لتفادي تعارض المفاتيح الخارجية
    db.query(models.Application).filter(models.Application.project_id == id).delete(synchronize_session=False)
    db.query(models.Project).filter(models.Project.id == id).delete(synchronize_session=False)
    db.commit()
    return None


# ==========================================
# مسارات التقديم على المشاريع (Applications)
# ==========================================

@app.post("/applications/", response_model=schemas.ApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply_to_project(
    application: schemas.ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["student"]))
):
    """تقديم طلب انضمام لمشروع بواسطة الطالب الحالي مع منع التقديم المتكرر"""
    project = db.query(models.Project).filter(models.Project.id == application.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="المشروع المطلوب غير موجود"
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
    return new_app


@app.get("/applications/", response_model=List[schemas.ApplicationResponse])
def get_all_applications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """جلب الطلبات حسب الصلاحية: المشرف والأدمن يريان كل الطلبات، الشركة ترى طلبات مشاريعها، والطالب يرى طلباته الخاصة"""
    user_role = (current_user.role or "").lower()

    if user_role in ["supervisor", "admin"]:
        return db.query(models.Application).all()

    if user_role in ["partner", "company", "business"]:
        user_projects = db.query(models.Project.id).filter(models.Project.created_by == current_user.id).all()
        project_ids = [p[0] for p in user_projects]
        return db.query(models.Application).filter(models.Application.project_id.in_(project_ids)).all()

    return db.query(models.Application).filter(models.Application.student_id == current_user.id).all()


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

    return db.query(models.Application).filter(models.Application.project_id == project_id).all()


@app.put("/applications/{application_id}/status", response_model=schemas.ApplicationResponse)
def update_application_status(
    application_id: int,
    status_update: Optional[schemas.ApplicationStatusUpdate] = None,
    status_query: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """تحديث حالة الطلب (قبول/رفض) - حل تعارض status مع حصر الصلاحية لمالك المشروع أو المشرف"""
    application = db.query(models.Application).filter(models.Application.id == application_id).first()
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

    application.status = new_status
    db.commit()
    db.refresh(application)
    return application