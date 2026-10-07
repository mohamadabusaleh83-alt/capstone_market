from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import models
import schemas
import utils
from database import engine, get_db

# إنشاء الجداول تلقائياً إن لم تكن موجودة
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Capstone Platform API")

# تفعيل CORS للسماح بجميع الأصول (مطلوب للربط مع الفرونت إند على Vercel أو محلياً)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    user_id = utils.verify_access_token(token)
    if user_id is None:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

@app.get("/")
def home():
    return {"message": "Capstone Backend API is running successfully!"}

# 1. إنشاء مستخدم جديد
@app.post("/users/", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # 1. التأكد أن الإيميل غير مستخدم مسبقاً
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 2. تشفير كلمة المرور قبل حفظها
    hashed_pwd = utils.hash_password(user.password)

    # 3. حفظ المستخدم بالكلمة المشفرة
    new_user = models.User(
        full_name=user.full_name,
        email=user.email,
        password_hash=hashed_pwd,
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# 2. جلب جميع المستخدمين
@app.get("/users/", response_model=List[schemas.UserResponse])
def get_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return users

# 3. إنشاء مشروع جديد (محمي بالتوكن)
@app.post("/projects/", response_model=schemas.ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project: schemas.ProjectCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    # ربط المشروع بصاحب التوكن تلقائياً
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

# 4. جلب جميع المشاريع
@app.get("/projects/", response_model=List[schemas.ProjectResponse])
def get_projects(db: Session = Depends(get_db)):
    projects = db.query(models.Project).all()
    return projects 

# تسجيل الدخول وتوليد رمز الوصول JWT
@app.post("/login", response_model=schemas.Token)
def login(user_credentials: OAuth2PasswordRequestForm = Depends(OAuth2PasswordRequestForm), db: Session = Depends(get_db)):
    # Swagger يرسل الإيميل داخل حقل اسمه username
    user = db.query(models.User).filter(models.User.email == user_credentials.username).first()
    
    if not user or not utils.verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    access_token = utils.create_access_token(
        data={"user_id": user.id, "email": user.email, "role": user.role}
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# 1. جلب تفاصيل مشروع محدد
@app.get("/projects/{id}", response_model=schemas.ProjectResponse)
def get_project(id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project with id {id} not found")
    return project

# 2. حذف مشروع (فقط المالك يمكنه الحذف)
@app.delete("/projects/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project_query = db.query(models.Project).filter(models.Project.id == id)
    project = project_query.first()
    
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project with id {id} not found")
    
    # التحقق من أن المستخدم الحالي هو من أنشأ المشروع
    if project.created_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to perform requested action")
        
    project_query.delete(synchronize_session=False)
    db.commit()
    return None
    
@app.put("/projects/{id}", response_model=schemas.ProjectResponse)
def update_project(
    id: int, 
    updated_project: schemas.ProjectCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    project_query = db.query(models.Project).filter(models.Project.id == id)
    project = project_query.first()
    
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project with id {id} not found")
    
    # التحقق من الملكية
    if project.created_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to perform requested action")
        
    project_query.update(updated_project.dict(), synchronize_session=False)
    db.commit()
    return project_query.first()

# --- مسارات التقديم على المشاريع (Applications) ---

# 1. تقديم طلب انضمام لمشروع (طالب يقدّم على مشروع)
@app.post("/applications/", response_model=schemas.ApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply_to_project(
    application: schemas.ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # التأكد من وجود المشروع
    project = db.query(models.Project).filter(models.Project.id == application.project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    # منع صاحب المشروع من التقديم على مشروعه
    if project.created_by == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot apply to your own project")

    # منع التقديم المتكرر على نفس المشروع
    existing_app = db.query(models.Application).filter(
        models.Application.project_id == application.project_id,
        models.Application.student_id == current_user.id
    ).first()
    if existing_app:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You have already applied to this project")

    new_app = models.Application(
        project_id=application.project_id,
        student_id=current_user.id,
        message=application.message
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return new_app

# 2. عرض جميع الطلبات المقدمة على مشروع محدد (خاص بمالك المشروع)
@app.get("/projects/{project_id}/applications", response_model=List[schemas.ApplicationResponse])
def get_project_applications(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    # التحقق من أن المستخدم هو من أنشأ المشروع
    if project.created_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view applications for this project")

    applications = db.query(models.Application).filter(models.Application.project_id == project_id).all()
    return applications

# 3. تحديث حالة الطلب (قبول أو رفض الطلب - خاص بمالك المشروع)
@app.put("/applications/{application_id}/status", response_model=schemas.ApplicationResponse)
def update_application_status(
    application_id: int,
    status_update: schemas.ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    application = db.query(models.Application).filter(models.Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    # التحقق من أن المستخدم يملك المشروع التابع له هذا الطلب
    project = db.query(models.Project).filter(models.Project.id == application.project_id).first()
    if project.created_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this application")

    if status_update.status not in ["accepted", "rejected"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Status must be 'accepted' or 'rejected'")

    application.status = status_update.status
    db.commit()
    db.refresh(application)
    return application