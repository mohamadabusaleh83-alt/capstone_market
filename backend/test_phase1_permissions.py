import pytest
import time
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
import models
import utils

client = TestClient(app)
TS = int(time.time())

@pytest.fixture(scope="module")
def setup_users_and_projects():
    db = SessionLocal()
    # Create test accounts
    sup_email = f"sup_p1_{TS}@capstone.ps"
    comp_email = f"comp_p1_{TS}@capstone.ps"
    stud_email = f"stud_p1_{TS}@capstone.ps"
    pwd = "TestPassword2026!"
    
    # Register supervisor directly in DB for testing
    sup = models.User(
        full_name="د. المشرف الأكاديمي",
        email=sup_email,
        password_hash=utils.hash_password(pwd),
        role="supervisor"
    )
    comp = models.User(
        full_name="شركة التقنية للتطوير",
        email=comp_email,
        password_hash=utils.hash_password(pwd),
        role="partner"
    )
    stud = models.User(
        full_name="طالب اختباري",
        email=stud_email,
        password_hash=utils.hash_password(pwd),
        role="student"
    )
    db.add_all([sup, comp, stud])
    db.commit()
    db.refresh(sup)
    db.refresh(comp)
    db.refresh(stud)

    # Student profile
    profile = models.StudentProfile(
        user_id=stud.id,
        major="أنظمة المعلومات الحاسوبية (CIS)",
        bio="طالب متميز",
        cv_key="private/cvs/test_cv.pdf"
    )
    db.add(profile)

    # Project created by company
    proj = models.Project(
        title=f"مشروع تخرج للذكاء الاصطناعي {TS}",
        description="تطبيق ذكاء اصطناعي لمعالجة البيانات الضخمة",
        required_skills="Python, FastAPI, React",
        status="pending",
        max_members=2,
        created_by=comp.id
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)

    tokens = {}
    for role, email in [("supervisor", sup_email), ("company", comp_email), ("student", stud_email)]:
        token = utils.create_access_token({"sub": email, "user_id": sup.id if role == "supervisor" else (comp.id if role == "company" else stud.id), "role": role, "tv": 0})
        tokens[role] = {"Authorization": f"Bearer {token}"}

    yield {
        "sup": sup,
        "comp": comp,
        "stud": stud,
        "proj": proj,
        "tokens": tokens,
        "db": db
    }
    db.close()


def test_1_student_and_company_cannot_approve_or_reject_project(setup_users_and_projects):
    """التحقق من منع الطالب والشركة من اعتماد أو رفض المشروع (403 Forbidden)"""
    tokens = setup_users_and_projects["tokens"]
    proj_id = setup_users_and_projects["proj"].id

    # Student attempt
    res_stud = client.put(f"/projects/{proj_id}/status", json={"status": "approved"}, headers=tokens["student"])
    assert res_stud.status_code == 403, f"Expected 403 for student, got {res_stud.status_code}"

    # Company attempt
    res_comp = client.put(f"/projects/{proj_id}/status", json={"status": "approved"}, headers=tokens["company"])
    assert res_comp.status_code == 403, f"Expected 403 for company, got {res_comp.status_code}"


def test_2_supervisor_approves_project_and_blocks_duplicate_decision(setup_users_and_projects):
    """المشرف يعتمد المشروع ويتم منع تكرار اتخاذ القرار لاحقاً"""
    tokens = setup_users_and_projects["tokens"]
    proj_id = setup_users_and_projects["proj"].id

    # First approval by supervisor
    res = client.put(
        f"/projects/{proj_id}/status",
        json={"status": "approved", "feedback": "مشروع متميز ومعتمد أكاديمياً", "seats": 3},
        headers=tokens["supervisor"]
    )
    assert res.status_code == 200, f"Approval failed: {res.text}"
    data = res.json()
    assert data["status"] == "approved"
    assert data["max_members"] == 3
    assert data["total_seats"] == 3

    # Duplicate approval attempt must be blocked (400)
    dup_res = client.put(f"/projects/{proj_id}/status", json={"status": "approved"}, headers=tokens["supervisor"])
    assert dup_res.status_code == 400
    assert "معتمد بالفعل" in dup_res.json()["detail"]

    # Changing approved to rejected must also be blocked (400)
    change_res = client.put(f"/projects/{proj_id}/status", json={"status": "rejected"}, headers=tokens["supervisor"])
    assert change_res.status_code == 400


def test_3_supervisor_rejection_and_blocks_duplicate(setup_users_and_projects):
    """المشرف يرفض مشروعاً جديداً ويتم حفظ السبب وتاريخ الرفض ومنع التكرار"""
    tokens = setup_users_and_projects["tokens"]
    db = setup_users_and_projects["db"]
    comp = setup_users_and_projects["comp"]

    # Create a second project to test rejection
    proj2 = models.Project(
        title=f"مشروع مرفوض للتجربة {TS}",
        description="وصف المشروع",
        status="pending",
        max_members=2,
        created_by=comp.id
    )
    db.add(proj2)
    db.commit()
    db.refresh(proj2)

    # Reject by supervisor
    rej_res = client.put(
        f"/projects/{proj2.id}/status",
        json={"status": "rejected", "feedback": "الفكرة مكررة وبحاجة لإعادة صياغة شاملة"},
        headers=tokens["supervisor"]
    )
    assert rej_res.status_code == 200
    rej_data = rej_res.json()
    assert rej_data["status"] == "rejected"
    assert "إعادة صياغة" in rej_data["supervisor_feedback"]
    assert rej_data["rejected_at"] is not None

    # Duplicate rejection must be blocked (400)
    dup_rej = client.put(f"/projects/{proj2.id}/status", json={"status": "rejected"}, headers=tokens["supervisor"])
    assert dup_rej.status_code == 400
    assert "مرفوض بالفعل" in dup_rej.json()["detail"]


def test_4_seats_management_permissions(setup_users_and_projects):
    """الدكتور فقط يحدد المقاعد، والطالب والشركة يمنعان من التعديل"""
    tokens = setup_users_and_projects["tokens"]
    proj_id = setup_users_and_projects["proj"].id

    # Doctor sets seats
    res = client.put(f"/projects/{proj_id}/seats", json={"seats": 4}, headers=tokens["supervisor"])
    assert res.status_code == 200
    assert res.json()["max_members"] == 4
    assert res.json()["seats"] == 4

    # Negative or zero seats rejected
    res_zero = client.put(f"/projects/{proj_id}/seats", json={"seats": 0}, headers=tokens["supervisor"])
    assert res_zero.status_code in [400, 422]

    # Student cannot set seats
    res_stud = client.put(f"/projects/{proj_id}/seats", json={"seats": 5}, headers=tokens["student"])
    assert res_stud.status_code == 403

    # Company cannot set seats via /seats
    res_comp = client.put(f"/projects/{proj_id}/seats", json={"seats": 5}, headers=tokens["company"])
    assert res_comp.status_code == 403

    # Company cannot update seats via /projects/{id}
    res_comp_upd = client.put(f"/projects/{proj_id}", json={"max_members": 5}, headers=tokens["company"])
    assert res_comp_upd.status_code in [403, 422]


def test_5_company_cannot_view_or_manage_student_applications(setup_users_and_projects):
    """الشركة لا تستطيع رؤية طلبات الطلاب أو السيرة الذاتية أو اتخاذ قرارات بشأنها"""
    tokens = setup_users_and_projects["tokens"]
    proj_id = setup_users_and_projects["proj"].id
    stud = setup_users_and_projects["stud"]

    # Student applies
    apply_res = client.post(
        "/applications/",
        json={"project_id": proj_id, "message": "أرغب بالانضمام للمشروع"},
        headers=tokens["student"]
    )
    assert apply_res.status_code in [200, 201]
    app_id = apply_res.json()["id"]

    # 1. Company cannot see applications via /applications/ (gets empty list)
    comp_apps = client.get("/applications/", headers=tokens["company"])
    assert comp_apps.status_code == 200
    assert comp_apps.json() == []

    # 2. Company cannot see project applications via /projects/{id}/applications (403)
    comp_proj_apps = client.get(f"/projects/{proj_id}/applications", headers=tokens["company"])
    assert comp_proj_apps.status_code == 403

    # 3. Company cannot view student CV via /users/{id}/cv (403)
    comp_cv = client.get(f"/users/{stud.id}/cv", headers=tokens["company"])
    assert comp_cv.status_code == 403

    # 4. Supervisor CAN view student applications and CV
    sup_proj_apps = client.get(f"/projects/{proj_id}/applications", headers=tokens["supervisor"])
    assert sup_proj_apps.status_code == 200
    assert len(sup_proj_apps.json()) >= 1

    sup_cv = client.get(f"/users/{stud.id}/cv", headers=tokens["supervisor"])
    assert sup_cv.status_code == 200
    assert "url" in sup_cv.json()

    # 5. Company cannot update application status (403)
    comp_decide = client.put(f"/applications/{app_id}/status", json={"status": "accepted"}, headers=tokens["company"])
    assert comp_decide.status_code == 403


def test_6_supervisor_accepts_application_and_enforces_capacity(setup_users_and_projects):
    """المشرف يعتمد طلب الطالب ويتم فحص السعة ومنع التجاوز"""
    tokens = setup_users_and_projects["tokens"]
    proj_id = setup_users_and_projects["proj"].id
    db = setup_users_and_projects["db"]

    # Set seats to 1 to test capacity enforcement
    client.put(f"/projects/{proj_id}/seats", json={"seats": 1}, headers=tokens["supervisor"])

    # Find the application
    app_item = db.query(models.Application).filter(models.Application.project_id == proj_id).first()

    # Supervisor approves application
    app_res = client.put(
        f"/applications/{app_item.id}/status",
        json={"status": "academically_approved", "feedback": "مقبول في الفريق رسمياً"},
        headers=tokens["supervisor"]
    )
    assert app_res.status_code == 200
    assert app_res.json()["status"] == "academically_approved"

    # Now project has 1/1 accepted student (seats full)
    # Another student tries to apply -> must be rejected with 400 (seats full)
    stud2_email = f"stud2_p1_{TS}@capstone.ps"
    stud2_res = client.post("/users/", json={"full_name": "طالب ثاني", "email": stud2_email, "password": "Password123!", "role": "student"})
    assert stud2_res.status_code in [200, 201]
    stud2_id = stud2_res.json()["id"]
    token2 = utils.create_access_token({"sub": stud2_email, "user_id": stud2_id, "role": "student", "tv": 0})
    stud2_auth = {"Authorization": f"Bearer {token2}"}

    full_res = client.post("/applications/", json={"project_id": proj_id, "message": "طلب إضافي"}, headers=stud2_auth)
    assert full_res.status_code == 400
    assert "مكتمل المقاعد" in full_res.json()["detail"]
