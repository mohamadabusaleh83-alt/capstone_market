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
    """اختبار مسارات تسجيل الحسابات، تسجيل الدخول وتوليد الـ JWT، والتحقق من /me"""
    users_to_test = [
        {"full_name": f"طالب اختباري {TS}", "email": f"student_{TS}@capstone.ps", "password": "pass1234Password!", "role": "student"},
        {"full_name": f"شركة النور التجريبية {TS}", "email": f"company_{TS}@capstone.ps", "password": "pass1234Password!", "role": "partner"},
        {"full_name": f"د. مشرف اختباري {TS}", "email": f"supervisor_{TS}@capstone.ps", "password": "pass1234Password!", "role": "supervisor"}
    ]

    tokens = {}

    for u in users_to_test:
        # 1. POST /users/
        reg_res = client.post("/users/", json=u)
        assert reg_res.status_code in [200, 201], f"Failed to register user: {reg_res.text}"
        data = reg_res.json()
        assert data["email"] == u["email"]
        assert "id" in data

        # 2. POST /login (OAuth2 form-data)
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

        # 3. GET /me (Bearer Auth)
        me_res = client.get("/me", headers={"Authorization": f"Bearer {token_data['access_token']}"})
        assert me_res.status_code == 200, f"Failed GET /me: {me_res.text}"
        me_data = me_res.json()
        assert me_data["email"] == u["email"]
        assert me_data["role"] == u["role"]

def test_2_projects_creation_and_approval_flow():
    """اختبار إنشاء مشروع جديد، وتغيير حالته من قبل المشرف الأكاديمي (Pending -> Approved)"""
    # تسجيل دخول الشركة
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

    # 3. اعتماد المشروع من المشرف PUT /projects/{id}/status
    login_supervisor = client.post(
        "/login",
        data={"username": f"supervisor_{TS}@capstone.ps", "password": "pass1234Password!"},
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

    # التحقق من أن غير المشرف لا يمكنه اعتماد المشاريع (RBAC Check)
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
    """اختبار تقديم الطلب، قبوله من صاحب المشروع، والتحقق من حساب المقاعد المتبقية"""
    # 1. جلب المشروع المعتمد
    list_res = client.get("/projects/")
    approved_projects = [p for p in list_res.json() if p["status"] == "approved"]
    assert len(approved_projects) > 0, "No approved project found"
    target_project = approved_projects[0]
    project_id = target_project["id"]

    # 2. تقديم طلب من الطالب POST /applications/
    login_student = client.post(
        "/login",
        data={"username": f"student_{TS}@capstone.ps", "password": "pass1234Password!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    student_token = login_student.json()["access_token"]

    app_res = client.post(
        "/applications/",
        json={"project_id": project_id, "message": "أرغب بالانضمام كمطور واجهات وأنظمة خلفية"},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert app_res.status_code in [200, 201], f"Application submission failed: {app_res.text}"
    app_data = app_res.json()
    app_id = app_data["id"]
    assert app_data["status"] == "pending"

    # 3. استعراض الطلبات من قبل الشركة / المشرف GET /applications/
    login_company = client.post(
        "/login",
        data={"username": f"company_{TS}@capstone.ps", "password": "pass1234Password!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    company_token = login_company.json()["access_token"]

    apps_list_res = client.get("/applications/", headers={"Authorization": f"Bearer {company_token}"})
    assert apps_list_res.status_code == 200
    all_apps = apps_list_res.json()
    assert any(a["id"] == app_id for a in all_apps)

    # 4. قبول الطلب PUT /applications/{id}/status
    accept_res = client.put(
        f"/applications/{app_id}/status",
        json={"status": "accepted"},
        headers={"Authorization": f"Bearer {company_token}"}
    )
    assert accept_res.status_code == 200, f"Failed to accept application: {accept_res.text}"
    accepted_data = accept_res.json()
    assert accepted_data["status"] == "accepted"

    # 5. التحقق من تحديث عداد المقاعد والمشتركين
    proj_check_res = client.get("/projects/")
    updated_p = next(p for p in proj_check_res.json() if p["id"] == project_id)
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

    # 1. إرسال رسالة من الطالب POST /projects/{id}/messages
    msg_res = client.post(
        f"/projects/{project_id}/messages",
        json={"text": f"مرحباً بالجميع، تم الانتهاء من إعداد بيئة التطوير المحلية {TS}"},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert msg_res.status_code in [200, 201], f"Send message failed: {msg_res.text}"
    msg_data = msg_res.json()
    assert "id" in msg_data
    assert msg_data["text"] == f"مرحباً بالجميع، تم الانتهاء من إعداد بيئة التطوير المحلية {TS}"

    # 2. إرسال رد من المشرف
    login_supervisor = client.post(
        "/login",
        data={"username": f"supervisor_{TS}@capstone.ps", "password": "pass1234Password!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    supervisor_token = login_supervisor.json()["access_token"]

    reply_res = client.post(
        f"/projects/{project_id}/messages",
        json={"text": "ممتاز جداً! بالتوفيق في تسليم التقرير الأول."},
        headers={"Authorization": f"Bearer {supervisor_token}"}
    )
    assert reply_res.status_code in [200, 201]

    # 3. جلب سجل الرسائل GET /projects/{id}/messages
    get_msgs_res = client.get(
        f"/projects/{project_id}/messages",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert get_msgs_res.status_code == 200
    messages = get_msgs_res.json()
    assert len(messages) >= 2
    assert any(m["id"] == msg_data["id"] for m in messages)

def test_5_notifications_generation_and_mark_as_read():
    """اختبار توليد الإشعارات عند الأحداث وقراءتها وتحديث حالتها"""
    login_student = client.post(
        "/login",
        data={"username": f"student_{TS}@capstone.ps", "password": "pass1234Password!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    student_token = login_student.json()["access_token"]

    # 1. جلب الإشعارات GET /notifications
    notifs_res = client.get("/notifications", headers={"Authorization": f"Bearer {student_token}"})
    assert notifs_res.status_code == 200
    notifs = notifs_res.json()
    assert isinstance(notifs, list)

    if len(notifs) > 0:
        first_notif_id = notifs[0]["id"]

        # 2. قراءة إشعار فردي PUT /notifications/{id}/read
        read_res = client.put(f"/notifications/{first_notif_id}/read", headers={"Authorization": f"Bearer {student_token}"})
        assert read_res.status_code == 200

        # 3. قراءة الكل PUT /notifications/read-all
        read_all_res = client.put("/notifications/read-all", headers={"Authorization": f"Bearer {student_token}"})
        assert read_all_res.status_code == 200

        # التحقق من أن كافة الإشعارات أصبحت مقروءة
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

