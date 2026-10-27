from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, ConfigDict, Field, field_validator


# ==========================================
# نماذج المستخدمين (User Schemas)
# ==========================================

# الحدود القصوى تطابق أطوال أعمدة قاعدة البيانات حتى تُرفض المدخلات الطويلة بـ 422 بدلاً من خطأ 500
PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 128


class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr = Field(max_length=120)
    password: str = Field(min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH)
    role: Optional[str] = Field(default="student", max_length=20)

    @field_validator("full_name", mode="before")
    @classmethod
    def strip_full_name(cls, v):
        return v.strip() if isinstance(v, str) else v


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
    is_active: bool = True
    created_at: Optional[datetime] = None


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    role: str
    phone: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    skills: Optional[str] = ""
    major: Optional[str] = None
    bio: Optional[str] = None
    portfolio_url: Optional[str] = None
    course: Optional[str] = None
    university: Optional[str] = None
    has_cv: bool = False
    created_at: Optional[datetime] = None


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=50)
    website: Optional[str] = Field(default=None, max_length=255)
    industry: Optional[str] = Field(default=None, max_length=150)
    major: Optional[str] = Field(default=None, max_length=100)
    bio: Optional[str] = Field(default=None, max_length=5000)
    portfolio_url: Optional[str] = Field(default=None, max_length=255)
    course: Optional[str] = Field(default=None, max_length=100)
    university: Optional[str] = Field(default=None, max_length=150)
    skills: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("portfolio_url")
    @classmethod
    def check_portfolio_url(cls, v):
        if v is None or not v.strip():
            return v
        return _http_url_or_none(v)

    @field_validator("website")
    @classmethod
    def check_website(cls, v):
        if v is None or not v.strip():
            return v
        v = v.strip()
        if not v.lower().startswith(("http://", "https://")):
            raise ValueError("must be an http(s) URL")
        return v


class AdminUserCreate(BaseModel):
    """إنشاء حساب مشرف أكاديمي أو أدمن (للأدمن فقط)"""
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr = Field(max_length=120)
    password: str = Field(min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH)
    role: str = Field(max_length=20)

    @field_validator("full_name", mode="before")
    @classmethod
    def strip_full_name(cls, v):
        return v.strip() if isinstance(v, str) else v


class AdminUserUpdate(BaseModel):
    is_active: bool


class AdminPasswordReset(BaseModel):
    new_password: str = Field(min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH)


class UserSkillsUpdate(BaseModel):
    skills: str = Field(max_length=1000)


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(max_length=128)
    new_password: str = Field(min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH)


# ==========================================
# نماذج المشاريع (Project Schemas)
# ==========================================

MAX_MEMBERS_LIMIT = 10


class ProjectCreate(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    description: Optional[str] = Field(default="", max_length=10000)
    required_skills: Optional[str] = Field(default="", max_length=1000)
    max_members: Optional[int] = Field(default=4, ge=1, le=MAX_MEMBERS_LIMIT)
    category: Optional[str] = Field(default=None, max_length=100)
    stipend: Optional[str] = Field(default=None, max_length=100)
    # مقبول للتوافق مع الواجهة لكنه يُتجاهل: اسم الشركة يُشتق دائماً من حساب منشئ المشروع
    company_name: Optional[str] = Field(default=None, max_length=150)

    @field_validator("title", mode="before")
    @classmethod
    def strip_title(cls, v):
        return v.strip() if isinstance(v, str) else v


class ProjectOwnerUpdate(BaseModel):
    """ما يمكن لمالك المشروع تعديله. أي حقل آخر (supervisor_id، company_name، status...) يُرفض بـ 422"""
    model_config = ConfigDict(extra="forbid")

    title: Optional[str] = Field(default=None, min_length=1, max_length=150)
    description: Optional[str] = Field(default=None, max_length=10000)
    required_skills: Optional[str] = Field(default=None, max_length=1000)
    max_members: Optional[int] = Field(default=None, ge=1, le=MAX_MEMBERS_LIMIT)
    category: Optional[str] = Field(default=None, max_length=100)
    stipend: Optional[str] = Field(default=None, max_length=100)


class ProjectSupervisorUpdate(ProjectOwnerUpdate):
    """المشرف والأدمن: حقول المالك + إسناد المشرف والملاحظات الأكاديمية"""
    supervisor_id: Optional[int] = None
    supervisor_feedback: Optional[str] = Field(default=None, max_length=5000)


class ProjectStatusUpdate(BaseModel):
    status: str = Field(max_length=30)  # approved, rejected, pending
    feedback: Optional[str] = Field(default=None, max_length=5000)


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
    message: Optional[str] = Field(default=None, max_length=2000)


class ApplicationStatusUpdate(BaseModel):
    status: str = Field(max_length=30)
    feedback: Optional[str] = Field(default=None, max_length=2000)


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
    student_has_cv: bool = False
    project_title: Optional[str] = None
    company_name: Optional[str] = None


# ==========================================
# نماذج مراحل التسليم والتقارير الأكاديمية (Report / Deliverable Schemas)
# ==========================================

def _http_url_or_none(v):
    """روابط خارجية بصيغة http/https فقط (تُعرض كروابط قابلة للنقر في الواجهة)"""
    if v is None:
        return None
    v = v.strip()
    if not v:
        return None
    if not (v.lower().startswith("http://") or v.lower().startswith("https://")):
        raise ValueError("must be an http(s) URL")
    return v


class ReportCreate(BaseModel):
    project_id: int
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=10000)
    file_url: Optional[str] = Field(default=None, max_length=255)
    file_key: Optional[str] = Field(default=None, max_length=255)
    deadline_date: Optional[str] = Field(default=None, max_length=50)

    @field_validator("title", mode="before")
    @classmethod
    def strip_title(cls, v):
        return v.strip() if isinstance(v, str) else v

    @field_validator("file_url")
    @classmethod
    def check_file_url(cls, v):
        return _http_url_or_none(v)


class ReportStatusUpdate(BaseModel):
    status: str = Field(max_length=30)  # pending, approved, needs_changes
    supervisor_feedback: Optional[str] = Field(default=None, max_length=5000)
    grade: Optional[str] = Field(default=None, max_length=50)


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
    has_file: bool = False
    can_review: bool = False
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
    text: str = Field(max_length=5000)


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
    project_id: Optional[int] = None
    is_read: bool = False
    created_at: Optional[datetime] = None