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
from models import User, Project, Application, Message

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


def setup_test_project_with_members():
    supervisor = create_user("supervisor", "sup_msg")
    company = create_user("company", "comp_msg")
    student1 = create_user("student", "stud1_msg")
    student2 = create_user("student", "stud2_msg")
    outsider_student = create_user("student", "outsider_stud")
    outsider_company = create_user("company", "outsider_comp")
    admin = create_user("admin", "admin_msg")

    # 1. Company creates project
    p_resp = client.post("/projects/", json={
        "title": "Autonomous Drone Inspection",
        "description": "Industrial drone monitoring for energy grids.",
        "required_skills": "Computer Vision, Python, ROS",
        "max_members": 4
    }, headers={"Authorization": f"Bearer {company['token']}"})
    assert p_resp.status_code == 201
    proj_id = p_resp.json()["id"]

    # 2. Supervisor approves project
    a_resp = client.put(f"/projects/{proj_id}/status", json={
        "status": "approved",
        "seats": 3
    }, headers={"Authorization": f"Bearer {supervisor['token']}"})
    assert a_resp.status_code == 200

    # 3. Student 1 applies and gets approved by supervisor
    app1_resp = client.post("/applications/", json={
        "project_id": proj_id,
        "message": "Strong CV in robotics and OpenCV"
    }, headers={"Authorization": f"Bearer {student1['token']}"})
    assert app1_resp.status_code == 201
    app1_id = app1_resp.json()["id"]

    sup_app_resp = client.put(f"/applications/{app1_id}/status", json={
        "status": "academically_approved",
        "feedback": "Approved as lead developer"
    }, headers={"Authorization": f"Bearer {supervisor['token']}"})
    assert sup_app_resp.status_code == 200

    # 4. Student 2 applies and gets approved by supervisor
    app2_resp = client.post("/applications/", json={
        "project_id": proj_id,
        "message": "Embedded C++ background"
    }, headers={"Authorization": f"Bearer {student2['token']}"})
    assert app2_resp.status_code == 201
    app2_id = app2_resp.json()["id"]

    sup_app2_resp = client.put(f"/applications/{app2_id}/status", json={
        "status": "academically_approved",
        "feedback": "Approved as firmware engineer"
    }, headers={"Authorization": f"Bearer {supervisor['token']}"})
    assert sup_app2_resp.status_code == 200

    return {
        "proj_id": proj_id,
        "supervisor": supervisor,
        "company": company,
        "student1": student1,
        "student2": student2,
        "outsider_student": outsider_student,
        "outsider_company": outsider_company,
        "admin": admin
    }


def test_1_technical_chat_between_company_and_accepted_students():
    env = setup_test_project_with_members()
    proj_id = env["proj_id"]
    company = env["company"]
    student1 = env["student1"]

    # Company sends technical message
    send_resp = client.post(f"/projects/{proj_id}/messages", json={
        "text": "Welcome team! The drone SDK documentation has been shared in your repository.",
        "conversation_type": "company_student"
    }, headers={"Authorization": f"Bearer {company['token']}"})
    assert send_resp.status_code == 201, send_resp.text
    msg1 = send_resp.json()
    assert msg1["sender_id"] == company["id"]
    assert msg1["conversation_type"] == "company_student"

    # Student 1 reads technical messages
    get_resp = client.get(
        f"/projects/{proj_id}/messages?conversation_type=company_student",
        headers={"Authorization": f"Bearer {student1['token']}"}
    )
    assert get_resp.status_code == 200, get_resp.text
    msgs = get_resp.json()
    assert any(m["id"] == msg1["id"] for m in msgs)

    # Student 1 replies
    reply_resp = client.post(f"/projects/{proj_id}/messages", json={
        "text": "Thank you! We have verified the SDK and began environment setup.",
        "conversation_type": "company_student"
    }, headers={"Authorization": f"Bearer {student1['token']}"})
    assert reply_resp.status_code == 201, reply_resp.text
    reply_msg = reply_resp.json()
    assert reply_msg["sender_id"] == student1["id"]


def test_2_academic_supervision_channel_between_supervisor_and_students():
    env = setup_test_project_with_members()
    proj_id = env["proj_id"]
    supervisor = env["supervisor"]
    student1 = env["student1"]

    # Supervisor sends academic milestone notice
    sup_msg_resp = client.post(f"/projects/{proj_id}/messages", json={
        "text": "Academic Notice: Milestone 1 report deadline is next Tuesday at 11:59 PM.",
        "conversation_type": "supervisor_student"
    }, headers={"Authorization": f"Bearer {supervisor['token']}"})
    assert sup_msg_resp.status_code == 201, sup_msg_resp.text
    sup_msg = sup_msg_resp.json()
    assert sup_msg["conversation_type"] == "supervisor_student"

    # Student 1 reads academic messages
    get_resp = client.get(
        f"/projects/{proj_id}/messages?conversation_type=supervisor_student",
        headers={"Authorization": f"Bearer {student1['token']}"}
    )
    assert get_resp.status_code == 200, get_resp.text
    msgs = get_resp.json()
    assert any(m["id"] == sup_msg["id"] for m in msgs)

    # Student 1 sends question to supervisor
    reply_resp = client.post(f"/projects/{proj_id}/messages", json={
        "text": "Dr., should the report include the hardware component datasheets as an appendix?",
        "conversation_type": "supervisor_student"
    }, headers={"Authorization": f"Bearer {student1['token']}"})
    assert reply_resp.status_code == 201, reply_resp.text


def test_3_strict_company_isolation_from_academic_supervision():
    env = setup_test_project_with_members()
    proj_id = env["proj_id"]
    company = env["company"]
    supervisor = env["supervisor"]

    # Supervisor posts academic message
    client.post(f"/projects/{proj_id}/messages", json={
        "text": "Confidential Academic Grade Review",
        "conversation_type": "supervisor_student"
    }, headers={"Authorization": f"Bearer {supervisor['token']}"})

    # Company attempts to GET academic supervision messages -> 403 Forbidden
    comp_get_resp = client.get(
        f"/projects/{proj_id}/messages?conversation_type=supervisor_student",
        headers={"Authorization": f"Bearer {company['token']}"}
    )
    assert comp_get_resp.status_code == 403, comp_get_resp.text

    # Company attempts to POST into academic supervision channel -> 403 Forbidden
    comp_post_resp = client.post(f"/projects/{proj_id}/messages", json={
        "text": "Company trying to intervene in academic channel",
        "conversation_type": "supervisor_student"
    }, headers={"Authorization": f"Bearer {company['token']}"})
    assert comp_post_resp.status_code == 403, comp_post_resp.text


def test_4_cross_project_and_unrelated_user_isolation():
    env = setup_test_project_with_members()
    proj_id = env["proj_id"]
    outsider_student = env["outsider_student"]
    outsider_company = env["outsider_company"]

    # Unrelated student cannot read technical channel
    r1 = client.get(
        f"/projects/{proj_id}/messages?conversation_type=company_student",
        headers={"Authorization": f"Bearer {outsider_student['token']}"}
    )
    assert r1.status_code == 403, r1.text

    # Unrelated student cannot post in technical channel
    r2 = client.post(f"/projects/{proj_id}/messages", json={
        "text": "Intruding student",
        "conversation_type": "company_student"
    }, headers={"Authorization": f"Bearer {outsider_student['token']}"})
    assert r2.status_code == 403, r2.text

    # Unrelated student cannot read academic supervision channel
    r3 = client.get(
        f"/projects/{proj_id}/messages?conversation_type=supervisor_student",
        headers={"Authorization": f"Bearer {outsider_student['token']}"}
    )
    assert r3.status_code == 403, r3.text

    # Unrelated student cannot post in academic supervision channel
    r4 = client.post(f"/projects/{proj_id}/messages", json={
        "text": "Intruding student in supervision",
        "conversation_type": "supervisor_student"
    }, headers={"Authorization": f"Bearer {outsider_student['token']}"})
    assert r4.status_code == 403, r4.text

    # Unrelated company cannot read technical channel
    r5 = client.get(
        f"/projects/{proj_id}/messages?conversation_type=company_student",
        headers={"Authorization": f"Bearer {outsider_company['token']}"}
    )
    assert r5.status_code == 403, r5.text

    # Unrelated company cannot post in technical channel
    r6 = client.post(f"/projects/{proj_id}/messages", json={
        "text": "Intruding competitor company",
        "conversation_type": "company_student"
    }, headers={"Authorization": f"Bearer {outsider_company['token']}"})
    assert r6.status_code == 403, r6.text


def test_5_sender_id_spoofing_prevention():
    env = setup_test_project_with_members()
    proj_id = env["proj_id"]
    student1 = env["student1"]

    # Student 1 attempts to spoof sender_id as 9999 or supervisor ID
    spoof_resp = client.post(f"/projects/{proj_id}/messages", json={
        "text": "Spoof test message",
        "conversation_type": "company_student",
        "sender_id": 9999
    }, headers={"Authorization": f"Bearer {student1['token']}"})
    assert spoof_resp.status_code == 201, spoof_resp.text
    msg = spoof_resp.json()
    # The stored and returned sender_id MUST be student1's actual ID
    assert msg["sender_id"] == student1["id"]
    assert msg["sender_id"] != 9999


def test_6_historical_messages_backward_compatibility():
    env = setup_test_project_with_members()
    proj_id = env["proj_id"]
    company = env["company"]
    student1 = env["student1"]

    # Insert a message directly with conversation_type=None
    db = SessionLocal()
    try:
        legacy_msg = Message(
            project_id=proj_id,
            sender_id=company["id"],
            recipient_id=None,
            conversation_type=None,
            text="Legacy historical message from old database schema"
        )
        db.add(legacy_msg)
        db.commit()
        db.refresh(legacy_msg)
        legacy_id = legacy_msg.id
    finally:
        db.close()

    # Query company_student messages: legacy message must be returned safely
    resp = client.get(
        f"/projects/{proj_id}/messages?conversation_type=company_student",
        headers={"Authorization": f"Bearer {student1['token']}"}
    )
    assert resp.status_code == 200, resp.text
    msgs = resp.json()
    legacy_found = next((m for m in msgs if m["id"] == legacy_id), None)
    assert legacy_found is not None
    assert legacy_found["text"] == "Legacy historical message from old database schema"
    assert legacy_found["conversation_type"] == "company_student"


def test_7_message_deletion_security():
    env = setup_test_project_with_members()
    proj_id = env["proj_id"]
    company = env["company"]
    student1 = env["student1"]
    student2 = env["student2"]
    supervisor = env["supervisor"]
    outsider = env["outsider_student"]

    # Student 1 posts a message
    post_resp = client.post(f"/projects/{proj_id}/messages", json={
        "text": "Message to be tested for deletion",
        "conversation_type": "company_student"
    }, headers={"Authorization": f"Bearer {student1['token']}"})
    assert post_resp.status_code == 201
    msg_id = post_resp.json()["id"]

    # 1. Outsider student attempts to delete -> 403 Forbidden
    d1 = client.delete(
        f"/projects/{proj_id}/messages/{msg_id}",
        headers={"Authorization": f"Bearer {outsider['token']}"}
    )
    assert d1.status_code == 403, d1.text

    # 2. Peer student (student 2) attempts to delete -> 403 Forbidden
    d2 = client.delete(
        f"/projects/{proj_id}/messages/{msg_id}",
        headers={"Authorization": f"Bearer {student2['token']}"}
    )
    assert d2.status_code == 403, d2.text

    # 3. Message author (student 1) deletes own message -> 204 No Content
    # First: attempt to delete student 1's message using an unrelated project ID -> 404 Not Found (Cross-project delete prevention)
    d_cross = client.delete(
        f"/projects/{proj_id + 999}/messages/{msg_id}",
        headers={"Authorization": f"Bearer {student1['token']}"}
    )
    assert d_cross.status_code == 404, d_cross.text

    d3 = client.delete(
        f"/projects/{proj_id}/messages/{msg_id}",
        headers={"Authorization": f"Bearer {student1['token']}"}
    )
    assert d3.status_code == 204, d3.text

    # Verify message is permanently deleted from database
    db = SessionLocal()
    try:
        deleted_msg = db.query(Message).filter(Message.id == msg_id).first()
        assert deleted_msg is None
    finally:
        db.close()

    # 4. Supervisor deletes a message posted by company
    c_post = client.post(f"/projects/{proj_id}/messages", json={
        "text": "Notice posted by company",
        "conversation_type": "company_student"
    }, headers={"Authorization": f"Bearer {company['token']}"})
    assert c_post.status_code == 201
    c_msg_id = c_post.json()["id"]

    d_sup = client.delete(
        f"/projects/{proj_id}/messages/{c_msg_id}",
        headers={"Authorization": f"Bearer {supervisor['token']}"}
    )
    assert d_sup.status_code == 204, d_sup.text


def test_8_recipient_validation_and_unauthorized_recipient_prevention():
    env = setup_test_project_with_members()
    proj_id = env["proj_id"]
    supervisor = env["supervisor"]
    student1 = env["student1"]
    company = env["company"]
    outsider = env["outsider_student"]

    # 1. Non-existent recipient -> 404 Not Found
    r_not_found = client.post(f"/projects/{proj_id}/messages", json={
        "text": "Private message to non-existent user",
        "conversation_type": "company_student",
        "recipient_id": 99999
    }, headers={"Authorization": f"Bearer {student1['token']}"})
    assert r_not_found.status_code == 404, r_not_found.text

    # 2. Recipient is outsider not associated with the project -> 400 Bad Request
    r_unauthorized = client.post(f"/projects/{proj_id}/messages", json={
        "text": "Private message to outsider",
        "conversation_type": "company_student",
        "recipient_id": outsider["id"]
    }, headers={"Authorization": f"Bearer {student1['token']}"})
    assert r_unauthorized.status_code == 400, r_unauthorized.text

    # 3. Recipient is Company in academic supervision channel -> 400 Bad Request
    r_comp_in_sup = client.post(f"/projects/{proj_id}/messages", json={
        "text": "Attempting to include company in academic channel",
        "conversation_type": "supervisor_student",
        "recipient_id": company["id"]
    }, headers={"Authorization": f"Bearer {supervisor['token']}"})
    assert r_comp_in_sup.status_code == 400, r_comp_in_sup.text


def test_9_private_message_isolation_between_students_and_company_in_technical_channel():
    env = setup_test_project_with_members()
    proj_id = env["proj_id"]
    company = env["company"]
    student1 = env["student1"]
    student2 = env["student2"]

    # 1. Company sends private message to Student 1
    resp1 = client.post(f"/projects/{proj_id}/messages", json={
        "text": "CONFIDENTIAL: Private internship stipend offer for Student 1",
        "conversation_type": "company_student",
        "recipient_id": student1["id"]
    }, headers={"Authorization": f"Bearer {company['token']}"})
    assert resp1.status_code == 201
    msg1_id = resp1.json()["id"]

    # Student 1 fetches messages -> Sees msg1
    s1_get = client.get(
        f"/projects/{proj_id}/messages?conversation_type=company_student",
        headers={"Authorization": f"Bearer {student1['token']}"}
    )
    assert any(m["id"] == msg1_id for m in s1_get.json())

    # Company fetches messages -> Sees msg1 (since company is sender)
    comp_get = client.get(
        f"/projects/{proj_id}/messages?conversation_type=company_student",
        headers={"Authorization": f"Bearer {company['token']}"}
    )
    assert any(m["id"] == msg1_id for m in comp_get.json())

    # Student 2 fetches messages -> MUST NOT SEE msg1
    s2_get = client.get(
        f"/projects/{proj_id}/messages?conversation_type=company_student",
        headers={"Authorization": f"Bearer {student2['token']}"}
    )
    assert not any(m["id"] == msg1_id for m in s2_get.json())

    # 2. Student 1 sends private message to Student 2 (team peer)
    resp2 = client.post(f"/projects/{proj_id}/messages", json={
        "text": "Internal peer coordination between student 1 and student 2",
        "conversation_type": "company_student",
        "recipient_id": student2["id"]
    }, headers={"Authorization": f"Bearer {student1['token']}"})
    assert resp2.status_code == 201
    msg2_id = resp2.json()["id"]

    # Student 2 sees it
    s2_get2 = client.get(
        f"/projects/{proj_id}/messages?conversation_type=company_student",
        headers={"Authorization": f"Bearer {student2['token']}"}
    )
    assert any(m["id"] == msg2_id for m in s2_get2.json())

    # Student 1 sees it (sender)
    s1_get2 = client.get(
        f"/projects/{proj_id}/messages?conversation_type=company_student",
        headers={"Authorization": f"Bearer {student1['token']}"}
    )
    assert any(m["id"] == msg2_id for m in s1_get2.json())

    # Company MUST NOT see private peer message between students
    comp_get2 = client.get(
        f"/projects/{proj_id}/messages?conversation_type=company_student",
        headers={"Authorization": f"Bearer {company['token']}"}
    )
    assert not any(m["id"] == msg2_id for m in comp_get2.json())


def test_10_private_message_isolation_in_academic_supervision_channel():
    env = setup_test_project_with_members()
    proj_id = env["proj_id"]
    supervisor = env["supervisor"]
    student1 = env["student1"]
    student2 = env["student2"]
    company = env["company"]

    # 1. Supervisor sends private academic evaluation to Student 1
    resp_sup = client.post(f"/projects/{proj_id}/messages", json={
        "text": "PRIVATE GRADE: Your midterm milestone evaluation is 95/100",
        "conversation_type": "supervisor_student",
        "recipient_id": student1["id"]
    }, headers={"Authorization": f"Bearer {supervisor['token']}"})
    assert resp_sup.status_code == 201
    sup_msg_id = resp_sup.json()["id"]

    # Student 1 sees it
    s1_msgs = client.get(
        f"/projects/{proj_id}/messages?conversation_type=supervisor_student",
        headers={"Authorization": f"Bearer {student1['token']}"}
    )
    assert any(m["id"] == sup_msg_id for m in s1_msgs.json())

    # Student 2 MUST NOT see Student 1's private academic evaluation
    s2_msgs = client.get(
        f"/projects/{proj_id}/messages?conversation_type=supervisor_student",
        headers={"Authorization": f"Bearer {student2['token']}"}
    )
    assert not any(m["id"] == sup_msg_id for m in s2_msgs.json())

    # 2. Company attempts to access supervisor channel -> 403 Forbidden
    comp_attempt = client.get(
        f"/projects/{proj_id}/messages?conversation_type=supervisor_student",
        headers={"Authorization": f"Bearer {company['token']}"}
    )
    assert comp_attempt.status_code == 403


def test_11_unassigned_supervisor_cannot_access_project_conversations():
    env = setup_test_project_with_members()
    proj_id = env["proj_id"]
    assigned_supervisor = env["supervisor"]
    student1 = env["student1"]

    # Create another supervisor who is NOT assigned to this project
    other_supervisor = create_user("supervisor", "unassigned_sup")

    # 1. Other supervisor attempts to read supervisor_student -> 403 Forbidden
    r1 = client.get(
        f"/projects/{proj_id}/messages?conversation_type=supervisor_student",
        headers={"Authorization": f"Bearer {other_supervisor['token']}"}
    )
    assert r1.status_code == 403, r1.text

    # 2. Other supervisor attempts to post in supervisor_student -> 403 Forbidden
    r2 = client.post(f"/projects/{proj_id}/messages", json={
        "text": "Unassigned supervisor trying to message",
        "conversation_type": "supervisor_student"
    }, headers={"Authorization": f"Bearer {other_supervisor['token']}"})
    assert r2.status_code == 403, r2.text

    # 3. Other supervisor attempts to read company_student -> 403 Forbidden
    r3 = client.get(
        f"/projects/{proj_id}/messages?conversation_type=company_student",
        headers={"Authorization": f"Bearer {other_supervisor['token']}"}
    )
    assert r3.status_code == 403, r3.text

    # 4. Other supervisor attempts to post in company_student -> 403 Forbidden
    r4 = client.post(f"/projects/{proj_id}/messages", json={
        "text": "Unassigned supervisor trying to post in technical chat",
        "conversation_type": "company_student"
    }, headers={"Authorization": f"Bearer {other_supervisor['token']}"})
    assert r4.status_code == 403, r4.text

    # 5. Assigned supervisor posts message, other supervisor attempts to delete -> 403 Forbidden
    post_res = client.post(f"/projects/{proj_id}/messages", json={
        "text": "Official assigned supervisor message",
        "conversation_type": "supervisor_student"
    }, headers={"Authorization": f"Bearer {assigned_supervisor['token']}"})
    assert post_res.status_code == 201
    msg_id = post_res.json()["id"]

    del_res = client.delete(
        f"/projects/{proj_id}/messages/{msg_id}",
        headers={"Authorization": f"Bearer {other_supervisor['token']}"}
    )
    assert del_res.status_code == 403, del_res.text

