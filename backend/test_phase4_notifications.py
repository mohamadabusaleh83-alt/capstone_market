import os
import sys
import uuid
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["SECRET_KEY"] = "ee6defc0a760f3d9d40b0bbbe19dc6312a14e9c704f67c51483321527ef9a589"
os.environ["DEV_INSECURE_KEY"] = "1"

from fastapi.testclient import TestClient
from main import app, create_notification
from database import engine, Base, SessionLocal
from models import User, Project, Application, Notification, Message

import utils

Base.metadata.create_all(bind=engine)
client = TestClient(app)

def create_user(role: str, email_prefix: str) -> dict:
    uid = uuid.uuid4().hex[:6]
    email = f"{email_prefix}_{uid}@univ.edu"
    pwd = "Password123!"
    full_name = f"Test {role.capitalize()} {uid}"
    
    db = SessionLocal()
    try:
        user = User(
            full_name=full_name,
            email=email,
            password_hash=utils.hash_password(pwd),
            role=role
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        token = utils.create_access_token({
            "sub": email,
            "user_id": user.id,
            "role": role,
            "tv": 0
        })
        return {"id": user.id, "email": email, "token": token, "role": role, "name": full_name}
    finally:
        db.close()


def setup_notification_test_environment():
    supervisor = create_user("supervisor", "sup_notif")
    company = create_user("company", "comp_notif")
    student1 = create_user("student", "stud1_notif")
    student2 = create_user("student", "stud2_notif")
    admin = create_user("admin", "admin_notif")

    # 1. Company creates a project
    p_resp = client.post("/projects/", json={
        "title": "Smart Solar Energy Microgrid",
        "description": "IoT and AI energy management system.",
        "required_skills": "Python, Embedded C, React",
        "max_members": 3
    }, headers={"Authorization": f"Bearer {company['token']}"})
    assert p_resp.status_code == 201
    proj_id = p_resp.json()["id"]

    # 2. Supervisor approves project and sets seats to 3
    appr_resp = client.put(f"/projects/{proj_id}/status", json={
        "status": "approved",
        "feedback": "Project proposal approved.",
        "seats": 3
    }, headers={"Authorization": f"Bearer {supervisor['token']}"})
    assert appr_resp.status_code == 200

    return {
        "proj_id": proj_id,
        "supervisor": supervisor,
        "company": company,
        "student1": student1,
        "student2": student2,
        "admin": admin
    }


def test_1_notification_on_application_submission_sent_to_supervisor_only():
    env = setup_notification_test_environment()
    proj_id = env["proj_id"]
    supervisor = env["supervisor"]
    company = env["company"]
    student1 = env["student1"]

    # Student 1 applies to project
    app_resp = client.post("/applications/", json={
        "project_id": proj_id,
        "message": "Applying with renewable energy background."
    }, headers={"Authorization": f"Bearer {student1['token']}"})
    assert app_resp.status_code == 201

    # 1. Supervisor receives notification
    sup_notifs = client.get("/notifications", headers={"Authorization": f"Bearer {supervisor['token']}"})
    assert sup_notifs.status_code == 200
    n_list = sup_notifs.json()
    assert any(n["project_id"] == proj_id and ("طلب انضمام" in n["title"] or "application" in n["title"].lower()) for n in n_list)

    # 2. Company MUST NOT receive student application notification
    comp_notifs = client.get("/notifications", headers={"Authorization": f"Bearer {company['token']}"})
    assert comp_notifs.status_code == 200
    comp_list = comp_notifs.json()
    assert not any("طلب انضمام" in n["title"] or "application" in n["title"].lower() for n in comp_list)


def test_2_notification_on_application_approval_and_rejection():
    env = setup_notification_test_environment()
    proj_id = env["proj_id"]
    supervisor = env["supervisor"]
    student1 = env["student1"]
    student2 = env["student2"]

    # Student 1 applies
    app1 = client.post("/applications/", json={
        "project_id": proj_id,
        "message": "Student 1 applying."
    }, headers={"Authorization": f"Bearer {student1['token']}"}).json()

    # Supervisor approves Student 1
    client.put(f"/applications/{app1['id']}/status", json={
        "status": "academically_approved",
        "feedback": "Welcome to the team!"
    }, headers={"Authorization": f"Bearer {supervisor['token']}"})

    # Student 1 gets approval notification
    s1_notifs = client.get("/notifications", headers={"Authorization": f"Bearer {student1['token']}"}).json()
    assert any("الاعتماد الأكاديمي" in n["title"] or "approved" in n["title"].lower() for n in s1_notifs)

    # Student 2 applies
    app2 = client.post("/applications/", json={
        "project_id": proj_id,
        "message": "Student 2 applying."
    }, headers={"Authorization": f"Bearer {student2['token']}"}).json()

    # Supervisor rejects Student 2
    client.put(f"/applications/{app2['id']}/status", json={
        "status": "rejected",
        "feedback": "Skills do not match hardware requirements."
    }, headers={"Authorization": f"Bearer {supervisor['token']}"})

    # Student 2 gets rejection notification with feedback
    s2_notifs = client.get("/notifications", headers={"Authorization": f"Bearer {student2['token']}"}).json()
    rejection_n = next((n for n in s2_notifs if "رفض" in n["message"] or "rejected" in n["message"].lower()), None)
    assert rejection_n is not None
    assert "hardware requirements" in rejection_n["message"]


def test_3_notification_on_project_decision():
    supervisor = create_user("supervisor", "sup_dec")
    company = create_user("company", "comp_dec")

    # Company creates project
    p = client.post("/projects/", json={
        "title": "Smart Irrigation Robot",
        "description": "Robotics project for agriculture.",
        "required_skills": "ROS, Python",
        "max_members": 4
    }, headers={"Authorization": f"Bearer {company['token']}"}).json()

    # Supervisor approves project
    client.put(f"/projects/{p['id']}/status", json={
        "status": "approved",
        "feedback": "Project approved.",
        "seats": 4
    }, headers={"Authorization": f"Bearer {supervisor['token']}"})

    # Company receives project approval notification
    c_notifs = client.get("/notifications", headers={"Authorization": f"Bearer {company['token']}"}).json()
    assert any("اعتماد" in n["title"] or "approved" in n["title"].lower() for n in c_notifs)


def test_4_notification_on_messages_and_private_message_isolation():
    env = setup_notification_test_environment()
    proj_id = env["proj_id"]
    supervisor = env["supervisor"]
    company = env["company"]
    student1 = env["student1"]
    student2 = env["student2"]

    # Student 1 is approved member
    app1 = client.post("/applications/", json={
        "project_id": proj_id,
        "message": "Student 1 member"
    }, headers={"Authorization": f"Bearer {student1['token']}"}).json()
    client.put(f"/applications/{app1['id']}/status", json={
        "status": "academically_approved"
    }, headers={"Authorization": f"Bearer {supervisor['token']}"})

    # Clear notifications by marking all read
    client.patch("/notifications/read-all", headers={"Authorization": f"Bearer {student2['token']}"})

    # Company sends private message to Student 1
    client.post(f"/projects/{proj_id}/messages", json={
        "text": "Private direct message to student 1 only",
        "conversation_type": "company_student",
        "recipient_id": student1["id"]
    }, headers={"Authorization": f"Bearer {company['token']}"})

    # Student 1 receives notification
    s1_notifs = client.get("/notifications", headers={"Authorization": f"Bearer {student1['token']}"}).json()
    assert any("Private direct message" in n["message"] for n in s1_notifs)

    # Student 2 MUST NOT receive notification for private message between company and student 1
    s2_notifs = client.get("/notifications", headers={"Authorization": f"Bearer {student2['token']}"}).json()
    assert not any("Private direct message" in n["message"] for n in s2_notifs)


def test_5_strict_company_isolation_from_academic_notifications():
    env = setup_notification_test_environment()
    company = env["company"]

    # Directly attempting to create academic supervision or application notification for company is blocked
    db = SessionLocal()
    try:
        blocked_notif = create_notification(
            db=db,
            user_id=company["id"],
            title="Academic Secret Review",
            message="Supervision confidential note",
            notification_type="academic_supervision"
        )
        assert blocked_notif is None
    finally:
        db.close()


def test_6_cross_user_isolation_and_unread_count_api():
    student1 = create_user("student", "iso_s1")
    student2 = create_user("student", "iso_s2")

    db = SessionLocal()
    try:
        n1 = create_notification(
            db=db,
            user_id=student1["id"],
            title="Student 1 Private Alert",
            message="Alert content 1"
        )
        n1_id = n1.id
        n2 = create_notification(
            db=db,
            user_id=student2["id"],
            title="Student 2 Private Alert",
            message="Alert content 2"
        )
        n2_id = n2.id
    finally:
        db.close()

    # 1. User isolation: Student 1 only sees n1, Student 2 only sees n2
    s1_resp = client.get("/notifications", headers={"Authorization": f"Bearer {student1['token']}"})
    assert s1_resp.status_code == 200
    s1_ids = [n["id"] for n in s1_resp.json()]
    assert n1_id in s1_ids
    assert n2_id not in s1_ids

    # 2. Unread count endpoint
    c1 = client.get("/notifications/unread-count", headers={"Authorization": f"Bearer {student1['token']}"})
    assert c1.status_code == 200
    assert c1.json()["unread_count"] >= 1

    # 3. Student 2 cannot mark Student 1's notification as read (403 Forbidden)
    patch_forbidden = client.patch(f"/notifications/{n1_id}/read", headers={"Authorization": f"Bearer {student2['token']}"})
    assert patch_forbidden.status_code == 403, patch_forbidden.text

    # 4. Student 2 cannot delete Student 1's notification (403 Forbidden)
    del_forbidden = client.delete(f"/notifications/{n1_id}", headers={"Authorization": f"Bearer {student2['token']}"})
    assert del_forbidden.status_code == 403, del_forbidden.text

    # 5. Student 1 marks own notification as read
    patch_ok = client.patch(f"/notifications/{n1_id}/read", headers={"Authorization": f"Bearer {student1['token']}"})
    assert patch_ok.status_code == 200
    assert patch_ok.json()["is_read"] is True

    # 6. Student 1 deletes own notification (204 No Content)
    del_ok = client.delete(f"/notifications/{n1_id}", headers={"Authorization": f"Bearer {student1['token']}"})
    assert del_ok.status_code == 204

    # 7. Verification from DB that notification was deleted
    del_check = client.delete(f"/notifications/{n1_id}", headers={"Authorization": f"Bearer {student1['token']}"})
    assert del_check.status_code == 404


def test_7_notification_deduplication():
    student = create_user("student", "dedup_s")

    db = SessionLocal()
    try:
        # First creation
        notif1 = create_notification(
            db=db,
            user_id=student["id"],
            title="Duplicate Test Title",
            message="Content for duplicate test",
            project_id=10
        )
        assert notif1 is not None

        # Second creation with identical parameters
        notif2 = create_notification(
            db=db,
            user_id=student["id"],
            title="Duplicate Test Title",
            message="Content for duplicate test",
            project_id=10
        )
        # Deduplication returns existing unread notification without creating a new row
        assert notif2.id == notif1.id

        # Total unread notifications for this title remains 1
        count = db.query(Notification).filter(
            Notification.user_id == student["id"],
            Notification.title == "Duplicate Test Title"
        ).count()
        assert count == 1
    finally:
        db.close()
