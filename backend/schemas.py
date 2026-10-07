from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "student"

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str

    class Config:
        from_attributes = True
        # --- نماذج المشاريع ---
class ProjectCreate(BaseModel):
    title: str
    description: Optional[str] = None
    required_skills: Optional[str] = None
    created_by: Optional[int] = None

class ProjectResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    required_skills: Optional[str] = None
    created_by: Optional[int] = None

    class Config:
        from_attributes = True


# --- نماذج الطلبات ---
class ApplicationCreate(BaseModel):
    project_id: int
    message: Optional[str] = None


class ApplicationStatusUpdate(BaseModel):
    status: str


class ApplicationResponse(BaseModel):
    id: int
    project_id: int
    student_id: int
    status: str
    message: Optional[str] = None

    class Config:
        from_attributes = True
        # --- نماذج التوكن ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
class ProjectCreate(BaseModel):
        title: str
        description: str
        required_skills: str