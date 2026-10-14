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
    max_members: Optional[int] = 4


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[str] = None
    max_members: Optional[int] = None


class ProjectStatusUpdate(BaseModel):
    status: str  # approved, rejected, pending


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: Optional[str] = None
    required_skills: Optional[str] = None
    status: Optional[str] = "pending"
    max_members: Optional[int] = 4
    current_members: Optional[int] = 0
    available_seats: Optional[int] = 4
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
# نماذج الرسائل والشات (Message Schemas)
# ==========================================

class MessageCreate(BaseModel):
    text: str


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    sender_id: int
    sender_name: Optional[str] = None
    sender_role: Optional[str] = None
    text: str
    created_at: Optional[datetime] = None


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


# ==========================================
# نماذج الإشعارات والتنبيهات (Notification Schemas)
# ==========================================

class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool = False
    created_at: Optional[datetime] = None