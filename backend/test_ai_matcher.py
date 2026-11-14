"""
Unit and Integration Tests for AI Matching & Recommendation Engine.
Tests:
- TF-IDF word and character n-grams, cosine similarity
- Bilingual ontology and canonicalization (Arabic & English)
- Multi-factor scoring [0-100] and deterministic weights
- Dynamic Arabic explanation generation
- Endpoint /projects/recommended authentication and filtering
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import ai_matcher
from database import Base, get_db
import models
import schemas
import utils


# ==========================================
# 1. اختبارات محرك الـ TF-IDF والنماذج الرياضية
# ==========================================

def test_tfidf_vectorizer_basic():
    tfidf = ai_matcher.PureTFIDF()
    docs = [
        "تطوير منصة ويب باستخدام بايثون ورياكت",
        "تطبيق جوال فلاتر وقواعد بيانات سحابية",
        "مشروع تعلم الآلة وتحليل البيانات ببايثون"
    ]
    tfidf.fit(docs)
    
    vec1 = tfidf.transform("بايثون ورياكت للويب")
    vec2 = tfidf.transform("تطوير بايثون ورياكت")
    vec3 = tfidf.transform("فلاتر جوال")
    
    sim_1_2 = ai_matcher.PureTFIDF.cosine_similarity(vec1, vec2)
    sim_1_3 = ai_matcher.PureTFIDF.cosine_similarity(vec1, vec3)
    
    assert 0.0 <= sim_1_2 <= 1.0
    assert 0.0 <= sim_1_3 <= 1.0
    # الوثيقتان المتشابهتان تقنياً يجب أن تكونا أعلى تشابهاً بكثير من الوثيقة غير ذات الصلة
    assert sim_1_2 > sim_1_3


def test_tfidf_empty_and_zero_vectors():
    tfidf = ai_matcher.PureTFIDF()
    vec_empty = tfidf.transform("")
    vec_whitespace = tfidf.transform("   ")
    assert vec_empty == {}
    assert vec_whitespace == {}
    assert ai_matcher.PureTFIDF.cosine_similarity(vec_empty, vec_whitespace) == 0.0


# ==========================================
# 2. اختبارات أنطولوجيا المهارات ثنائية اللغة
# ==========================================

def test_bilingual_skills_canonicalization():
    test_cases = [
        ("React.js", "react", "React"),
        ("رياكت", "react", "React"),
        ("Python 3", "python", "Python"),
        ("بايثون", "python", "Python"),
        ("PostgreSQL", "postgresql", "PostgreSQL"),
        ("بوستجريس", "postgresql", "PostgreSQL"),
        ("تعلم الآلة", "machine_learning", "Machine Learning"),
        ("تعلم الالة", "machine_learning", "Machine Learning"),
        ("Machine Learning", "machine_learning", "Machine Learning"),
        ("أمن سيبراني", "cybersecurity", "Cybersecurity"),
        ("cybersecurity", "cybersecurity", "Cybersecurity"),
        ("C++", "cpp", "C++"),
        ("سي بلس بلس", "cpp", "C++")
    ]
    
    for raw, expected_key, expected_disp in test_cases:
        key, disp = ai_matcher.canonicalize_skill(raw)
        assert key == expected_key, f"Failed canonical key for '{raw}': got '{key}', expected '{expected_key}'"
        assert disp == expected_disp, f"Failed display name for '{raw}': got '{disp}', expected '{expected_disp}'"


def test_parse_skills_list_deduplication():
    raw_str = "React, رياكت, Python, بايثون, Docker, دوكر"
    parsed = ai_matcher.parse_skills_list(raw_str)
    keys = [k for k, _ in parsed]
    assert len(keys) == 3
    assert set(keys) == {"react", "python", "docker"}


# ==========================================
# 3. اختبارات درجات المطابقة والحدود [0 - 100]
# ==========================================

def test_explicit_skill_match_scoring():
    engine = ai_matcher.AIMatchingEngine()
    
    # 1. تطابق كامل باللغتين (Exact Canonical Match)
    st_skills = [("python", "Python"), ("react", "React")]
    proj_skills = [("python", "Python"), ("react", "React")]
    score, matched, missing = engine.calculate_explicit_skill_match(st_skills, proj_skills)
    assert score == 100.0
    assert len(matched) == 2
    assert len(missing) == 0

    # 2. تطابق عبر المترادف العربي الإنجليزي (بايثون ↔ Python)
    st_ar = ai_matcher.parse_skills_list("بايثون, رياكت")
    proj_en = ai_matcher.parse_skills_list("Python, React")
    score_bilingual, matched_bi, missing_bi = engine.calculate_explicit_skill_match(st_ar, proj_en)
    assert score_bilingual == 100.0
    assert len(matched_bi) == 2
    assert len(missing_bi) == 0

    # 3. مهارات مميزة ومستقلة تماماً (Python vs PostgreSQL) - لا تعامل كمتطابقة
    st_py = [("python", "Python")]
    proj_db = [("postgresql", "PostgreSQL")]
    score_distinct, matched_dist, missing_dist = engine.calculate_explicit_skill_match(st_py, proj_db)
    assert score_distinct == 0.0
    assert len(matched_dist) == 0
    assert missing_dist == ["PostgreSQL"]

    # 4. مهارات بديلة في نفس الحقل الدقيق (MySQL vs PostgreSQL) - رصيد جزئي مع إبقائها في المهارات المطلوبة
    st_sql = [("mysql", "MySQL")]
    proj_pg = [("postgresql", "PostgreSQL")]
    score_rel, matched_rel, missing_rel = engine.calculate_explicit_skill_match(st_sql, proj_pg)
    assert 30.0 <= score_rel <= 40.0
    assert len(matched_rel) == 0
    assert missing_rel == ["PostgreSQL"]


def test_major_compatibility():
    # هندسة برمجيات مع مشروع ويب
    score_se = ai_matcher.evaluate_major_compatibility("هندسة البرمجيات", "تطوير الويب", "مشروع منصة تفاعلية فرونت وبك اند")
    assert score_se >= 80.0
    
    # ذكاء اصطناعي مع مشروع تعلم آلة
    score_ai = ai_matcher.evaluate_major_compatibility("الذكاء الاصطناعي", "ذكاء اصطناعي", "نماذج تصنيف الصور بالتعلم العميق")
    assert score_ai >= 85.0


def test_dynamic_arabic_explanation():
    exp_high = ai_matcher.generate_arabic_explanation(
        match_score=88.5,
        project_title="منصة التخرج الذكية",
        matched_skills=["React", "Python"],
        missing_skills=["Docker"],
        major_compatible=True,
        major_name="هندسة البرمجيات"
    )
    assert "تطابق استثنائي" in exp_high
    assert "React" in exp_high
    assert "Docker" in exp_high
    assert "هندسة البرمجيات" in exp_high

    exp_low = ai_matcher.generate_arabic_explanation(
        match_score=45.0,
        project_title="نظام شبكات متقدم",
        matched_skills=[],
        missing_skills=["Cisco", "Linux"],
        major_compatible=False
    )
    assert "فرصة لتوسيع المعرفة" in exp_low


# ==========================================
# 4. اختبارات مسار الـ API /projects/recommended والتحقق الأمني
# ==========================================

from main import get_recommended_projects, get_current_user, create_project, update_project_seats
from database import SessionLocal
from fastapi import HTTPException


def test_recommended_projects_endpoint_requires_auth():
    db = SessionLocal()
    # التحقق من أن طلب المستخدم بدون توكن صالح يُرفض بـ 401 Unauthorized
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(token="invalid_or_missing_token", db=db)
    
    assert exc_info.value.status_code == 401
    assert "جلسة غير صالحة" in exc_info.value.detail or "WWW-Authenticate" in str(exc_info.value.headers)
    db.close()


def test_recommended_projects_filtering_and_sorting():
    db = SessionLocal()

    # إنشاء طالب
    student = models.User(
        full_name="طالب متميز",
        email="ai_student@example.com",
        password_hash=utils.hash_password("Password123!"),
        role="student",
        skills="Python, React, SQL, Machine Learning",
        token_version=0
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    profile = models.StudentProfile(
        user_id=student.id,
        major="هندسة البرمجيات",
        bio="مهتم بتطبيقات الويب والذكاء الاصطناعي",
        portfolio_url="https://github.com/aistudent"
    )
    db.add(profile)

    # إنشاء مشروع 1: معتمد ومتطابق جداً مع الطالب
    p1 = models.Project(
        title="منصة تحليل بيانات ببايثون ورياكت",
        description="تطبيق ويب متكامل لتحليل البيانات وتعلم الآلة",
        required_skills="Python, React, SQL, Machine Learning",
        category="هندسة البرمجيات",
        status="approved",
        max_members=4
    )

    # إنشاء مشروع 2: معتمد لكن بمهارات بعيدة
    p2 = models.Project(
        title="برمجة أجهزة مدمجة وإنترنت الأشياء",
        description="نظام تحكم بالعتاد الصلب عبر أردوينو وسي بلس بلس",
        required_skills="Arduino, C++, Embedded Systems",
        category="هندسة الحاسوب",
        status="approved",
        max_members=3
    )

    # إنشاء مشروع 3: قيد المراجعة (pending) - يجب استبعاده تماماً من التوصيات
    p3 = models.Project(
        title="مشروع معلق غير معتمد",
        description="وصف تجريبي",
        required_skills="Python, React",
        status="pending",
        max_members=4
    )

    # إنشاء مشروع 4: مرفوض (rejected) - يجب استبعاده تماماً
    p4 = models.Project(
        title="مشروع مرفوض",
        description="وصف تجريبي",
        required_skills="Python, React",
        status="rejected",
        max_members=4
    )

    db.add_all([p1, p2, p3, p4])
    db.commit()

    # استدعاء دالة الـ endpoint
    recommendations = get_recommended_projects(limit=None, db=db, current_user=student)
    
    assert isinstance(recommendations, list)
    assert len(recommendations) >= 2

    # 1. التحقق من استبعاد المشاريع المعلقة والمرفوضة
    project_ids = [item.id for item in recommendations]
    assert p1.id in project_ids
    assert p2.id in project_ids
    assert p3.id not in project_ids, "Pending projects must NEVER be recommended"
    assert p4.id not in project_ids, "Rejected projects must NEVER be recommended"

    # 2. التحقق من الترتيب التنازلي للمطابقة (مشروع 1 أعلى من مشروع 2)
    p1_res = next(item for item in recommendations if item.id == p1.id)
    p2_res = next(item for item in recommendations if item.id == p2.id)
    assert p1_res.match_score > p2_res.match_score

    # 3. فحص هيكل الشرح والتفصيل
    assert p1_res.match_score is not None
    assert p1_res.score_breakdown is not None
    assert len(p1_res.ai_explanation) > 10
    assert len(p1_res.matched_skills) > 0
    assert p1_res.major_compatible is True

    breakdown = p1_res.score_breakdown
    assert breakdown.explicit_skill_score is not None
    assert breakdown.semantic_similarity_score is not None
    assert breakdown.major_compatibility_score is not None
    assert breakdown.profile_completeness_score is not None
    assert breakdown.weights.explicit_skills == 50

    db.close()


def test_recommendations_user_isolation():
    db = SessionLocal()

    # إنشاء طالب أ (مهارات ويب)
    student_a = models.User(
        full_name="طالب ويب",
        email="student_web@example.com",
        password_hash=utils.hash_password("Pass123!"),
        role="student",
        skills="React, JavaScript, HTML, CSS",
        token_version=0
    )
    # إنشاء طالب ب (مهارات إنترنت الأشياء وعبر بايثون فقط)
    student_b = models.User(
        full_name="طالب إنترنت الأشياء",
        email="student_iot@example.com",
        password_hash=utils.hash_password("Pass123!"),
        role="student",
        skills="Arduino, C++, Embedded Systems",
        token_version=0
    )
    db.add_all([student_a, student_b])
    db.commit()

    # مشروع ويب
    p_web = models.Project(
        title="منصة تفاعلية بتقنية رياكت وجافاسكريبت",
        description="تطوير واجهات ويب متقدمة",
        required_skills="React, JavaScript",
        status="approved"
    )
    db.add(p_web)
    db.commit()

    # جلب توصيات الطالب أ
    recs_a = get_recommended_projects(limit=None, db=db, current_user=student_a)
    score_a = next(r.match_score for r in recs_a if r.id == p_web.id)

    # جلب توصيات الطالب ب
    recs_b = get_recommended_projects(limit=None, db=db, current_user=student_b)
    score_b = next(r.match_score for r in recs_b if r.id == p_web.id)

    # التحقق من عزل النتائج واختلاف درجات المطابقة بناءً على حساب الطالب الموثق
    assert score_a > score_b
    assert next(r.matched_skills for r in recs_a if r.id == p_web.id) == ["React", "JavaScript"]
    assert len(next(r.matched_skills for r in recs_b if r.id == p_web.id)) == 0

    db.close()


def test_recommendations_dynamic_score_update_on_skill_change():
    db = SessionLocal()

    student = models.User(
        full_name="طالب قابل للتطوير",
        email="dynamic_student@example.com",
        password_hash=utils.hash_password("Pass123!"),
        role="student",
        skills="",  # لا يمتلك مهارات مسجلة في البداية
        token_version=0
    )
    db.add(student)
    db.commit()

    p = models.Project(
        title="مشروع بايثون ودوكر متقدم",
        description="أنظمة خوادم وحاويات سحابية",
        required_skills="Python, Docker",
        status="approved"
    )
    db.add(p)
    db.commit()

    # 1. التقييم المبدئي بدون مهارات
    recs_initial = get_recommended_projects(limit=None, db=db, current_user=student)
    initial_score = next(r.match_score for r in recs_initial if r.id == p.id)

    # 2. إضافة المهارات المطلوبة للطالب وتحديث قاعدة البيانات
    student.skills = "Python, Docker"
    db.commit()
    db.refresh(student)

    # 3. إعادة التقييم بعد التحديث
    recs_updated = get_recommended_projects(limit=None, db=db, current_user=student)
    updated_score = next(r.match_score for r in recs_updated if r.id == p.id)

    # يجب أن ترتفع النتيجة بشكل ملحوظ بعد إضافة المهارات
    assert updated_score > initial_score
    updated_rec = next(r for r in recs_updated if r.id == p.id)
    assert "Python" in updated_rec.matched_skills
    assert "Docker" in updated_rec.matched_skills

    db.close()


def test_company_create_project_without_skills_and_seats():
    db = SessionLocal()

    # 1. إنشاء حساب شركة
    company = models.User(
        full_name="شركة الابتكار التقني",
        email="innovate_corp@example.com",
        password_hash=utils.hash_password("Pass123!"),
        role="partner",
        token_version=0
    )
    # إنشاء مشرف أكاديمي
    supervisor = models.User(
        full_name="د. المشرف الأكاديمي",
        email="academic_sup@example.com",
        password_hash=utils.hash_password("Pass123!"),
        role="supervisor",
        token_version=0
    )
    db.add_all([company, supervisor])
    db.commit()

    # 2. الشركة تطرح فرصة مشروع بدون مهارات تقنية وبدون تحديد مخصص للمقاعد
    project_payload = schemas.ProjectCreate(
        title="تطوير منصة تتبع سلاسل التوريد الذكية",
        description="【ملخص المشروع】\nمنظومة متقدمة لتتبع الشحنات.\n\n【وصف المشكلة والتحدي】\nفقدان أثر بعض الشحنات أثناء النقل بين المستودعات.\n\n【الأهداف والمخرجات】\nتطبيق ويب ولوحة تحكم ومستشعرات تتبع.",
        category="هندسة البرمجيات",
        required_skills="",  # الشركة لا يُشترط منها تحديد المهارات
        max_members=4        # القيمة المبدئية
    )

    created_project = create_project(project=project_payload, db=db, current_user=company)

    # التحقق من أن المشروع أُنشئ بحالة pending بانتظار اعتماد المشرف
    assert created_project.id is not None
    assert created_project.status == "pending"
    assert created_project.company_name == company.full_name
    assert "تتبع سلاسل التوريد" in created_project.title
    assert created_project.required_skills == ""

    # التحقق من إشعار المشرفين الأكاديميين بانتظار الاعتماد
    notif = db.query(models.Notification).filter(
        models.Notification.user_id == supervisor.id,
        models.Notification.project_id == created_project.id
    ).first()
    assert notif is not None
    assert "بانتظار الاعتماد" in notif.title

    # 3. المشرف الأكاديمي وحده هو المخول بتحديد المقاعد الرسمية للمشروع
    seats_payload = schemas.ProjectSeatsUpdate(seats=3)
    updated_project = update_project_seats(
        id=created_project.id,
        seats_in=seats_payload,
        db=db,
        current_user=supervisor
    )
    assert updated_project.max_members == 3
    assert updated_project.seats == 3

    db.close()
