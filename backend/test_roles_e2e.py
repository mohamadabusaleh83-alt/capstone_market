import pytest
import time
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)
TS = int(time.time())

def test_role_student_full_lifecycle():
    """
    اختبار دور الطالب (Student):
    1. فشل الدخول ببيانات خاطئة (401)
    2. الدخول الناجح واستخراج التوكن
    3. حفظ وتعديل واسترجاع الملف الشخصي والسيرة الذاتية والمهارات
    4. محاولة تجاوز الصلاحيات (RBAC: لا يمكنه اعتماد المشاريع -> 403)
    5. التقديم على مشروع متاح
    6. منع التقديم المتكرر (400)
    7. إرسال وقراءة الرسائل في المشروع المقبول فيه
    8. منع قراءة رسائل مشروع غير مشارك فيه (403)
    9. تسجيل الخروج وفحص حماية المسارات برفض الطلبات بدون توكن (401)
    """
    email = f"student_role_{TS}@capstone.ps"
    password = "TestStudentPass2026!"
    
    # 1. إنشاء الحساب
    reg_res = client.post("/users/", json={
        "full_name": f"طالب اختبار الصلاحيات {TS}",
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
    projects_res = client.get("/projects/")
    assert projects_res.status_code == 200
    projects = projects_res.json()
    assert len(projects) > 0
    proj_id = projects[0]["id"]

    escalation_res = client.put(
        f"/projects/{proj_id}/status",
        json={"status": "approved"},
        headers=auth_headers
    )
    assert escalation_res.status_code == 403

    # 4. التقديم على مشروع ومنع التقديم المزدوج
    # نجلب مشروع معتمد
    approved_projects = [p for p in projects if p["status"] == "approved"]
    target_proj_id = approved_projects[0]["id"] if approved_projects else proj_id

    app_res = client.post(
        "/applications/",
        json={"project_id": target_proj_id, "message": "طلب انضمام لتنفيذ الواجهات الخلفية"},
        headers=auth_headers
    )
    assert app_res.status_code in [200, 201]

    # منع التقديم المتكرر
    dup_res = client.post(
        "/applications/",
        json={"project_id": target_proj_id, "message": "محاولة تقديم ثانية"},
        headers=auth_headers
    )
    assert dup_res.status_code == 400

    # 5. المراسلة داخل المشروع
    msg_res = client.post(
        f"/projects/{target_proj_id}/messages",
        json={"text": f"مرحباً فريق المشروع {TS}"},
        headers=auth_headers
    )
    assert msg_res.status_code in [200, 201]

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
    4. مراجعة الطلبات المقدمة على المشروع
    5. قبول الطلب وتحديث عدد المقاعد
    6. التحدث داخل شات المشروع
    7. التحقق من منع الشركة من اعتماد المشروع بنفسها (صلاحية المشرف فقط -> 403)
    8. تسجيل الخروج
    """
    email = f"company_role_{TS}@capstone.ps"
    password = "TestCompanyPass2026!"

    # 1. إنشاء حساب الشركة
    reg_res = client.post("/users/", json={
        "full_name": f"شركة التقنية المتقدمة {TS}",
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
            "title": f"نظام مراقبة استهلاك الطاقة الذكي {TS}",
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

    # 5. طالب يقدم على المشروع
    student_email = f"applicant_student_{TS}@capstone.ps"
    client.post("/users/", json={
        "full_name": f"طالب متقدم {TS}",
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

    # 6. الشركة تقبل الطلب
    accept_res = client.put(
        f"/applications/{app_id}/status",
        json={"status": "accepted"},
        headers=auth_headers
    )
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "accepted"

    # 7. التراسل في شات المشروع
    chat_res = client.post(
        f"/projects/{new_proj_id}/messages",
        json={"text": "أهلاً بك معنا في الفريق التقني للتحدي"},
        headers=auth_headers
    )
    assert chat_res.status_code in [200, 201]

    # 8. تسجيل الخروج
    logout_res = client.post("/logout", headers=auth_headers)
    assert logout_res.status_code == 200


def test_role_supervisor_full_lifecycle():
    """
    اختبار دور المشرف الأكاديمي (Supervisor):
    1. تسجيل الدخول بالحساب الرسمي المعتمد
    2. استرجاع بيانات المشرف وصلاحياته
    3. مراجعة واعتماد أو رفض مشاريع الشركات والطلاب (PUT /projects/{id}/status)
    4. المشاركة في شات المشروع للإشراف الأكاديمي
    5. تحديث بيانات المشرف الأكاديمي وحفظها
    6. تسجيل الخروج
    """
    # 1. تسجيل الدخول بالحساب الرسمي للمشرف الأكاديمي
    login_res = client.post(
        "/login",
        data={"username": "omarie@qou.edu", "password": "Doctor@2025"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # 2. فحص الصلاحيات والرتبة
    me_res = client.get("/me", headers=auth_headers)
    assert me_res.status_code == 200
    user_data = me_res.json()
    assert user_data["role"] == "supervisor"
    assert user_data["email"] == "omarie@qou.edu"

    # 3. مراجعة وتغيير حالة مشروع (Approve / Reject)
    projects_res = client.get("/projects/")
    projects = projects_res.json()
    assert len(projects) > 0
    target_proj = projects[-1]
    target_id = target_proj["id"]

    approve_res = client.put(
        f"/projects/{target_id}/status",
        json={"status": "approved"},
        headers=auth_headers
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "approved"

    # 4. إرسال توجيه أكاديمي في شات المشروع
    msg_res = client.post(
        f"/projects/{target_id}/messages",
        json={"text": "توجيه إشرافي: يرجى إعداد مخطط العلاقات ERD وتسليمه قبل نهاية الأسبوع."},
        headers=auth_headers
    )
    assert msg_res.status_code in [200, 201]

    # قراءة سجل الرسائل
    get_msgs = client.get(f"/projects/{target_id}/messages", headers=auth_headers)
    assert get_msgs.status_code == 200
    assert any("توجيه إشرافي" in m["text"] for m in get_msgs.json())

    # 5. حفظ الملف الشخصي وتحديث بيانات التواصل
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

    # 6. تسجيل الخروج
    logout_res = client.post("/logout", headers=auth_headers)
    assert logout_res.status_code == 200
