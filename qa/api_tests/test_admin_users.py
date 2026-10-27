"""Admin user management (I-47)."""
import uuid

import pytest

from conftest import PASSWORD


def new_email():
    return f"qa_admin_made_{uuid.uuid4().hex[:6]}@example.com"


@pytest.mark.parametrize("role", ["anon", "student", "company", "supervisor"])
def test_admin_endpoints_are_admin_only(api, role, ids):
    expected = 401 if role == "anon" else 403
    assert api.call(role, "GET", "/admin/users").status_code == expected
    assert api.call(role, "POST", "/admin/users", json={"full_name": "x y", "email": new_email(),
                                                       "password": "Strong#123", "role": "supervisor"}).status_code in (expected, 422)
    assert api.call(role, "PATCH", f"/admin/users/{ids['student2']}", json={"is_active": False}).status_code == expected
    assert api.call(role, "DELETE", f"/admin/users/{ids['student2']}").status_code == expected


def test_admin_lists_and_searches_users(api):
    r = api.call("admin", "GET", "/admin/users?q=qa_student&limit=5")
    assert r.status_code == 200 and int(r.headers["x-total-count"]) >= 2
    assert all("qa_student" in u["email"] for u in r.json())


def test_admin_creates_supervisor_who_can_log_in(api, client):
    email = new_email()
    r = api.call("admin", "POST", "/admin/users", json={"full_name": "QA Made Supervisor", "email": email,
                                                       "password": "Strong#123", "role": "supervisor"})
    assert r.status_code == 201 and r.json()["role"] == "supervisor"
    assert client.post("/login", data={"username": email, "password": "Strong#123"}).status_code == 200


def test_admin_cannot_create_students_or_weak_passwords(api):
    assert api.call("admin", "POST", "/admin/users", json={"full_name": "QA X", "email": new_email(),
                                                          "password": "Strong#123", "role": "student"}).status_code == 400
    assert api.call("admin", "POST", "/admin/users", json={"full_name": "QA X", "email": new_email(),
                                                          "password": "short", "role": "admin"}).status_code == 422


def test_disable_blocks_login_and_existing_tokens_then_enable(api, client):
    email = new_email()
    uid = api.call("admin", "POST", "/admin/users", json={"full_name": "QA Disable Me", "email": email,
                                                         "password": "Strong#123", "role": "supervisor"}).json()["id"]
    tok = client.post("/login", data={"username": email, "password": "Strong#123"}).json()["access_token"]
    assert api.call("admin", "PATCH", f"/admin/users/{uid}", json={"is_active": False}).json()["is_active"] is False
    assert client.get("/me", headers={"Authorization": f"Bearer {tok}"}).status_code == 401
    assert client.post("/login", data={"username": email, "password": "Strong#123"}).status_code == 403
    api.call("admin", "PATCH", f"/admin/users/{uid}", json={"is_active": True})
    assert client.post("/login", data={"username": email, "password": "Strong#123"}).status_code == 200


def test_reset_password_and_delete(api, client):
    email = new_email()
    uid = api.call("admin", "POST", "/admin/users", json={"full_name": "QA Reset Me", "email": email,
                                                         "password": "Strong#123", "role": "supervisor"}).json()["id"]
    assert api.call("admin", "POST", f"/admin/users/{uid}/reset-password", json={"new_password": "NewStrong#456"}).status_code == 200
    assert client.post("/login", data={"username": email, "password": "Strong#123"}).status_code == 401
    assert client.post("/login", data={"username": email, "password": "NewStrong#456"}).status_code == 200
    assert api.call("admin", "DELETE", f"/admin/users/{uid}").status_code == 204
    assert client.post("/login", data={"username": email, "password": "NewStrong#456"}).status_code == 401


def test_delete_student_keeps_projects_and_cleans_their_rows(api, client):
    r = client.post("/users/", json={"full_name": "QA Delete Student", "email": new_email(), "password": PASSWORD})
    sid, email = r.json()["id"], r.json()["email"]
    pid = api.make_project("company")
    tok = client.post("/login", data={"username": email, "password": PASSWORD}).json()["access_token"]
    client.post("/applications/", json={"project_id": pid}, headers={"Authorization": f"Bearer {tok}"})
    assert api.call("admin", "DELETE", f"/admin/users/{sid}").status_code == 204
    assert api.call("company", "GET", f"/projects/{pid}").status_code == 200
    assert all(a["student_id"] != sid for a in api.call("admin", "GET", "/applications/").json())


def test_admin_cannot_disable_or_delete_self(api, ids):
    assert api.call("admin", "PATCH", f"/admin/users/{ids['admin']}", json={"is_active": False}).status_code == 400
    assert api.call("admin", "DELETE", f"/admin/users/{ids['admin']}").status_code == 400


# ---------------- I-30: favorites and settings live on the server ----------------

def test_favorites_round_trip_and_isolation(api):
    pid = api.make_project("company")
    assert api.call("student", "PUT", f"/users/me/favorites/{pid}").status_code == 204
    assert api.call("student", "PUT", f"/users/me/favorites/{pid}").status_code == 204   # idempotent
    assert pid in api.call("student", "GET", "/users/me/favorites").json()
    assert pid not in api.call("student2", "GET", "/users/me/favorites").json()
    hidden = api.make_project("company2", status="pending")
    assert api.call("student", "PUT", f"/users/me/favorites/{hidden}").status_code == 404
    assert api.call("student", "DELETE", f"/users/me/favorites/{pid}").status_code == 204
    assert pid not in api.call("student", "GET", "/users/me/favorites").json()
    assert api.call("anon", "GET", "/users/me/favorites").status_code == 401


def test_settings_round_trip(api):
    assert api.call("student2", "GET", "/users/me/settings").json() == {"email_alerts": True, "milestone_reminders": True, "partnership_offers": True}
    body = {"email_alerts": False, "milestone_reminders": True, "partnership_offers": False}
    assert api.call("student2", "PUT", "/users/me/settings", json=body).json() == body
    assert api.call("student2", "GET", "/users/me/settings").json() == body
