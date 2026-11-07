import os
import sys
import time
import uuid
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ["DATABASE_URL"] = os.environ.get("DATABASE_URL", "sqlite:///./test.db")
os.environ["SECRET_KEY"] = os.environ.get("SECRET_KEY", "ee6defc0a760f3d9d40b0bbbe19dc6312a14e9c704f67c51483321527ef9a589")
os.environ["DEV_INSECURE_KEY"] = "1"

from main import app
from database import SessionLocal
import models
import utils

client = TestClient(app)


def get_supervisor_auth():
    """تسجيل دخول المشرف الأكاديمي الرسمي أو إنشاؤه"""
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
    return {"Authorization": f"Bearer {login_res.json()['access_token']}"}


def test_phase6_complete_multi_role_integrated_journey():
    """
    اختبار المسار التكاملي الشامل للمرحلة السادسة (Phase 6):
    - دور الطالب (Student): تسجيل -> تجهيز السيرة الذاتية -> تصفح المشاريع -> التقديم -> المحادثة -> الإشعارات -> الخروج.
    - دور الشركة (Company): تسجيل -> طرح التحدي -> التدقيق الأكاديمي -> إدارة التعاون -> المحادثة التقنية -> الإشعارات -> الخروج.
    - دور المشرف الأكاديمي (Supervisor): دخول -> مراجعة التحديات -> اعتماد المشروع وتحديد المقاعد -> مراجعة الطلبات -> اعتماد الطلاب -> التوجيه الأكاديمي -> الإشعارات -> الخروج.
    - التحقق من كافة ضوابط الصلاحيات RBAC، وعزل البيانات، ومنع IDOR، وتحديث المقاعد، وإبطال التوكن عند الخروج.
    """
    ts = f"{int(time.time())}_{uuid.uuid4().hex[:6]}"
    sup_headers = get_supervisor_auth()

    # =========================================================================
    # 1. رحلة الشركة (Company): التسجيل وطرح التحدي
    # =========================================================================
    comp_email = f"company_p6_{ts}@capstone.ps"
    comp_pwd = "CompanySecurePass2026!"
    reg_comp = client.post("/users/", json={
        "full_name": f"شركة الابتكارات التقنية {ts}",
        "email": comp_email,
        "password": comp_pwd,
        "role": "partner"
    })
    assert reg_comp.status_code in [200, 201]

    login_comp = client.post(
        "/login",
        data={"username": comp_email, "password": comp_pwd},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert login_comp.status_code == 200
    comp_token = login_comp.json()["access_token"]
    comp_headers = {"Authorization": f"Bearer {comp_token}"}

    # تحديث الملف التعريفي للشركة
    comp_profile = client.put("/users/me/profile", json={
        "phone": "+970599887766",
        "bio": "شركة ناشئة متخصصة في الذكاء الاصطناعي وإنترنت الأشياء",
        "skills": "AI, Cloud, IoT, FastAPI, Next.js"
    }, headers=comp_headers)
    assert comp_profile.status_code == 200
    assert comp_profile.json()["phone"] == "+970599887766"

    # طرح فرصة / تحدي تخرج جديد
    create_proj = client.post("/projects/", json={
        "title": f"منصة إنترنت الأشياء الذكية للمصانع {ts}",
        "description": "نظام ذكي متكامل لربط حساسات المصانع السحابية وتحليل بيانات الاستهلاك والتنبؤ بالأعطال",
        "required_skills": "Python, MQTT, React, Docker",
        "max_members": 2
    }, headers=comp_headers)
    assert create_proj.status_code in [200, 201]
    proj_data = create_proj.json()
    proj_id = proj_data["id"]
    assert proj_data["status"] == "pending"

    # التحقق من منع الشركة من اعتماد مشروعها بنفسها (403)
    comp_self_appr = client.put(f"/projects/{proj_id}/status", json={"status": "approved"}, headers=comp_headers)
    assert comp_self_appr.status_code == 403

    # =========================================================================
    # 2. رحلة المشرف (Supervisor): المراجعة والاعتماد الأكاديمي
    # =========================================================================
    # المشرف يراجع المشاريع المعلقة ويعتمد المشروع ويحدد 2 مقاعد
    sup_appr = client.put(f"/projects/{proj_id}/status", json={
        "status": "approved",
        "seats": 2,
        "feedback": "مشروع ذو قيمة علمية وصناعية ممتازة، تمت الموافقة عليه"
    }, headers=sup_headers)
    assert sup_appr.status_code == 200
    appr_json = sup_appr.json()
    assert appr_json["status"] == "approved"
    assert appr_json["max_members"] == 2

    # منع اتخاذ قرار مكرر على المشروع بعد حسمه (400)
    dup_proj_decision = client.put(f"/projects/{proj_id}/status", json={"status": "approved"}, headers=sup_headers)
    assert dup_proj_decision.status_code == 400

    # الشركة تتلقى إشعاراً باعتماد مشروعها
    comp_notifs = client.get("/notifications/", headers=comp_headers)
    assert comp_notifs.status_code == 200
    assert any(str(proj_id) in str(n.get("project_id", "")) or "مشروع" in n.get("title", "") for n in comp_notifs.json())

    # =========================================================================
    # 3. رحلة الطالب الأول (Student 1): التسجيل وتجهيز CV والتقديم
    # =========================================================================
    stud1_email = f"student1_p6_{ts}@capstone.ps"
    stud1_pwd = "StudentSecurePass2026!"
    reg_stud1 = client.post("/users/", json={
        "full_name": f"أحمد الطالب الأول {ts}",
        "email": stud1_email,
        "password": stud1_pwd,
        "role": "student"
    })
    assert reg_stud1.status_code in [200, 201]

    login_stud1 = client.post(
        "/login",
        data={"username": stud1_email, "password": stud1_pwd},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert login_stud1.status_code == 200
    stud1_token = login_stud1.json()["access_token"]
    stud1_headers = {"Authorization": f"Bearer {stud1_token}"}

    # تجهيز الملف الشخصي والسيرة الذاتية للطالب
    stud1_cv = client.put("/users/me/profile", json={
        "phone": "+970599123456",
        "major": "أنظمة المعلومات الحاسوبية (CIS)",
        "course": "مشاريع تخرج 2",
        "bio": "طالب شغوف بتطوير الأنظمة الموزعة والواجهات الخلفية",
        "portfolio_url": "https://github.com/student1-portfolio",
        "skills": "Python, FastAPI, Docker, SQL"
    }, headers=stud1_headers)
    assert stud1_cv.status_code == 200

    # الطالب يتصفح المشاريع المعتمدة ويجد المشروع
    projects_list = client.get("/projects/", headers=stud1_headers)
    assert projects_list.status_code == 200
    matched_projs = [p for p in projects_list.json() if p["id"] == proj_id]
    assert len(matched_projs) > 0
    assert matched_projs[0]["status"] == "approved"

    # تقديم الطلب
    app1_res = client.post("/applications/", json={
        "project_id": proj_id,
        "message": "لدي خبرة قوية في بروتوكول MQTT ومعالجة البيانات السحابية"
    }, headers=stud1_headers)
    assert app1_res.status_code in [200, 201]
    app1_id = app1_res.json()["id"]

    # منع التقديم المكرر للطالب على نفس المشروع (400)
    dup_app1 = client.post("/applications/", json={
        "project_id": proj_id,
        "message": "محاولة تقديم ثانية لنفس المشروع"
    }, headers=stud1_headers)
    assert dup_app1.status_code == 400

    # محاولة الطالب المراسلة قبل القبول ترفض (403)
    pre_msg = client.post(f"/projects/{proj_id}/messages", json={
        "text": "مرحبا قبل القبول",
        "conversation_type": "company_student"
    }, headers=stud1_headers)
    assert pre_msg.status_code == 403

    # =========================================================================
    # 4. تدقيق الصلاحيات على الطلب والاعتماد الأكاديمي
    # =========================================================================
    # منع الشركة من قبول أو تغيير حالة الطلب (صلاحية المشرف حصرياً -> 403)
    comp_mod_app = client.put(f"/applications/{app1_id}/status", json={"status": "accepted"}, headers=comp_headers)
    assert comp_mod_app.status_code == 403

    # المشرف يراجع الطلب والسيرة الذاتية ويعتمده أكاديمياً
    sup_appr_app = client.put(f"/applications/{app1_id}/status", json={
        "status": "academically_approved",
        "feedback": "مؤهلاتك متميزة وتم اعتماد انضمامك للمشروع"
    }, headers=sup_headers)
    assert sup_appr_app.status_code == 200

    # الطالب الأول يتلقى إشعاراً بقبول طلبه
    stud1_notifs = client.get("/notifications/", headers=stud1_headers)
    assert stud1_notifs.status_code == 200
    assert any("قبول" in n.get("title", "") or "اعتماد" in n.get("title", "") or "approved" in n.get("title_en", "").lower() for n in stud1_notifs.json())

    # =========================================================================
    # 5. التراسل التقني والأكاديمي والتحقق من العزل والخصوصية
    # =========================================================================
    # الشركة تراسل الطالب في القناة التقنية (company_student)
    comp_msg = client.post(f"/projects/{proj_id}/messages", json={
        "text": f"مرحباً بك في المشروع التقني {ts}",
        "conversation_type": "company_student"
    }, headers=comp_headers)
    assert comp_msg.status_code in [200, 201]

    # الطالب يقرأ رسالة الشركة ويرد عليها
    stud1_msgs = client.get(f"/projects/{proj_id}/messages?conversation_type=company_student", headers=stud1_headers)
    assert stud1_msgs.status_code == 200
    assert any(f"مرحباً بك في المشروع التقني {ts}" in m["text"] for m in stud1_msgs.json())

    stud1_reply = client.post(f"/projects/{proj_id}/messages", json={
        "text": f"شكراً جزيلاً وجاهز للبدء {ts}",
        "conversation_type": "company_student"
    }, headers=stud1_headers)
    assert stud1_reply.status_code in [200, 201]

    # المشرف يرسل توجيهاً في قناة الإشراف الأكاديمي (supervisor_student)
    sup_msg = client.post(f"/projects/{proj_id}/messages", json={
        "text": f"توجيه إشرافي أكاديمي: يرجى تسليم خطة العمل {ts}",
        "conversation_type": "supervisor_student"
    }, headers=sup_headers)
    assert sup_msg.status_code in [200, 201]

    # الطالب يقرأ توجيه المشرف الأكاديمي
    stud1_sup_msgs = client.get(f"/projects/{proj_id}/messages?conversation_type=supervisor_student", headers=stud1_headers)
    assert stud1_sup_msgs.status_code == 200
    assert any(f"توجيه إشرافي أكاديمي: يرجى تسليم خطة العمل {ts}" in m["text"] for m in stud1_sup_msgs.json())

    # الشركة ممنوعة تماماً من قراءة قناة الإشراف الأكاديمي (403 Forbidden)
    comp_sup_read = client.get(f"/projects/{proj_id}/messages?conversation_type=supervisor_student", headers=comp_headers)
    assert comp_sup_read.status_code == 403

    # =========================================================================
    # 6. انضمام الطالب الثاني واستيفاء السعة ومنع التقديم بعد الامتلاء
    # =========================================================================
    stud2_email = f"student2_p6_{ts}@capstone.ps"
    stud2_pwd = "Student2SecurePass2026!"
    client.post("/users/", json={
        "full_name": f"سارة الطالبة الثانية {ts}",
        "email": stud2_email,
        "password": stud2_pwd,
        "role": "student"
    })
    login_stud2 = client.post("/login", data={"username": stud2_email, "password": stud2_pwd})
    stud2_headers = {"Authorization": f"Bearer {login_stud2.json()['access_token']}"}

    # تقديم الطالب الثاني واعتماده
    app2_res = client.post("/applications/", json={
        "project_id": proj_id,
        "message": "مهتمة بتطوير واجهات المستخدم React والتكامل مع السحابة"
    }, headers=stud2_headers)
    assert app2_res.status_code in [200, 201]
    app2_id = app2_res.json()["id"]

    sup_appr_app2 = client.put(f"/applications/{app2_id}/status", json={
        "status": "academically_approved",
        "feedback": "تم اعتمادك كعضو ثانٍ مكتمل المقاعد"
    }, headers=sup_headers)
    assert sup_appr_app2.status_code == 200

    # الآن المشروع أصبح مكتمل المقاعد (2 مقاعد ممتلئة من أصل 2)
    # طالب ثالث يحاول التقديم -> يرفض 400 بسبب اكتمال السعة
    stud3_email = f"student3_p6_{ts}@capstone.ps"
    client.post("/users/", json={
        "full_name": f"خالد الطالب الثالث {ts}",
        "email": stud3_email,
        "password": "Password123!",
        "role": "student"
    })
    login_stud3 = client.post("/login", data={"username": stud3_email, "password": "Password123!"})
    stud3_headers = {"Authorization": f"Bearer {login_stud3.json()['access_token']}"}

    full_capacity_app = client.post("/applications/", json={
        "project_id": proj_id,
        "message": "أرغب بالانضمام للمشروع"
    }, headers=stud3_headers)
    assert full_capacity_app.status_code == 400
    assert "مقاعد" in full_capacity_app.json().get("detail", "") or "full" in full_capacity_app.json().get("detail", "").lower()

    # =========================================================================
    # 7. قراءة الإشعارات وتحديث حالتها
    # =========================================================================
    unread_res = client.get("/notifications/unread-count", headers=stud1_headers)
    assert unread_res.status_code == 200
    initial_unread = unread_res.json().get("unread_count", 0)

    # تحديد قراءة الكل
    mark_all = client.put("/notifications/read-all", headers=stud1_headers)
    assert mark_all.status_code == 200

    after_read = client.get("/notifications/unread-count", headers=stud1_headers)
    assert after_read.status_code == 200
    assert after_read.json().get("unread_count", 0) == 0

    # =========================================================================
    # 8. تسجيل الخروج وإبطال التوكنات للأدوار الثلاثة
    # =========================================================================
    # خروج الطالب الأول
    logout_stud1 = client.post("/logout", headers=stud1_headers)
    assert logout_stud1.status_code == 200

    # محاولة استخدام التوكن القديم للطالب بعد الخروج ترفض (401)
    revoked_stud_check = client.get("/users/me/profile", headers=stud1_headers)
    assert revoked_stud_check.status_code == 401

    # خروج الشركة
    logout_comp = client.post("/logout", headers=comp_headers)
    assert logout_comp.status_code == 200

    revoked_comp_check = client.get("/users/me/profile", headers=comp_headers)
    assert revoked_comp_check.status_code == 401

    # خروج المشرف
    logout_sup = client.post("/logout", headers=sup_headers)
    assert logout_sup.status_code == 200

    revoked_sup_check = client.get("/me", headers=sup_headers)
    assert revoked_sup_check.status_code == 401
