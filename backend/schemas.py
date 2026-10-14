from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict


# ==========================================
# نماذج المستخدمين (User Schemas)
# ==========================================

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: Optional[str] = "student"


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    role: str
    skills: Optional[str] = ""
    created_at: Optional[datetime] = None


# ==========================================
# نماذج المشاريع (Project Schemas)
# ==========================================

class ProjectCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    required_skills: Optional[str] = ""


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[str] = None


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: Optional[str] = None
    required_skills: Optional[str] = None
    created_by: Optional[int] = None
    created_at: Optional[datetime] = None


# ==========================================
# نماذج طلبات الانضمام (Application Schemas)
# ==========================================

class ApplicationCreate(BaseModel):
    project_id: int
    message: Optional[str] = None


class ApplicationStatusUpdate(BaseModel):
    status: str


class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    student_id: int
    status: str
    message: Optional[str] = None


# ==========================================
# نماذج التوثيق والتوكن (Auth & Token Schemas)
# ==========================================

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None