"""
Seed script for Capstone Market Platform - LOCAL DEVELOPMENT ONLY.
Inserts the default demo accounts (with well-known passwords) into the database.

It is never called by the API. Run it by hand:  python seed.py
It refuses to run when ENVIRONMENT=production/prod or RENDER=true.
"""
import os
import sys
import logging
from sqlalchemy.orm import Session

import models
import utils
from database import SessionLocal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed")

OFFICIAL_SUPERVISOR = {
    "full_name": "د. أسامة أمين مرعي",
    "email": "osama.merhi@capstone.ps",
    "password": "password123",
    "role": "supervisor",
    "skills": "نظم معلومات حاسوبية - كلية التكنولوجيا والعلوم التطبيقية"
}

OFFICIAL_SUPERVISOR_ALT = {
    "full_name": "د. أسامة أمين مرعي",
    "email": "omarie@qou.edu",
    "password": "Doctor@2025",
    "role": "supervisor",
    "skills": "نظم معلومات حاسوبية - كلية التكنولوجيا والعلوم التطبيقية"
}

DEFAULT_USERS = [
    OFFICIAL_SUPERVISOR,
    OFFICIAL_SUPERVISOR_ALT,
    {
        "full_name": "أحمد منصور",
        "email": "student@capstone.ps",
        "password": "pass1234",
        "role": "student",
        "skills": "React, Python, FastAPI, Tailwind CSS"
    },
    {
        "full_name": "شركة النور للحلول البرمجية",
        "email": "company@capstone.ps",
        "password": "pass1234",
        "role": "partner",
        "skills": "Software Development, Cloud, AI Solutions"
    }
]


def seed_user(db: Session, user_data: dict) -> models.User:
    """إدراج أو التحقق من حساب مستخدم بالاعتماد على البريد الإلكتروني دون حذف أو إعادة كتابة كلمات المرور للمستخدمين الحاليين"""
    email = user_data["email"].strip().lower()
    user = db.query(models.User).filter(models.User.email == email).first()

    if user:
        # الحساب موجود مسبقاً: نحافظ على كلمة المرور والبيانات الخاصة بالمستخدم دون أي حذف أو استبدال
        if not user.password_hash:
            user.password_hash = utils.hash_password(user_data["password"])
            db.commit()
            db.refresh(user)
        logger.info(f"Verified existing user: {email} ({user.full_name}) - credentials preserved")
    else:
        password_hash = utils.hash_password(user_data["password"])
        user = models.User(
            full_name=user_data["full_name"],
            email=email,
            password_hash=password_hash,
            role=user_data["role"],
            skills=user_data.get("skills", "")
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"Created new user: {email} ({user_data['full_name']})")

    return user


def is_production_environment() -> bool:
    return (
        os.getenv("RENDER", "").lower() == "true"
        or os.getenv("ENVIRONMENT", "").lower() in ("production", "prod")
    )


def seed_default_users(db: Session = None):
    """تهيئة الحسابات التجريبية للتطوير المحلي فقط - يرفض العمل في بيئة الإنتاج"""
    if is_production_environment():
        raise RuntimeError("seed.py is for local development only and refuses to run in production.")

    owns_session = False
    if db is None:
        db = SessionLocal()
        owns_session = True

    try:
        results = []
        for u in DEFAULT_USERS:
            results.append(seed_user(db, u))

        # في حال كانت قاعدة البيانات لا تحتوي على مشاريع، نقوم بتهيئة مشاريع حقيقية وربطها بالتقارير وقبول الطلب
        if db.query(models.Project).count() == 0:
            supervisor = db.query(models.User).filter(models.User.email == "osama.merhi@capstone.ps").first()
            company = db.query(models.User).filter(models.User.email == "company@capstone.ps").first()
            student = db.query(models.User).filter(models.User.email == "student@capstone.ps").first()

            if supervisor and company and student:
                proj1 = models.Project(
                    title="نظام إدارة المستودعات ونقاط البيع السحابي (POS)",
                    description="نظام متكامل لمتجر تجزئة لربط عمليات البيع بالمخزون وإصدار تنبيهات عند نفاد البضائع، مع تقارير أرباح يومية.",
                    required_skills="Python, SQL, FastAPI, React",
                    category="أنظمة المعلومات الحاسوبية (CIS)",
                    status="approved",
                    max_members=4,
                    company_name=company.full_name,
                    supervisor_id=supervisor.id,
                    supervisor_feedback="مشروع نوعي يربط متطلبات السوق بالتقنيات الحديثة، معتمد للتنفيذ.",
                    created_by=company.id
                )
                proj2 = models.Project(
                    title="بوابة تدقيق الثغرات واكتشاف الاختراقات للمتاجر الإلكترونية",
                    description="أداة فحص أمني لتقييم حماية بوابات الدفع الإلكتروني وتشفير بيانات بطاقات العملاء في المتاجر المحلية.",
                    required_skills="Cybersecurity, Python, Docker, Linux",
                    category="أمن المعلومات والأدلة الرقمية (Cybersecurity)",
                    status="approved",
                    max_members=3,
                    supervisor_id=supervisor.id,
                    supervisor_feedback="فكرة متميزة في أمن المعلومات، معتمدة.",
                    created_by=supervisor.id
                )
                db.add_all([proj1, proj2])
                db.commit()
                db.refresh(proj1)
                db.refresh(proj2)

                # إضافة طلب انضمام مقبول للطالب في المشروع الأول
                app1 = models.Application(
                    project_id=proj1.id,
                    student_id=student.id,
                    status="accepted",
                    message="طالب شغوف بتطوير الواجهات والنظم السحابية، أود قيادة الفريق البرمجي للمشروع."
                )
                db.add(app1)
                db.commit()

                # إضافة مراحل التسليم والتقارير الأكاديمية الفعلية في جدول reports
                rep1 = models.Report(
                    project_id=proj1.id,
                    student_id=student.id,
                    title="وثيقة مقترح المشروع وتحليل المشكلة (Project Proposal)",
                    description="شرح مفصل لمشكلة إدارة المخزون ونقاط البيع وأهداف المشروع وجدول العمل المقترح.",
                    status="approved",
                    grade="92/100",
                    supervisor_feedback="تم اعتماد المقترح الأكاديمي بنجاح. خطة العمل واضحة ومطابقة للمعايير.",
                    deadline_date="2026-10-15"
                )
                rep2 = models.Report(
                    project_id=proj1.id,
                    student_id=student.id,
                    title="وثيقة هندسة المتطلبات والنظام (SRS & Architecture Specification)",
                    description="مخططات UML وتصميم قاعدة البيانات والواجهات البرمجية RESTful API.",
                    status="pending",
                    supervisor_feedback="بانتظار استكمال مراجعة مخطط الكيانات والعلاقات (ERD) ومسارات التوثيق.",
                    deadline_date="2026-10-28"
                )
                rep3 = models.Report(
                    project_id=proj1.id,
                    student_id=student.id,
                    title="النموذج الأولي واختبار التوافق (Prototype & Deployment)",
                    description="النسخة التجريبية الأولى وربط لوحة التحكم بالسيرفر السحابي.",
                    status="pending",
                    supervisor_feedback="سيتم التقييم بعد تسليم كود الـ Frontend والـ API.",
                    deadline_date="2026-11-20"
                )
                db.add_all([rep1, rep2, rep3])
                db.commit()
                logger.info("Successfully initialized sample approved projects, application, and milestone reports in DB.")

        return results
    except Exception as e:
        db.rollback()
        logger.error(f"Error during seeding: {e}")
        raise
    finally:
        if owns_session:
            db.close()


if __name__ == "__main__":
    if is_production_environment():
        sys.exit("Refusing to seed: ENVIRONMENT=production or RENDER=true. seed.py is for local development only.")
    print("Seeding default accounts into database...")
    seed_default_users()
    print("Seeding completed successfully!")
