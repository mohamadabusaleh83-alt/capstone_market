import os
import sys
import uuid
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["SECRET_KEY"] = "ee6defc0a760f3d9d40b0bbbe19dc6312a14e9c704f67c51483321527ef9a589"
os.environ["DEV_INSECURE_KEY"] = "1"

from fastapi.testclient import TestClient
from main import app
from database import engine, Base, SessionLocal
from models import User, Project, Application, StudentProfile

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

def test_1_supervisor_approves_with_seats_and_blocks_duplicate_decision():
    supervisor = create_user("supervisor", "sup_p2")
    company = create_user("company", "comp_p2")
    
    # Company creates a project
    proj_resp = client.post("/projects/", json={
        "title": "Smart IoT Fleet Tracker",
        "description": "Hardware and AI tracking project for supply chains.",
        "required_skills": "Python, React, Docker",
        "max_members": 4
    }, headers={"Authorization": f"Bearer {company['token']}"})
    assert proj_resp.status_code == 201, proj_resp.text
    proj_id = proj_resp.json()["id"]
    
    # Doctor approves project and sets seats to 3
    appr_resp = client.put(f"/projects/{proj_id}/status", json={
        "status": "approved",
        "feedback": "Project proposal meets academic standards with 3 seats approved.",
        "seats": 3
    }, headers={"Authorization": f"Bearer {supervisor['token']}"})
    assert appr_resp.status_code == 200, appr_resp.text
    appr_data = appr_resp.json()
    assert appr_data["status"] == "approved"
    assert appr_data["seats"] == 3
    assert appr_data["total_seats"] == 3
    assert appr_data["remaining_seats"] == 3
    assert appr_data["accepted_students_count"] == 0
    assert appr_data["supervisor_id"] == supervisor["id"]
    assert appr_data["decided_at"] is not None
    
    # Duplicate approval must return 400
    dup_appr = client.put(f"/projects/{proj_id}/status", json={
        "status": "approved"
    }, headers={"Authorization": f"Bearer {supervisor['token']}"})
    assert dup_appr.status_code == 400
    detail = dup_appr.json()["detail"].lower()
    assert "معتمد" in dup_appr.json()["detail"] or "already approved" in detail
    
    # Attempting to reject an already approved project must return 400
    dup_rej = client.put(f"/projects/{proj_id}/status", json={
        "status": "rejected",
        "feedback": "Changed my mind"
    }, headers={"Authorization": f"Bearer {supervisor['token']}"})
    assert dup_rej.status_code == 400
    assert "معتمد" in dup_rej.json()["detail"] or "already been approved" in dup_rej.json()["detail"].lower()

def test_2_supervisor_rejection_stores_feedback_and_blocks_duplicate():
    supervisor = create_user("supervisor", "sup_p2_rej")
    company = create_user("company", "comp_p2_rej")
    
    # Company creates a project
    proj_resp = client.post("/projects/", json={
        "title": "Unfeasible Blockchain Space Travel",
        "description": "Sending data to Mars using crypto nodes.",
        "required_skills": "Rust, Solidity",
        "max_members": 3
    }, headers={"Authorization": f"Bearer {company['token']}"})
    assert proj_resp.status_code == 201, proj_resp.text
    proj_id = proj_resp.json()["id"]
    
    # Doctor rejects project with feedback
    rej_reason = "Proposal lacks scientific foundation and hardware feasibility."
    rej_resp = client.put(f"/projects/{proj_id}/status", json={
        "status": "rejected",
        "feedback": rej_reason
    }, headers={"Authorization": f"Bearer {supervisor['token']}"})
    assert rej_resp.status_code == 200, rej_resp.text
    rej_data = rej_resp.json()
    assert rej_data["status"] == "rejected"
    assert rej_data["supervisor_feedback"] == rej_reason
    assert rej_data["rejected_at"] is not None or rej_data["decided_at"] is not None
    
    # Duplicate rejection must return 400
    dup_rej = client.put(f"/projects/{proj_id}/status", json={
        "status": "rejected",
        "feedback": "Another rejection"
    }, headers={"Authorization": f"Bearer {supervisor['token']}"})
    assert dup_rej.status_code == 400
    assert "مرفوض" in dup_rej.json()["detail"] or "already" in dup_rej.json()["detail"].lower()

def test_3_full_application_lifecycle_seats_and_capacity_enforcement():
    supervisor = create_user("supervisor", "sup_p2_seats")
    company = create_user("company", "comp_p2_seats")
    student1 = create_user("student", "stud1_p2")
    student2 = create_user("student", "stud2_p2")
    student3 = create_user("student", "stud3_p2")
    
    # Company creates project
    proj_resp = client.post("/projects/", json={
        "title": "Autonomous Drone Delivery",
        "description": "Navigation and computer vision algorithms.",
        "required_skills": "Python, OpenCV",
        "max_members": 4
    }, headers={"Authorization": f"Bearer {company['token']}"})
    assert proj_resp.status_code == 201, proj_resp.text
    proj_id = proj_resp.json()["id"]
    
    # Doctor approves with exactly 2 seats
    appr_resp = client.put(f"/projects/{proj_id}/status", json={
        "status": "approved",
        "feedback": "Approved with 2 seats quota.",
        "seats": 2
    }, headers={"Authorization": f"Bearer {supervisor['token']}"})
    assert appr_resp.status_code == 200
    assert appr_resp.json()["total_seats"] == 2
    
    # Student 1 applies
    app1_resp = client.post("/applications/", json={
        "project_id": proj_id,
        "message": "Senior CSE student specializing in computer vision."
    }, headers={"Authorization": f"Bearer {student1['token']}"})
    assert app1_resp.status_code == 201, app1_resp.text
    app1_id = app1_resp.json()["id"]
    
    # Duplicate apply from Student 1 must return 400
    dup_apply = client.post("/applications/", json={
        "project_id": proj_id,
        "message": "Applying again"
    }, headers={"Authorization": f"Bearer {student1['token']}"})
    assert dup_apply.status_code == 400
    assert "مسبقاً" in dup_apply.json()["detail"] or "already" in dup_apply.json()["detail"].lower()
    
    # Student 2 applies
    app2_resp = client.post("/applications/", json={
        "project_id": proj_id,
        "message": "AI student experienced with OpenCV."
    }, headers={"Authorization": f"Bearer {student2['token']}"})
    assert app2_resp.status_code == 201
    app2_id = app2_resp.json()["id"]
    
    # Verify company CANNOT see applications
    comp_apps = client.get("/applications/", headers={"Authorization": f"Bearer {company['token']}"})
    assert comp_apps.status_code == 200
    assert comp_apps.json() == []
    
    comp_proj_apps = client.get(f"/projects/{proj_id}/applications", headers={"Authorization": f"Bearer {company['token']}"})
    assert comp_proj_apps.status_code == 403
    
    # Verify supervisor SEES the applications
    sup_apps = client.get(f"/projects/{proj_id}/applications", headers={"Authorization": f"Bearer {supervisor['token']}"})
    assert sup_apps.status_code == 200
    sup_app_list = sup_apps.json()
    assert len(sup_app_list) == 2
    assert any(a["id"] == app1_id for a in sup_app_list)
    assert any(a["id"] == app2_id for a in sup_app_list)
    
    # Supervisor accepts Student 1
    acc1_resp = client.put(f"/applications/{app1_id}/status", json={
        "status": "academically_approved",
        "feedback": "Accepted based on academic record."
    }, headers={"Authorization": f"Bearer {supervisor['token']}"})
    assert acc1_resp.status_code == 200, acc1_resp.text
    
    # Check remaining seats is now 1
    p_check1 = client.get(f"/projects/{proj_id}", headers={"Authorization": f"Bearer {student1['token']}"}).json()
    assert p_check1["accepted_students_count"] == 1
    assert p_check1["remaining_seats"] == 1
    
    # Supervisor accepts Student 2 (fills all 2 seats)
    acc2_resp = client.put(f"/applications/{app2_id}/status", json={
        "status": "accepted",
        "feedback": "Accepted to team."
    }, headers={"Authorization": f"Bearer {supervisor['token']}"})
    assert acc2_resp.status_code == 200, acc2_resp.text
    
    # Check remaining seats is now 0 (full)
    p_check2 = client.get(f"/projects/{proj_id}", headers={"Authorization": f"Bearer {student1['token']}"}).json()
    assert p_check2["accepted_students_count"] == 2
    assert p_check2["remaining_seats"] == 0
    
    # Student 3 tries to apply when seats are full -> 400 Bad Request
    full_apply = client.post("/applications/", json={
        "project_id": proj_id,
        "message": "I want to apply late"
    }, headers={"Authorization": f"Bearer {student3['token']}"})
    assert full_apply.status_code == 400
    assert "full" in full_apply.json()["detail"].lower() or "المقاعد" in full_apply.json()["detail"]
    
    # Supervisor expands seats capacity to 3 via PUT /projects/{id}/seats
    seat_update = client.put(f"/projects/{proj_id}/seats", json={
        "seats": 3
    }, headers={"Authorization": f"Bearer {supervisor['token']}"})
    assert seat_update.status_code == 200, seat_update.text
    assert seat_update.json()["seats"] == 3
    assert seat_update.json()["remaining_seats"] == 1
    
    # Now Student 3 applies -> succeeds!
    app3_resp = client.post("/applications/", json={
        "project_id": proj_id,
        "message": "Applying now that seat was added"
    }, headers={"Authorization": f"Bearer {student3['token']}"})
    assert app3_resp.status_code == 201

def test_4_cv_access_strictly_supervisor_and_student():
    student = create_user("student", "cv_stud_p2")
    supervisor = create_user("supervisor", "cv_sup_p2")
    company = create_user("company", "cv_comp_p2")
    
    # Create StudentProfile with cv_key in DB for student
    db = SessionLocal()
    try:
        profile = StudentProfile(
            user_id=student["id"],
            cv_key="local:test_cv_key.pdf"
        )
        db.add(profile)
        db.commit()
    finally:
        db.close()
        
    # Student accesses own CV
    s_cv = client.get(f"/users/{student['id']}/cv", headers={"Authorization": f"Bearer {student['token']}"})
    assert s_cv.status_code == 200
    assert "url" in s_cv.json()
    
    # Supervisor accesses student CV -> 200 OK
    sup_cv = client.get(f"/users/{student['id']}/cv", headers={"Authorization": f"Bearer {supervisor['token']}"})
    assert sup_cv.status_code == 200
    assert "url" in sup_cv.json()
    
    # Company attempts to access student CV -> 403 Forbidden
    comp_cv = client.get(f"/users/{student['id']}/cv", headers={"Authorization": f"Bearer {company['token']}"})
    assert comp_cv.status_code == 403
