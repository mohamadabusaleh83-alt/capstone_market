from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP, Boolean, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # student, supervisor, partner, admin
    skills = Column(String, default="")
    phone = Column(String(50), nullable=True)
    # بيانات ملف الشركة (I-22)
    website = Column(String(255), nullable=True)
    industry = Column(String(150), nullable=True)
    # يزداد عند تسجيل الخروج أو تغيير كلمة المرور فيُبطل كل التوكنات السابقة (I-19)
    token_version = Column(Integer, nullable=False, default=0, server_default="0")
    # الحسابات المعطلة لا تستطيع الدخول وتُرفض توكناتها (I-47)
    is_active = Column(Boolean, nullable=False, default=True, server_default="true")
    created_at = Column(TIMESTAMP, server_default=func.now())

    profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="creator", foreign_keys="Project.created_by")
    messages = relationship("Message", back_populates="sender")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="student", cascade="all, delete-orphan")

    @property
    def hashed_password(self):
        return self.password_hash

    @hashed_password.setter
    def hashed_password(self, value):
        self.password_hash = value


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    major = Column(String(100), nullable=True)
    skills = Column(Text, nullable=True)
    interests = Column(Text, nullable=True)
    bio = Column(Text, nullable=True)
    portfolio_url = Column(String(255), nullable=True)
    course = Column(String(100), nullable=True)
    university = Column(String(150), nullable=True)
    # مفتاح ملف السيرة الذاتية في التخزين الخاص (لا رابط عام)
    cv_key = Column(String(255), nullable=True)

    user = relationship("User", back_populates="profile")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text)
    required_skills = Column(Text)
    status = Column(String, default="pending")  # pending, approved, rejected
    max_members = Column(Integer, default=4)
    category = Column(String(100), nullable=True)
    stipend = Column(String(100), nullable=True)
    company_name = Column(String(150), nullable=True)
    supervisor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    supervisor_feedback = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    created_at = Column(TIMESTAMP, server_default=func.now())

    creator = relationship("User", back_populates="projects", foreign_keys=[created_by])
    supervisor = relationship("User", foreign_keys=[supervisor_id])
    applications = relationship("Application", back_populates="project", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="project", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="project", cascade="all, delete-orphan")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    file_url = Column(String(255), nullable=True)
    # ملف التقرير المرفوع في التخزين الخاص (يُنزّل عبر رابط موقّع)
    file_key = Column(String(255), nullable=True)
    status = Column(String(30), default="pending")  # pending, approved, needs_changes
    supervisor_feedback = Column(Text, nullable=True)
    grade = Column(String(50), nullable=True)
    deadline_date = Column(String(50), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    project = relationship("Project", back_populates="reports")
    student = relationship("User", back_populates="reports")


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (
        UniqueConstraint("project_id", "student_id", name="uq_project_student_application"),
    )

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="applied")  # applied, pending, company_accepted, academically_approved, accepted, rejected
    message = Column(String, nullable=True)
    feedback = Column(String, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    project = relationship("Project", back_populates="applications")
    student = relationship("User")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    project = relationship("Project", back_populates="messages")
    sender = relationship("User", back_populates="messages")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    link = Column(String(255), nullable=True)
    # النسخة الإنجليزية (I-28) والمشروع المرتبط لحذف الإشعارات مع المشروع (I-48)
    title_en = Column(String(200), nullable=True)
    message_en = Column(Text, nullable=True)
    project_id = Column(Integer, nullable=True, index=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    user = relationship("User", back_populates="notifications")