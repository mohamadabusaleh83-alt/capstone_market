import pytest
import time
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
import models

client = TestClient(app)

# Helper timestamp to make unique test emails
TS = int(time.time())

@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    yield db
    db.close()

def test_1_user_registration_and_auth_flow():
    """اختبار مسارات تسجيل الحسابات، التحقق من منع التصعيد الأمني للصلاحيات، تسجيل الدخول وتوليد الـ JWT"""
    # 1. فحص الحماية الأمنية لمنع التصعيد الذاتي للصلاحيات (Privilege Escalation Prevention)
    admin_escalation = client.post("/users/", json={
        "full_name": f"محاولة أدمن {TS}",
        "email": f"hacker_admin_{TS}@capstone.ps",
        "password": "pass1234Password!",
        "role": "admin"
    })
    assert admin_escalation.status_code == 403, f"Expected 403 for admin escalation, got {admin_escalation.status_code}"

    supervisor_escalation = client.post("/users/", json={
        "full_name": f"محاولة مشرف {TS}",
        "email": f"hacker_sup_{TS}@capstone.ps",
        "password": "pass1234Password!",
        "role": "supervisor"
    })
    assert supervisor_escalation.status_code == 403, f"Expected 403 for supervisor escalation, got {supervisor_escalation.status_code}"

    # 2. تسجيل الأدوار المسموح بها ذاتياً (طالب وشريك تجاري)
    users_to_test = [
        {"full_name": f"طالب اختباري {TS}", "email": f"student_{TS}@capstone.ps", "password": "pass1234Password!", "role": "student"},
        {"full_name": f"شركة النور التجريبية {TS}", "email": f"company_{TS}@capstone.ps", "password": "pass1234Password!", "role": "partner"}
    ]

    tokens = {}

    for u in users_to_test:
        reg_res = client.post("/users/", json=u)
        assert reg_res.status_code in [200, 201], f"Failed to register user: {reg_res.text}"
        data = reg_res.json()
        assert data["email"] == u["email"]
        assert "id" in data

        login_res = client.post(
            "/login",
            data={"username": u["email"], "password": u["password"]},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert login_res.status_code == 200, f"Failed to login user: {login_res.text}"
        token_data = login_res.json()
        assert "access_token" in token_data
        assert token_data["token_type"] == "bearer"
        tokens[u["role"]] = token_data["access_token"]

        me_res = client.get("/me", headers={"Authorization": f"Bearer {token_data['access_token']}"})
        assert me_res.status_code == 200, f"Failed GET /me: {me_res.text}"
        me_data = me_res.json()
        assert me_data["email"] == u["email"]
        assert me_data["role"] == u["role"]

def test_2_projects_creation_and_approval_flow():
    """اختبار إنشاء مشروع جديد، وتغيير حالته من قبل المشرف الأكاديمي الرسمي (Pending -> Approved)"""
    login_company = client.post(
        "/login",
        data={"username": f"company_{TS}@capstone.ps", "password": "pass1234Password!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    company_token = login_company.json()["access_token"]

    # 1. إنشاء مشروع جديد POST /projects/
    proj_payload = {
        "title": f"مشروع تجريبي متكامل {TS}",
        "description": "نظام أتمتة مستودعات متطور مبني باستخدام FastAPI و React",
        "required_skills": "Python, React, Docker, FastAPI",
        "max_members": 4
    }
    create_res = client.post(
        "/projects/",
        json=proj_payload,
        headers={"Authorization": f"Bearer {company_token}"}
    )
    assert create_res.status_code in [200, 201], f"Project creation failed: {create_res.text}"
    project = create_res.json()
    project_id = project["id"]
    assert project["title"] == proj_payload["title"]
    assert project["status"] == "pending"

    # 2. فحص قائمة المشاريع العامة GET /projects/
    list_res = client.get("/projects/")
    assert list_res.status_code == 200
    projects_list = list_res.json()
    assert any(p["id"] == project_id for p in projects_list)

    # 3. اعتماد المشروع من المشرف الأكاديمي الرسمي PUT /projects/{id}/status
    login_supervisor = client.post(
        "/login",
        data={"username": "omarie@qou.edu", "password": "Doctor@2025"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    supervisor_token = login_supervisor.json()["access_token"]

    approve_res = client.put(
        f"/projects/{project_id}/status",
        json={"status": "approved"},
        headers={"Authorization": f"Bearer {supervisor_token}"}
    )
    assert approve_res.status_code == 200, f"Approval failed: {approve_res.text}"
    updated_project = approve_res.json()
    assert updated_project["status"] == "approved"

    # التحقق من أن غير المشرف لا يمكنه اعتماد أو رفض المشاريع (RBAC Check)
    login_student = client.post(
        "/login",
        data={"username": f"student_{TS}@capstone.ps", "password": "pass1234Password!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    student_token = login_student.json()["access_token"]

    unauth_res = client.put(
        f"/projects/{project_id}/status",
        json={"status": "rejected"},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert unauth_res.status_code == 403, "Student should not be able to approve/reject projects"

def test_3_applications_workflow_and_seat_deduction():
    """اختبار تقديم الطلب، منع التقديم المتكرر، قبوله من صاحب المشروع، والتحقق من سعة المقاعد"""
    list_res = client.get("/projects/")
    approved_projects = [p for p in list_res.json() if p["status"] == "approved"]
    assert len(approved_projects) > 0, "No approved project found"
    target_project = approved_projects[0]
    project_id = target_project["id"]

    login_student = client.post(
        "/login",
        data={"username": f"student_{TS}@capstone.ps", "password": "pass1234Password!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    student_token = login_student.json()["access_token"]

    # 1. تقديم طلب أول بنجاح
    app_res = client.post(
        "/applications/",
        json={"project_id": project_id, "message": "أرغب بالانضمام كمطور واجهات وأنظمة خلفية"},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert app_res.status_code in [200, 201], f"Application submission failed: {app_res.text}"
    app_data = app_res.json()
    app_id = app_data["id"]
    assert app_data["status"] == "pending"

    # 2. التحقق من منع التقديم المتكرر على نفس المشروع لنفس الطالب (Duplicate Application Prevention)
    duplicate_res = client.post(
        "/applications/",
        json={"project_id": project_id, "message": "محاولة تقديم ثانية"},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert duplicate_res.status_code == 400, "Duplicate application should return 400"
    assert "مسبقاً" in duplicate_res.text or "already" in duplicate_res.text.lower()

    # 3. قبول الطلب من قبل صاحب المشروع
    login_company = client.post(
        "/login",
        data={"username": f"company_{TS}@capstone.ps", "password": "pass1234Password!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    company_token = login_company.json()["access_token"]

    accept_res = client.put(
        f"/applications/{app_id}/status",
        json={"status": "accepted"},
        headers={"Authorization": f"Bearer {company_token}"}
    )
    assert accept_res.status_code == 200, f"Failed to accept application: {accept_res.text}"
    accepted_data = accept_res.json()
    assert accepted_data["status"] == "accepted"

    # 4. التحقق من تحديث عداد المقاعد والمشتركين
    proj_check_res = client.get(f"/projects/{project_id}")
    assert proj_check_res.status_code == 200
    updated_p = proj_check_res.json()
    assert updated_p.get("current_members", 0) >= 1
    assert updated_p.get("available_seats", 0) == updated_p["max_members"] - updated_p["current_members"]

def test_4_project_chat_and_messages_persistence():
    """اختبار شات المشروع الحقيقي، إرسال رسائل واسترجاع السجل المخزن في قاعدة البيانات"""
    list_res = client.get("/projects/")
    project_id = list_res.json()[0]["id"]

    login_student = client.post(
        "/login",
        data={"username": f"student_{TS}@capstone.ps", "password": "pass1234Password!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    student_token = login_student.json()["access_token"]

    msg_res = client.post(
        f"/projects/{project_id}/messages",
        json={"text": f"مرحباً بالجميع، تم الانتهاء من إعداد بيئة التطوير المحلية {TS}"},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert msg_res.status_code in [200, 201], f"Send message failed: {msg_res.text}"
    msg_data = msg_res.json()
    assert "id" in msg_data

    login_supervisor = client.post(
        "/login",
        data={"username": "omarie@qou.edu", "password": "Doctor@2025"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    supervisor_token = login_supervisor.json()["access_token"]

    reply_res = client.post(
        f"/projects/{project_id}/messages",
        json={"text": "ممتاز جداً! بالتوفيق في تسليم التقرير الأول."},
        headers={"Authorization": f"Bearer {supervisor_token}"}
    )
    assert reply_res.status_code in [200, 201]

    get_msgs_res = client.get(
        f"/projects/{project_id}/messages",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert get_msgs_res.status_code == 200
    messages = get_msgs_res.json()
    assert len(messages) >= 2
    assert any(m["id"] == msg_data["id"] for m in messages)

    # 4. فحص الحماية من التجسس والاختراق (BOLA / IDOR Protection)
    # طالب غير مرتبط بالمشروع ولم يقدم طلباً يحاول التسلل للرسائل
    client.post("/users/", json={
        "full_name": f"طالب خارجي {TS}",
        "email": f"unrelated_{TS}@capstone.ps",
        "password": "pass1234Password!",
        "role": "student"
    })
    unrelated_login = client.post(
        "/login",
        data={"username": f"unrelated_{TS}@capstone.ps", "password": "pass1234Password!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    unrelated_token = unrelated_login.json()["access_token"]

    unauth_get = client.get(
        f"/projects/{project_id}/messages",
        headers={"Authorization": f"Bearer {unrelated_token}"}
    )
    assert unauth_get.status_code == 403, "Unrelated student should not be able to read project messages"

    unauth_post = client.post(
        f"/projects/{project_id}/messages",
        json={"text": "محاولة اختراق شات غير مصرح"},
        headers={"Authorization": f"Bearer {unrelated_token}"}
    )
    assert unauth_post.status_code == 403, "Unrelated student should not be able to post in project chat"

def test_5_notifications_generation_and_mark_as_read():
    """اختبار توليد الإشعارات عند الأحداث وقراءتها وتحديث حالتها"""
    login_student = client.post(
        "/login",
        data={"username": f"student_{TS}@capstone.ps", "password": "pass1234Password!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    student_token = login_student.json()["access_token"]

    notifs_res = client.get("/notifications", headers={"Authorization": f"Bearer {student_token}"})
    assert notifs_res.status_code == 200
    notifs = notifs_res.json()
    assert isinstance(notifs, list)

    if len(notifs) > 0:
        first_notif_id = notifs[0]["id"]
        read_res = client.put(f"/notifications/{first_notif_id}/read", headers={"Authorization": f"Bearer {student_token}"})
        assert read_res.status_code == 200

        read_all_res = client.put("/notifications/read-all", headers={"Authorization": f"Bearer {student_token}"})
        assert read_all_res.status_code == 200

        check_notifs = client.get("/notifications", headers={"Authorization": f"Bearer {student_token}"}).json()
        assert all(n["is_read"] is True for n in check_notifs)

def test_6_official_supervisor_account():
    """التحقق من وجود حساب المشرف الأكاديمي الرسمي د. أسامة أمين مرعي وتسجيل دخوله بنجاح"""
    login_res = client.post(
        "/login",
        data={"username": "omarie@qou.edu", "password": "Doctor@2025"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert login_res.status_code == 200, f"Supervisor login failed: {login_res.text}"
    token_data = login_res.json()
    assert "access_token" in token_data
    token = token_data["access_token"]

    me_res = client.get("/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == "omarie@qou.edu"
    assert me_data["full_name"] == "د. أسامة أمين مرعي"
    assert me_data["role"] == "supervisor"
    assert "نظم معلومات حاسوبية" in me_data["skills"]

def test_7_profile_cv_and_skills_persistence():
    """اختبار استرجاع وتحديث الملف الشخصي والسيرة الذاتية والمهارات في قاعدة البيانات"""
    login_student = client.post(
        "/login",
        data={"username": f"student_{TS}@capstone.ps", "password": "pass1234Password!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    student_token = login_student.json()["access_token"]

    # 1. جلب الملف الشخصي GET /users/me/profile
    prof_res = client.get("/users/me/profile", headers={"Authorization": f"Bearer {student_token}"})
    assert prof_res.status_code == 200
    prof = prof_res.json()
    assert prof["email"] == f"student_{TS}@capstone.ps"

    # 2. تحديث بيانات السيرة الذاتية والتخصص والبيو PUT /users/me/profile
    update_res = client.put(
        "/users/me/profile",
        json={
            "phone": "+970599123456",
            "major": "علم الحاسوب (Computer Science)",
            "bio": "طالب متخصص في الأنظمة الموزعة والذكاء الاصطناعي",
            "portfolio_url": "https://github.com/my-portfolio",
            "course": "مشروع تخرج 2",
            "skills": "Python, FastAPI, Docker, PostgreSQL"
        },
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert update_res.status_code == 200, f"Update profile failed: {update_res.text}"
    updated_prof = update_res.json()
    assert updated_prof["phone"] == "+970599123456"
    assert updated_prof["major"] == "علم الحاسوب (Computer Science)"
    assert updated_prof["portfolio_url"] == "https://github.com/my-portfolio"
    assert "FastAPI" in updated_prof["skills"]

    # 3. تحديث المهارات الفردية PUT /users/me/skills
    skills_res = client.put(
        "/users/me/skills",
        json={"skills": "Python, React, TypeScript, TailwindCSS"},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert skills_res.status_code == 200
    skills_data = skills_res.json()
    assert "TypeScript" in skills_data["skills"]

def test_8_password_change_flow():
    """اختبار مسار تغيير كلمة المرور للمستخدم والتحقق من كلمة المرور القديمة ومنع التغيير غير المصرح به"""
    login_student = client.post(
        "/login",
        data={"username": f"student_{TS}@capstone.ps", "password": "pass1234Password!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    student_token = login_student.json()["access_token"]

    # 1. محاولة التغيير بكلمة مرور سابقة خاطئة -> 400 Bad Request
    wrong_pwd_res = client.put(
        "/users/me/password",
        json={"current_password": "WrongPassword123!", "new_password": "NewSecretPassword2026!"},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert wrong_pwd_res.status_code == 400
    assert "غير صحيحة" in wrong_pwd_res.text

    # 2. التغيير بكلمة المرور الصحيحة
    success_pwd_res = client.put(
        "/users/me/password",
        json={"current_password": "pass1234Password!", "new_password": "NewSecretPassword2026!"},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert success_pwd_res.status_code == 200

    # 3. محاولة تسجيل الدخول بكلمة المرور القديمة -> 401 Unauthorized
    old_login = client.post(
        "/login",
        data={"username": f"student_{TS}@capstone.ps", "password": "pass1234Password!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert old_login.status_code == 401

    # 4. تسجيل الدخول بكلمة المرور الجديدة بنجاح -> 200 OK
    new_login = client.post(
        "/login",
        data={"username": f"student_{TS}@capstone.ps", "password": "NewSecretPassword2026!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert new_login.status_code == 200
    assert "access_token" in new_login.json()


def test_9_production_secret_key_enforcement():
    """اختبار فرض الأمان الصارم في وضع الإنتاج: رفض التشغيل في حال غياب أو ضعف SECRET_KEY مع التحقق من دقة الرسائل التشخيصية"""
    import os, importlib
    import utils

    try:
        # 1. اختبار رفض التشغيل بمفتاح فارغ في وضع الإنتاج
        os.environ["ENVIRONMENT"] = "production"
        os.environ["SECRET_KEY"] = ""
        with pytest.raises(RuntimeError) as exc_empty:
            importlib.reload(utils)
        assert "missing or empty" in str(exc_empty.value)

        # 2. اختبار رفض المفتاح الافتراضي في وضع الإنتاج
        os.environ["SECRET_KEY"] = "your-super-secret-key-change-this-in-production"
        with pytest.raises(RuntimeError) as exc_default:
            importlib.reload(utils)
        assert "insecure/example" in str(exc_default.value)

        # 3. اختبار رفض مفتاح النموذج التوضيحي (.env.example) في وضع الإنتاج
        os.environ["SECRET_KEY"] = "capstone_secret_key_change_in_production"
        with pytest.raises(RuntimeError) as exc_example:
            importlib.reload(utils)
        assert "insecure/example" in str(exc_example.value)

        # 4. اختبار رفض المفاتيح القصيرة (< 32 خانة) في وضع الإنتاج والتأكد من إظهار الطول
        os.environ["SECRET_KEY"] = "weak_key_12345"
        with pytest.raises(RuntimeError) as exc_short:
            importlib.reload(utils)
        assert "length is 14 characters" in str(exc_short.value)

        # 5. اختبار تفعيل وضع الإنتاج عبر متغير RENDER=true
        os.environ.pop("ENVIRONMENT", None)
        os.environ["RENDER"] = "true"
        os.environ["SECRET_KEY"] = "short"
        with pytest.raises(RuntimeError):
            importlib.reload(utils)

        # 6. اختبار قبول مفتاح سري قوي (64 خانة) مع علامات اقتباس محيطة
        valid_strong_key = "a" * 64
        os.environ["SECRET_KEY"] = f'"{valid_strong_key}"'
        importlib.reload(utils)
        assert utils.SECRET_KEY == valid_strong_key

    finally:
        # إعادة البيئة لوضع التطوير المحلي دائماً
        os.environ.pop("ENVIRONMENT", None)
        os.environ.pop("RENDER", None)
        os.environ.pop("SECRET_KEY", None)
        importlib.reload(utils)
        assert utils.SECRET_KEY == utils.DEV_DEFAULT_SECRET

