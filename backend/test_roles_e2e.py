import os
import sys
import time
import uuid
import pytest

# Ensure backend directory is in python path and config environment variables are set
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ["DATABASE_URL"] = os.environ.get("DATABASE_URL", "sqlite:///./test.db")
os.environ["SECRET_KEY"] = os.environ.get("SECRET_KEY", "ee6defc0a760f3d9d40b0bbbe19dc6312a14e9c704f67c51483321527ef9a589")
os.environ["DEV_INSECURE_KEY"] = "1"

from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
import models
import utils

client = TestClient(app)


def get_supervisor_headers():
    """الحصول على توكن المشرف الرسمي أو إنشاء الحساب إن لم يكن موجوداً في قاعدة بيانات الاختبار"""
    login_res = client.post(
        "/login",
        data={"username": "omarie@qou.edu", "password": "Doctor@2025"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    if login_res.status_code == 200:
        token = login_res.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == "omarie@qou.edu").first()
        if not user:
            user = models.User(
                full_name="د. عمر المشرف الأكاديمي",
                email="omarie@qou.edu",
                password_hash=utils.hash_password("Doctor@2025"),
                role="supervisor"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            user.password_hash = utils.hash_password("Doctor@2025")
            user.role = "supervisor"
            db.commit()
    finally:
        db.close()

    login_res = client.post(
        "/login",
        data={"username": "omarie@qou.edu", "password": "Doctor@2025"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_role_student_full_lifecycle():
    """
    اختبار دور الطالب (Student):
    1. فشل الدخول ببيانات خاطئة (401)
    2. الدخول الناجح واستخراج التوكن
    3. حفظ وتعديل واسترجاع الملف الشخصي والسيرة الذاتية والمهارات
    4. محاولة تجاوز الصلاحيات (RBAC: لا يمكنه اعتماد المشاريع -> 403)
    5. التقديم على مشروع معتمد شاغر
    6. منع التقديم المتكرر (400)
    7. إرسال وقراءة الرسائل بعد اعتماد الطالب من قبل المشرف
    8. منع قراءة رسائل مشروع غير مشارك فيه (403)
    9. تسجيل الخروج وفحص حماية المسارات برفض الطلبات بدون توكن (401)
    """
    ts = f"{int(time.time())}_{uuid.uuid4().hex[:4]}"
    email = f"student_role_{ts}@capstone.ps"
    password = "TestStudentPass2026!"
    sup_headers = get_supervisor_headers()

    # 1. إنشاء الحساب
    reg_res = client.post("/users/", json={
        "full_name": f"طالب اختبار الصلاحيات {ts}",
        "email": email,
        "password": password,
        "role": "student"
    })
    assert reg_res.status_code in [200, 201]

    # فشل الدخول بكلمة سر غير صحيحة
    wrong_login = client.post(
        "/login",
        data={"username": email, "password": "WrongPassword!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert wrong_login.status_code == 401

    # تسجيل الدخول الصحيح
    login_res = client.post(
        "/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # 2. حفظ وتعديل الملف الشخصي والمهارات والبيو
    update_prof = client.put(
        "/users/me/profile",
        json={
            "phone": "+970599111222",
            "major": "أنظمة المعلومات الحاسوبية (CIS)",
            "bio": "طالب شغوف بتطوير الويب وأمن المعلومات",
            "portfolio_url": "https://github.com/student-demo",
            "course": "مشروع تخرج 2",
            "university": "جامعة القدس المفتوحة",
            "skills": "React, Python, FastAPI, PostgreSQL"
        },
        headers=auth_headers
    )
    assert update_prof.status_code == 200
    prof_data = update_prof.json()
    assert prof_data["phone"] == "+970599111222"
    assert prof_data["major"] == "أنظمة المعلومات الحاسوبية (CIS)"
    assert prof_data["portfolio_url"] == "https://github.com/student-demo"
    assert "FastAPI" in prof_data["skills"]

    # التأكد من ثبات الحفظ عبر GET /users/me/profile
    get_prof = client.get("/users/me/profile", headers=auth_headers)
    assert get_prof.status_code == 200
    assert get_prof.json()["phone"] == "+970599111222"

    # 3. محاولة تصعيد الصلاحيات (اعتماد مشروع كأنه مشرف -> يجب رفضها 403)
    # إنشاء مشروع مخصص للاختبار لضمان وجود مشروع
    comp_email = f"comp_studtest_{ts}@capstone.ps"
    client.post("/users/", json={
        "full_name": f"شركة شريكة {ts}",
        "email": comp_email,
        "password": "Password123!",
        "role": "partner"
    })
    comp_login = client.post("/login", data={"username": comp_email, "password": "Password123!"})
    comp_headers = {"Authorization": f"Bearer {comp_login.json()['access_token']}"}
    
    proj_res = client.post("/projects/", json={
        "title": f"مشروع اختبار الطالب {ts}",
        "description": "وصف تفصيلي لمشروع التخرج لاختبار الصلاحيات الكاملة",
        "required_skills": "Python, FastAPI",
        "max_members": 3
    }, headers=comp_headers)
    assert proj_res.status_code in [200, 201]
    target_proj_id = proj_res.json()["id"]

    escalation_res = client.put(
        f"/projects/{target_proj_id}/status",
        json={"status": "approved"},
        headers=auth_headers
    )
    assert escalation_res.status_code == 403

    # محاولة التقديم على المشروع وهو pending -> ترفض 400 حسب قواعد النظام
    premature_app = client.post(
        "/applications/",
        json={"project_id": target_proj_id, "message": "طلب انضمام مبكر"},
        headers=auth_headers
    )
    assert premature_app.status_code == 400

    # يعتمد المشرف المشروع
    sup_appr = client.put(
        f"/projects/{target_proj_id}/status",
        json={"status": "approved", "seats": 3},
        headers=sup_headers
    )
    assert sup_appr.status_code == 200

    # 4. التقديم على المشروع بعد اعتماده ومنع التقديم المزدوج
    app_res = client.post(
        "/applications/",
        json={"project_id": target_proj_id, "message": "طلب انضمام لتنفيذ الواجهات الخلفية"},
        headers=auth_headers
    )
    assert app_res.status_code in [200, 201]
    app_id = app_res.json()["id"]

    # منع التقديم المتكرر
    dup_res = client.post(
        "/applications/",
        json={"project_id": target_proj_id, "message": "محاولة تقديم ثانية"},
        headers=auth_headers
    )
    assert dup_res.status_code == 400

    # محاولة إرسال رسالة قبل الاعتماد الأكاديمي للطلب -> ترفض 403 لحماية خصوصية المحادثات
    pre_accept_msg = client.post(
        f"/projects/{target_proj_id}/messages",
        json={"text": "محاولة مراسلة قبل القبول"},
        headers=auth_headers
    )
    assert pre_accept_msg.status_code == 403

    # يعتمد المشرف انضمام الطالب للمشروع
    accept_res = client.put(
        f"/applications/{app_id}/status",
        json={"status": "academically_approved", "feedback": "مرحب بك في المشروع"},
        headers=sup_headers
    )
    assert accept_res.status_code == 200

    # 5. المراسلة داخل المشروع بعد القبول
    msg_res = client.post(
        f"/projects/{target_proj_id}/messages",
        json={"text": f"مرحباً فريق المشروع {ts}", "conversation_type": "company_student"},
        headers=auth_headers
    )
    assert msg_res.status_code in [200, 201]

    # قراءة الرسائل بنجاح
    read_msgs = client.get(
        f"/projects/{target_proj_id}/messages?conversation_type=company_student",
        headers=auth_headers
    )
    assert read_msgs.status_code == 200
    assert any(f"مرحباً فريق المشروع {ts}" in m["text"] for m in read_msgs.json())

    # منع قراءة رسائل مشروع آخر غير مقبول فيه (مشروع جديد منفصل)
    other_proj = client.post("/projects/", json={
        "title": f"مشروع منعزل آخر {ts}",
        "description": "مشروع لاختبار العزل الأمني بين المشاريع",
        "required_skills": "Security, Isolation",
        "max_members": 2
    }, headers=comp_headers).json()
    other_read = client.get(f"/projects/{other_proj['id']}/messages", headers=auth_headers)
    assert other_read.status_code == 403

    # 6. تسجيل الخروج والتأكد من حماية المسارات برفض أي طلب بدون توكن
    logout_res = client.post("/logout", headers=auth_headers)
    assert logout_res.status_code == 200

    unauth_check = client.get("/users/me/profile")
    assert unauth_check.status_code == 401


def test_role_company_full_lifecycle():
    """
    اختبار دور الشركة / الشريك الصناعي (Company / Partner):
    1. تسجيل الدخول بالبيانات الصحيحة
    2. تعديل الملف التعريفي والمهارات للشركة
    3. إنشاء ونشر تحدي / مشروع جديد
    4. التحقق من منع الشركة من اعتماد المشروع بنفسها (صلاحية المشرف فقط -> 403)
    5. اعتماد المشروع من المشرف الأكاديمي ثم تقديم الطالب
    6. التحقق الأمني من منع الشركة من قبول أو رفض طلبات الطلاب (صلاحية المشرف حصرياً -> 403)
    7. اعتماد المشرف للطلب وتواصل الشركة مع الطالب في شات المشروع
    8. منع الشركة من الدخول لقناة الإشراف الأكاديمي (403)
    9. تسجيل الخروج
    """
    ts = f"{int(time.time())}_{uuid.uuid4().hex[:4]}"
    email = f"company_role_{ts}@capstone.ps"
    password = "TestCompanyPass2026!"
    sup_headers = get_supervisor_headers()

    # 1. إنشاء حساب الشركة
    reg_res = client.post("/users/", json={
        "full_name": f"شركة التقنية المتقدمة {ts}",
        "email": email,
        "password": password,
        "role": "partner"
    })
    assert reg_res.status_code in [200, 201]

    login_res = client.post(
        "/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # 2. تعديل ملف الشركة والمهارات
    update_prof = client.put(
        "/users/me/profile",
        json={
            "phone": "+97022987654",
            "bio": "شركة متخصصة في حلول إنترنت الأشياء والذكاء الاصطناعي",
            "skills": "AI, IoT, Cloud Computing, Big Data"
        },
        headers=auth_headers
    )
    assert update_prof.status_code == 200
    assert update_prof.json()["phone"] == "+97022987654"

    # 3. إنشاء تحدي جديد (Project Challenge)
    create_proj = client.post(
        "/projects/",
        json={
            "title": f"نظام مراقبة استهلاك الطاقة الذكي {ts}",
            "description": "منظومة سحابية لقراءة حساسات الطاقة الذكية عبر بروتوكول MQTT وتحليلها في الوقت الفعلي",
            "required_skills": "Python, MQTT, React, Docker",
            "max_members": 3
        },
        headers=auth_headers
    )
    assert create_proj.status_code in [200, 201]
    new_proj = create_proj.json()
    new_proj_id = new_proj["id"]
    assert new_proj["status"] == "pending"

    # 4. محاولة الشركة اعتماد مشروعها بنفسها (يجب الرفض 403 لأن الاعتماد للمشرف فقط)
    self_approve = client.put(
        f"/projects/{new_proj_id}/status",
        json={"status": "approved"},
        headers=auth_headers
    )
    assert self_approve.status_code == 403

    # 5. اعتماد المشروع من قبل المشرف الأكاديمي
    sup_appr = client.put(
        f"/projects/{new_proj_id}/status",
        json={"status": "approved", "seats": 3},
        headers=sup_headers
    )
    assert sup_appr.status_code == 200
    assert sup_appr.json()["status"] == "approved"

    # طالب يقدم على المشروع بعد اعتماده
    student_email = f"applicant_student_{ts}@capstone.ps"
    client.post("/users/", json={
        "full_name": f"طالب متقدم {ts}",
        "email": student_email,
        "password": "pass1234Password!",
        "role": "student"
    })
    stud_login = client.post(
        "/login",
        data={"username": student_email, "password": "pass1234Password!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    stud_token = stud_login.json()["access_token"]
    app_res = client.post(
        "/applications/",
        json={"project_id": new_proj_id, "message": "خبرة ممتازة في MQTT و Python"},
        headers={"Authorization": f"Bearer {stud_token}"}
    )
    assert app_res.status_code in [200, 201]
    app_id = app_res.json()["id"]

    # 6. فحص أمني حاسم: الشركة ممنوعة من قبول أو تغيير حالة طلبات الطلاب (RBAC -> 403 Forbidden)
    company_accept_attempt = client.put(
        f"/applications/{app_id}/status",
        json={"status": "accepted"},
        headers=auth_headers
    )
    assert company_accept_attempt.status_code == 403

    # 7. المشرف الأكاديمي يعتمد انضمام الطالب للمشروع
    sup_accept = client.put(
        f"/applications/{app_id}/status",
        json={"status": "academically_approved", "feedback": "تم اعتماد انضمامك للجانب التقني"},
        headers=sup_headers
    )
    assert sup_accept.status_code == 200

    # 8. التراسل في شات المشروع التقني
    chat_res = client.post(
        f"/projects/{new_proj_id}/messages",
        json={"text": "أهلاً بك معنا في الفريق التقني للتحدي", "conversation_type": "company_student"},
        headers=auth_headers
    )
    assert chat_res.status_code in [200, 201]

    # الشركة ممنوعة من الوصول لقناة الإشراف الأكاديمي
    sup_channel_attempt = client.get(
        f"/projects/{new_proj_id}/messages?conversation_type=supervisor_student",
        headers=auth_headers
    )
    assert sup_channel_attempt.status_code == 403

    # 9. تسجيل الخروج
    logout_res = client.post("/logout", headers=auth_headers)
    assert logout_res.status_code == 200


def test_role_supervisor_full_lifecycle():
    """
    اختبار دور المشرف الأكاديمي (Supervisor):
    1. تسجيل الدخول بالحساب الرسمي المعتمد
    2. استرجاع بيانات المشرف وصلاحياته
    3. مراجعة واعتماد مشروع معلق وحفظ القرار والمقاعد
    4. منع اتخاذ قرار مكرر على المشروع بعد حسمه (400)
    5. المشاركة في شات المشروع للإشراف الأكاديمي
    6. تحديث بيانات المشرف الأكاديمي وحفظها
    7. تسجيل الخروج
    """
    ts = f"{int(time.time())}_{uuid.uuid4().hex[:4]}"
    auth_headers = get_supervisor_headers()

    # 1 & 2. فحص الصلاحيات والرتبة
    me_res = client.get("/me", headers=auth_headers)
    assert me_res.status_code == 200
    user_data = me_res.json()
    assert user_data["role"] == "supervisor"
    assert user_data["email"] == "omarie@qou.edu"

    # 3. إنشاء مشروع معلق من قبل شريك لاختبار قرار الاعتماد عليه بشكل نظيف
    partner_email = f"sup_partner_{ts}@capstone.ps"
    client.post("/users/", json={
        "full_name": f"شريك تجربة الإشراف {ts}",
        "email": partner_email,
        "password": "Password123!",
        "role": "partner"
    })
    part_login = client.post("/login", data={"username": partner_email, "password": "Password123!"})
    part_headers = {"Authorization": f"Bearer {part_login.json()['access_token']}"}

    create_proj = client.post(
        "/projects/",
        json={
            "title": f"مشروع فحص قرار المشرف {ts}",
            "description": "مشروع للتحقق من اعتماد المشرف وحجز المقاعد",
            "required_skills": "Python, React",
            "max_members": 4
        },
        headers=part_headers
    )
    assert create_proj.status_code in [200, 201]
    target_id = create_proj.json()["id"]

    # اعتماد المشروع وحجز المقاعد
    approve_res = client.put(
        f"/projects/{target_id}/status",
        json={"status": "approved", "seats": 4, "feedback": "معتمد أكاديمياً للمباشرة"},
        headers=auth_headers
    )
    assert approve_res.status_code == 200
    appr_data = approve_res.json()
    assert appr_data["status"] == "approved"
    assert appr_data["max_members"] == 4

    # 4. منع القرار المكرر على مشروع معتمد بالفعل
    dup_decision = client.put(
        f"/projects/{target_id}/status",
        json={"status": "approved"},
        headers=auth_headers
    )
    assert dup_decision.status_code == 400

    # 5. إرسال توجيه أكاديمي في شات المشروع
    msg_res = client.post(
        f"/projects/{target_id}/messages",
        json={
            "text": "توجيه إشرافي: يرجى إعداد مخطط العلاقات ERD وتسليمه قبل نهاية الأسبوع.",
            "conversation_type": "supervisor_student"
        },
        headers=auth_headers
    )
    assert msg_res.status_code in [200, 201]

    # قراءة سجل الرسائل
    get_msgs = client.get(
        f"/projects/{target_id}/messages?conversation_type=supervisor_student",
        headers=auth_headers
    )
    assert get_msgs.status_code == 200
    assert any("توجيه إشرافي" in m["text"] for m in get_msgs.json())

    # 6. حفظ الملف الشخصي وتحديث بيانات التواصل
    prof_update = client.put(
        "/users/me/profile",
        json={
            "phone": "+970599000111",
            "bio": "أستاذ مشارك - قسم أنظمة المعلومات الحاسوبية",
            "skills": "نظم معلومات حاسوبية, هندسة البرمجيات, إدارة المشاريع البرمجية"
        },
        headers=auth_headers
    )
    assert prof_update.status_code == 200
    assert prof_update.json()["phone"] == "+970599000111"

    # 7. تسجيل الخروج
    logout_res = client.post("/logout", headers=auth_headers)
    assert logout_res.status_code == 200
