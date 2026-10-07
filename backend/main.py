from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import models
import schemas
import utils
from database import engine, get_db

# إنشاء الجداول تلقائياً إن لم تكن موجودة
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Capstone Platform API")

# تفعيل CORS بالكامل
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login", auto_error=False)

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if not token:
        return None
    try:
        user_id = utils.verify_access_token(token)
        if user_id is None:
            return None
        return db.query(models.User).filter(models.User.id == user_id).first()
    except Exception:
        return None

@app.get("/")
def home():
    return {"message": "Capstone Backend API is running successfully!"}

# 1. إنشاء مستخدم جديد
@app.post("/users/", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="البريد الإلكتروني مسجل مسبقاً لمستخدم آخر")
    
    hashed_pwd = utils.hash_password(user.password)
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
    return db.query(models.User).all()

# 3. إنشاء مشروع جديد
@app.post("/projects/", status_code=status.HTTP_201_CREATED)
def create_project(
    project_data: dict,
    db: Session = Depends(get_db)
):
    first_user = db.query(models.User).first()
    owner_id = first_user.id if first_user else 1

    db_project = models.Project(
        title=project_data.get("title", "مشروع جديد"),
        description=project_data.get("description", ""),
        required_skills=project_data.get("required_skills", ""),
        created_by=owner_id
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

# 4. جلب جميع المشاريع
@app.get("/projects/", response_model=List[schemas.ProjectResponse])
def get_projects(db: Session = Depends(get_db)):
    return db.query(models.Project).all()

# 5. تسجيل الدخول وتوليد رمز الوصول JWT
@app.post("/login", response_model=schemas.Token)
def login(user_credentials: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_credentials.username).first()
    
    if not user or not utils.verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="البريد الإلكتروني أو كلمة المرور غير صحيحة"
        )
    
    access_token = utils.create_access_token(
        data={"user_id": user.id, "email": user.email, "role": user.role}
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# 6. جلب تفاصيل مشروع محدد
@app.get("/projects/{id}", response_model=schemas.ProjectResponse)
def get_project(id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project with id {id} not found")
    return project

# 7. حذف مشروع
@app.delete("/projects/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(id: int, db: Session = Depends(get_db), current_user: Optional[models.User] = Depends(get_current_user)):
    project_query = db.query(models.Project).filter(models.Project.id == id)
    project = project_query.first()
    
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project with id {id} not found")
        
    project_query.delete(synchronize_session=False)
    db.commit()
    return None

# 8. تعديل مشروع
@app.put("/projects/{id}", response_model=schemas.ProjectResponse)
def update_project(
    id: int, 
    updated_project: schemas.ProjectCreate, 
    db: Session = Depends(get_db)
):
    project_query = db.query(models.Project).filter(models.Project.id == id)
    project = project_query.first()
    
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project with id {id} not found")
        
    project_query.update(updated_project.dict(), synchronize_session=False)
    db.commit()
    return project_query.first()

# --- مسارات التقديم على المشاريع (Applications) ---

# 9. تقديم طلب انضمام لمشروع
@app.post("/applications/", response_model=schemas.ApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply_to_project(
    application: schemas.ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user)
):
    project = db.query(models.Project).filter(models.Project.id == application.project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    student_id = current_user.id if current_user else 1

    new_app = models.Application(
        project_id=application.project_id,
        student_id=student_id,
        message=application.message
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return new_app

# 10. جلب جميع الطلبات (حل مشكلة 405 Method Not Allowed)
@app.get("/applications/", response_model=List[schemas.ApplicationResponse])
def get_all_applications(db: Session = Depends(get_db)):
    return db.query(models.Application).all()

# 11. عرض طلبات مشروع محدد
@app.get("/projects/{project_id}/applications", response_model=List[schemas.ApplicationResponse])
def get_project_applications(project_id: int, db: Session = Depends(get_db)):
    return db.query(models.Application).filter(models.Application.project_id == project_id).all()

# 12. تحديث حالة الطلب
@app.put("/applications/{application_id}/status", response_model=schemas.ApplicationResponse)
def update_application_status(
    application_id: int,
    status: str,
    db: Session = Depends(get_db)
):
    application = db.query(models.Application).filter(models.Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    if status not in ["accepted", "rejected", "pending"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")

    application.status = status
    db.commit()
    db.refresh(application)
    return application