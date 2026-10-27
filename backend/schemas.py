from datetime import datetime
from typing import List, Optional
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
    phone: Optional[str] = None
    major: Optional[str] = None
    bio: Optional[str] = None
    portfolio_url: Optional[str] = None
    course: Optional[str] = None
    university: Optional[str] = None
    created_at: Optional[datetime] = None


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    role: str
    phone: Optional[str] = None
    skills: Optional[str] = ""
    major: Optional[str] = None
    bio: Optional[str] = None
    portfolio_url: Optional[str] = None
    course: Optional[str] = None
    university: Optional[str] = None
    created_at: Optional[datetime] = None


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    major: Optional[str] = None
    bio: Optional[str] = None
    portfolio_url: Optional[str] = None
    course: Optional[str] = None
    university: Optional[str] = None
    skills: Optional[str] = None


class UserSkillsUpdate(BaseModel):
    skills: str


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


# ==========================================
# نماذج المشاريع (Project Schemas)
# ==========================================

class ProjectCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    required_skills: Optional[str] = ""
    max_members: Optional[int] = 4
    category: Optional[str] = None
    stipend: Optional[str] = None
    company_name: Optional[str] = None


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[str] = None
    max_members: Optional[int] = None
    category: Optional[str] = None
    stipend: Optional[str] = None
    company_name: Optional[str] = None
    supervisor_id: Optional[int] = None
    supervisor_feedback: Optional[str] = None


class ProjectStatusUpdate(BaseModel):
    status: str  # approved, rejected, pending
    feedback: Optional[str] = None


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
    category: Optional[str] = None
    stipend: Optional[str] = None
    company_name: Optional[str] = None
    supervisor_id: Optional[int] = None
    supervisor_name: Optional[str] = None
    supervisor_feedback: Optional[str] = None


# ==========================================
# نماذج طلبات الانضمام (Application Schemas)
# ==========================================

class ApplicationCreate(BaseModel):
    project_id: int
    message: Optional[str] = None


class ApplicationStatusUpdate(BaseModel):
    status: str
    feedback: Optional[str] = None


class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    student_id: int
    status: str
    message: Optional[str] = None
    feedback: Optional[str] = None
    created_at: Optional[datetime] = None
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    student_major: Optional[str] = None
    student_skills: Optional[str] = None
    student_bio: Optional[str] = None
    student_portfolio_url: Optional[str] = None
    project_title: Optional[str] = None
    company_name: Optional[str] = None


# ==========================================
# نماذج مراحل التسليم والتقارير الأكاديمية (Report / Deliverable Schemas)
# ==========================================

class ReportCreate(BaseModel):
    project_id: int
    title: str
    description: Optional[str] = None
    file_url: Optional[str] = None
    deadline_date: Optional[str] = None


class ReportStatusUpdate(BaseModel):
    status: str  # pending, approved, needs_changes
    supervisor_feedback: Optional[str] = None
    grade: Optional[str] = None


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    student_id: int
    student_name: Optional[str] = None
    project_title: Optional[str] = None
    title: str
    description: Optional[str] = None
    file_url: Optional[str] = None
    status: str
    supervisor_feedback: Optional[str] = None
    grade: Optional[str] = None
    deadline_date: Optional[str] = None
    created_at: Optional[datetime] = None


# ==========================================
# نماذج إحصائيات المنصة الحية (Analytics Schemas)
# ==========================================

class TopSkillItem(BaseModel):
    name: str
    count: int
    percent: int


class AnalyticsOverviewResponse(BaseModel):
    total_projects: int
    approved_projects: int
    pending_projects: int
    total_students: int
    total_companies: int
    total_supervisors: int
    total_applications: int
    total_reports: int
    pending_reports: int
    approved_reports: int
    top_skills: List[TopSkillItem]


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