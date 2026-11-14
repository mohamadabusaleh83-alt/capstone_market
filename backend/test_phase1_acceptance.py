"""
End-to-End Acceptance Verification Suite for Phase 1.
Covers Workflows 1 through 10:
1. Company creates project without technical skills or seat counts.
2. Project saved correctly as 'pending' for academic review.
3. Academic supervisor receives notification.
4. Only authorized supervisor can approve/reject and determine seats.
5. Company cannot control seat counts via direct API requests (403 Forbidden).
6. After approval, project becomes eligible for student recommendations.
7. Two students with different skills receive personalized recommendations.
8. Changing student skills dynamically updates recommendation scores.
9. Consistency of matched skills, missing skills, score breakdown, and explanations.
10. Pending and rejected projects never appear in recommendations.
"""

import os
import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import models
import schemas
import utils
import ai_matcher
from main import (
    create_project,
    update_project,
    update_project_seats,
    update_project_status,
    get_recommended_projects,
    apply_to_project
)


# قاعدة بيانات SQLite مؤقتة ومعزولة تماماً في دليل النظام المؤقت
TEMP_DB_PATH = os.path.join(os.environ.get("TEMP", "."), "acceptance_e2e_db.db").replace("\\", "/")
TEST_DATABASE_URL = f"sqlite:///{TEMP_DB_PATH}"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    models.Base.metadata.drop_all(bind=engine)
    models.Base.metadata.create_all(bind=engine)
    yield
    models.Base.metadata.drop_all(bind=engine)


def test_e2e_phase1_acceptance_workflows():
    db = TestingSessionLocal()

    # ==========================================
    # إعداد الحسابات المعزولة للاختبار
    # ==========================================
    # 1. حساب الشركة
    company = models.User(
        full_name="شركة التقنيات المتقدمة المحدودة",
        email="company_e2e@capstone.ps",
        password_hash=utils.hash_password("CompanyPass2026!"),
        role="partner",
        token_version=0
    )
    # 2. حساب المشرف الأكاديمي
    supervisor = models.User(
        full_name="د. المشرف المعتمد",
        email="supervisor_e2e@capstone.ps",
        password_hash=utils.hash_password("SupervisorPass2026!"),
        role="supervisor",
        token_version=0
    )
    # 3. الطالب الأول (متخصص ومحب لتطوير الويب والواجهات)
    student_web = models.User(
        full_name="أحمد طالب الويب",
        email="student_web_e2e@capstone.ps",
        password_hash=utils.hash_password("StudentPass2026!"),
        role="student",
        skills="React, TypeScript, CSS, TailwindCSS",
        token_version=0
    )
    # 4. الطالب الثاني (متخصص ومحب للذكاء الاصطناعي وهندسة البيانات)
    student_ai = models.User(
        full_name="سارة طالبة الذكاء الاصطناعي",
        email="student_ai_e2e@capstone.ps",
        password_hash=utils.hash_password("StudentPass2026!"),
        role="student",
        skills="Python, Machine Learning, SQL, Pandas",
        token_version=0
    )
    db.add_all([company, supervisor, student_web, student_ai])
    db.commit()

    # إنشاء ملفات الطلاب الأكاديمية
    profile_web = models.StudentProfile(
        user_id=student_web.id,
        major="هندسة البرمجيات",
        bio="شغوف بتطوير واجهات المستخدم التفاعلية وتطبيقات الويب الحديثة",
        portfolio_url="https://github.com/student-web"
    )
    profile_ai = models.StudentProfile(
        user_id=student_ai.id,
        major="الذكاء الاصطناعي وعلم البيانات",
        bio="مهتمة بنماذج تعلم الآلة ومعالجة اللغات الطبيعية وتحليل البيانات الضخمة",
        portfolio_url="https://github.com/student-ai"
    )
    db.add_all([profile_web, profile_ai])
    db.commit()

    # ==========================================
    # سير العمل 1 & 2: الشركة تطرح مشروعاً بدون مهارات وبدون تحديد مقاعد
    # ==========================================
    company_payload = schemas.ProjectCreate(
        title="نظام تتبع وإدارة أساطيل التوزيع الذكي",
        description=(
            "【ملخص المشروع】\nمنظومة متكاملة لإدارة خطوط سير المركبات وتوزيع الشحنات.\n\n"
            "【وصف المشكلة والتحدي العملي】\nنواجه تأخيراً في تحديث مواقع المركبات وهدراً في استهلاك الوقود.\n\n"
            "【الأهداف والمخرجات المتوقعة】\nلوحة تحكم إدارية ونموذج تتبع حي وتنبؤ بالمسار الأفضل.\n\n"
            "【المستندات والروابط المرجعية】\nhttps://drive.google.com/specs_fleet_doc.pdf"
        ),
        category="هندسة البرمجيات",
        required_skills="",  # غير مطلوبة من الشركة
        max_members=4        # القيمة التلقائية الأولية
    )

    created_project = create_project(project=company_payload, db=db, current_user=company)

    # التحقق من حفظ المشروع بحالة pending
    assert created_project.id is not None
    assert created_project.status == "pending", "Project status must be pending"
    assert created_project.decided_at is None, "decided_at must be None before supervisor review"
    assert created_project.company_name == company.full_name
    assert created_project.required_skills == ""
    assert "سلاسل" not in created_project.title
    assert "أساطيل التوزيع" in created_project.title

    # ==========================================
    # سير العمل 3: المشرف الأكاديمي يتلقى إشعاراً بالمشروع المعلق
    # ==========================================
    supervisor_notification = db.query(models.Notification).filter(
        models.Notification.user_id == supervisor.id,
        models.Notification.project_id == created_project.id
    ).first()

    assert supervisor_notification is not None, "Academic supervisor must receive notification"
    assert "بانتظار الاعتماد" in supervisor_notification.title
    assert created_project.title in supervisor_notification.message

    # ==========================================
    # سير العمل 5: منع الشركة من تحديد المقاعد أو الاعتماد (403 Forbidden)
    # ==========================================
    # أ) محاولة الشركة تعديل المقاعد عبر update_project_seats
    with pytest.raises(HTTPException) as exc_seats:
        update_project_seats(
            id=created_project.id,
            seats_in=schemas.ProjectSeatsUpdate(seats=5),
            db=db,
            current_user=company
        )
    assert exc_seats.value.status_code == 403, "Company must be forbidden from updating seats directly"

    # ب) محاولة الشركة تمرير مقاعد عبر PUT /projects/{id}
    with pytest.raises(HTTPException) as exc_update:
        update_project(
            id=created_project.id,
            updated_project=schemas.ProjectSupervisorUpdate(seats=5),
            db=db,
            current_user=company
        )
    assert exc_update.value.status_code == 403, "Company must be forbidden from setting seats in general update"

    # ج) محاولة الشركة اعتماد المشروع بنفسها
    with pytest.raises(HTTPException) as exc_status:
        update_project_status(
            project_id=created_project.id,
            status_update=schemas.ProjectStatusUpdate(status="approved"),
            db=db,
            current_user=company
        )
    assert exc_status.value.status_code == 403, "Company must be forbidden from approving its own project"

    # ==========================================
    # سير العمل 10 (الجزء الأول): المشاريع المعلقة لا تظهر في التوصيات إطلاقاً
    # ==========================================
    recs_while_pending = get_recommended_projects(limit=None, db=db, current_user=student_web)
    assert created_project.id not in [r.id for r in recs_while_pending], "Pending project must NOT appear in recommendations"

    # فحص أمني: محاولة الطالب التقديم على مشروع معلق قبل اعتماده وتحديد مقاعده
    with pytest.raises(HTTPException) as exc_apply_pending:
        apply_to_project(
            application=schemas.ApplicationCreate(
                project_id=created_project.id,
                message="أرغب بالانضمام للمشروع قبل اعتماده"
            ),
            db=db,
            current_user=student_web
        )
    assert exc_apply_pending.value.status_code == 400
    assert "لا يمكن التقديم إلا على مشروع معتمد" in exc_apply_pending.value.detail

    # ==========================================
    # سير العمل 4: المشرف الأكاديمي يعتمد المشروع ويحدد المقاعد والمهارات
    # ==========================================
    # المشرف يحدد المقاعد بـ 3 طلاب بدلاً من 4
    approve_result = update_project_status(
        project_id=created_project.id,
        status_update=schemas.ProjectStatusUpdate(
            status="approved",
            seats=3,
            feedback="مشروع متميز يلبي متطلبات التخرج وتم اعتماده بـ 3 مقاعد."
        ),
        db=db,
        current_user=supervisor
    )

    assert approve_result.status == "approved"
    assert approve_result.max_members == 3
    assert approve_result.seats == 3
    assert approve_result.decided_at is not None
    assert approve_result.supervisor_id == supervisor.id

    # تحديث مهارات المشروع من قبل المشرف لتشمل تطوير ويب وبايثون
    # (نحاكي قيام المشرف بتخصيص المهارات بعد دراسة التحدي)
    project_db = db.query(models.Project).filter(models.Project.id == created_project.id).first()
    project_db.required_skills = "React, TypeScript, Python, SQL"
    db.commit()
    db.refresh(project_db)

    # ==========================================
    # سير العمل 6: بعد الاعتماد، المشروع يصبح مؤهلاً للظهور في التوصيات
    # ==========================================
    recs_after_approval = get_recommended_projects(limit=None, db=db, current_user=student_web)
    assert created_project.id in [r.id for r in recs_after_approval], "Approved project must now appear in recommendations"

    # ==========================================
    # سير العمل 7: طالبان بمهارات مختلفة يتلقيان توصيات مخصصة ومتباينة
    # ==========================================
    recs_student_web = get_recommended_projects(limit=None, db=db, current_user=student_web)
    recs_student_ai = get_recommended_projects(limit=None, db=db, current_user=student_ai)

    rec_web_for_p = next(r for r in recs_student_web if r.id == created_project.id)
    rec_ai_for_p = next(r for r in recs_student_ai if r.id == created_project.id)

    # طالب الويب يمتلك React و TypeScript
    assert "React" in rec_web_for_p.matched_skills
    assert "TypeScript" in rec_web_for_p.matched_skills
    assert "Python" in rec_web_for_p.missing_skills
    assert "SQL" in rec_web_for_p.missing_skills

    # طالبة الذكاء الاصطناعي تمتلك Python و SQL
    assert "Python" in rec_ai_for_p.matched_skills
    assert "SQL" in rec_ai_for_p.matched_skills
    assert "React" in rec_ai_for_p.missing_skills
    assert "TypeScript" in rec_ai_for_p.missing_skills

    # ==========================================
    # سير العمل 8: تحديث مهارات الطالب يحدث درجات التوصية ديناميكياً
    # ==========================================
    initial_web_score = rec_web_for_p.match_score

    # طالب الويب يتعلم ويكتسب مهارات إضافية (Python و SQL)
    student_web.skills = "React, TypeScript, CSS, TailwindCSS, Python, SQL"
    db.commit()
    db.refresh(student_web)

    # إعادة طلب التوصيات بعد تحديث المهارات
    recs_student_web_updated = get_recommended_projects(limit=None, db=db, current_user=student_web)
    rec_web_updated_for_p = next(r for r in recs_student_web_updated if r.id == created_project.id)

    # النتيجة يجب أن ترتفع بشكل حاسم
    assert rec_web_updated_for_p.match_score > initial_web_score
    # وأصبحت جميع المهارات الأربع متوفرة
    assert "Python" in rec_web_updated_for_p.matched_skills
    assert "SQL" in rec_web_updated_for_p.matched_skills
    assert len(rec_web_updated_for_p.missing_skills) == 0

    # ==========================================
    # سير العمل 9: التحقق من دقة تفصيل النقاط (Breakdown) والشرح العربي
    # ==========================================
    breakdown = rec_web_updated_for_p.score_breakdown
    assert breakdown.explicit_skill_score == 100.0, "All 4 required skills are now matched"
    assert breakdown.weights.explicit_skills == 50
    assert breakdown.weights.semantic_similarity == 30
    assert breakdown.weights.major_compatibility == 10
    assert breakdown.weights.profile_completeness == 10

    # الشرح العربي ديناميكي ومفصل
    assert len(rec_web_updated_for_p.ai_explanation) > 20
    assert "تطابق" in rec_web_updated_for_p.ai_explanation
    assert created_project.title in rec_web_updated_for_p.ai_explanation

    # ==========================================
    # سير العمل 10 (الجزء الثاني): المشاريع المرفوضة لا تظهر في التوصيات
    # ==========================================
    rejected_project = models.Project(
        title="مشروع تجريبي تم رفضه",
        description="وصف مشروع غير مطابق للشروط",
        required_skills="React, Python",
        status="rejected",
        max_members=4
    )
    db.add(rejected_project)
    db.commit()

    all_web_recs = get_recommended_projects(limit=None, db=db, current_user=student_web)
    assert rejected_project.id not in [r.id for r in all_web_recs], "Rejected project must NEVER appear in recommendations"

    # ==========================================
    # التحقق من تقديم الطلاب بعد الاعتماد ومنعه للمشاريع المرفوضة
    # ==========================================
    # 1. نجاح تقديم الطالب على المشروع بعد اعتماده الأكاديمي
    app_success = apply_to_project(
        application=schemas.ApplicationCreate(
            project_id=created_project.id,
            message="مهتم جداً بالمشروع ولدي المهارات المطلوبة"
        ),
        db=db,
        current_user=student_web
    )
    assert app_success.id is not None
    assert app_success.status == "applied"
    assert app_success.student_id == student_web.id

    # 2. منع الطالب من التقديم على نفس المشروع مرة أخرى
    with pytest.raises(HTTPException) as exc_reapply:
        apply_to_project(
            application=schemas.ApplicationCreate(
                project_id=created_project.id,
                message="محاولة ثانية"
            ),
            db=db,
            current_user=student_web
        )
    assert exc_reapply.value.status_code == 400
    assert "لقد قمت بالتقديم على هذا المشروع مسبقاً" in exc_reapply.value.detail

    # 3. منع محاولة التقديم على المشروع المرفوض
    with pytest.raises(HTTPException) as exc_apply_rejected:
        apply_to_project(
            application=schemas.ApplicationCreate(
                project_id=rejected_project.id,
                message="تقديم على مشروع مرفوض"
            ),
            db=db,
            current_user=student_ai
        )
    assert exc_apply_rejected.value.status_code == 400
    assert "لا يمكن التقديم إلا على مشروع معتمد" in exc_apply_rejected.value.detail

    # 4. منع الأدوار غير الطلابية (الشركة) من التقديم
    with pytest.raises(HTTPException) as exc_comp_apply:
        apply_to_project(
            application=schemas.ApplicationCreate(
                project_id=created_project.id,
                message="شركة تقدم كطالب"
            ),
            db=db,
            current_user=company
        )
    assert exc_comp_apply.value.status_code == 403
    assert "التقديم على المشاريع متاح للطلاب فقط" in exc_comp_apply.value.detail

    db.close()
