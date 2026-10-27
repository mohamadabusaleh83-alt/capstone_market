"""
Shared fixtures for the Capstone Market API QA suite.

Tests assert the *expected* (secure / correct) behaviour. A failing test is a
defect; its message says what actually happened. Every test talks to a live
local server over HTTP (httpx), never to production.

Run:  qa\\.venv\\Scripts\\python -m pytest qa/api_tests -q
"""
import json
import os
import uuid
from urllib.parse import urlparse

import httpx
import pytest

BASE_URL = os.environ.get("QA_API_URL", "http://127.0.0.1:8000")
if urlparse(BASE_URL).hostname not in ("127.0.0.1", "localhost"):
    raise SystemExit(f"QA suite refuses to run against a non-local API: {BASE_URL}")

PASSWORD = "QaTest#2026"
ACCOUNTS = {
    "student": "qa_student@test.local",
    "student2": "qa_student2@test.local",
    "company": "qa_company@test.local",
    "company2": "qa_company2@test.local",
    "supervisor": "qa_supervisor@test.local",
    "admin": "qa_admin@test.local",
}
RUN = uuid.uuid4().hex[:6]
HERE = os.path.dirname(os.path.abspath(__file__))

# Rows collected by the permission-matrix test, written out at session end.
MATRIX_ROWS = []


def pytest_sessionfinish(session, exitstatus):
    if not MATRIX_ROWS:
        return
    with open(os.path.join(HERE, "permission_matrix.json"), "w", encoding="utf-8") as f:
        json.dump(MATRIX_ROWS, f, ensure_ascii=False, indent=2)


class Api:
    """Thin role-aware wrapper: api.call("student", "GET", "/me")."""

    def __init__(self, client, tokens):
        self.client = client
        self.tokens = tokens

    def headers(self, role):
        if role in (None, "anon"):
            return {}
        return {"Authorization": f"Bearer {self.tokens[role]}"}

    def call(self, role, method, url, **kw):
        extra = kw.pop("headers", {})
        r = self.client.request(method, url, headers={**self.headers(role), **extra}, **kw)
        # tokens are revoked by /logout and password changes (I-19); the matrix logs every role out,
        # so transparently re-login once. Authenticated roles never expect a 401 otherwise.
        if r.status_code == 401 and role not in (None, "anon") and "Authorization" not in extra:
            self.relogin(role)
            r = self.client.request(method, url, headers={**self.headers(role), **extra}, **kw)
        return r

    def relogin(self, role):
        r = self.client.post("/login", data={"username": ACCOUNTS[role], "password": PASSWORD})
        if r.status_code == 200:
            self.tokens[role] = r.json()["access_token"]

    def me(self, role):
        return self.call(role, "GET", "/me").json()

    # ---------- resource factories (all through the public API) ----------
    def make_project(self, owner="company", status="approved", max_members=4, **extra):
        body = {
            "title": extra.pop("title", f"QA-{RUN} project {uuid.uuid4().hex[:4]}"),
            "description": "QA test project",
            "required_skills": extra.pop("required_skills", "Python, SQL"),
            "max_members": max_members,
            **extra,
        }
        r = self.call(owner, "POST", "/projects/", json=body)
        assert r.status_code == 201, f"setup: create project failed {r.status_code} {r.text}"
        pid = r.json()["id"]
        if status != r.json()["status"]:
            r2 = self.call("supervisor", "PUT", f"/projects/{pid}/status", json={"status": status})
            assert r2.status_code == 200, f"setup: set status failed {r2.text}"
        return pid

    def make_application(self, student, pid, message="QA application"):
        r = self.call(student, "POST", "/applications/", json={"project_id": pid, "message": message})
        assert r.status_code == 201, f"setup: apply failed {r.status_code} {r.text}"
        return r.json()["id"]

    def set_app_status(self, role, app_id, status, feedback=None):
        body = {"status": status}
        if feedback:
            body["feedback"] = feedback
        return self.call(role, "PUT", f"/applications/{app_id}/status", json=body)

    def make_member(self, student, pid, company="company"):
        """Full official flow: apply -> company nominates -> supervisor approves."""
        app_id = self.make_application(student, pid)
        assert self.set_app_status(company, app_id, "accepted").status_code == 200
        assert self.set_app_status("supervisor", app_id, "academically_approved").status_code == 200
        return app_id

    def make_report(self, student, pid, title=None):
        r = self.call(student, "POST", "/reports/", json={
            "project_id": pid, "title": title or f"QA-{RUN} report", "file_url": "https://example.test/r.pdf"})
        assert r.status_code == 201, f"setup: report failed {r.status_code} {r.text}"
        return r.json()["id"]

    def notifications(self, role):
        r = self.call(role, "GET", "/notifications")
        assert r.status_code == 200
        return r.json()

    def project(self, pid, role="admin"):
        return self.call(role, "GET", f"/projects/{pid}").json()


@pytest.fixture(scope="session")
def client():
    with httpx.Client(base_url=BASE_URL, timeout=60) as c:
        try:
            c.get("/")
        except httpx.HTTPError as e:
            pytest.exit(f"API not reachable at {BASE_URL}: {e}")
        yield c


@pytest.fixture(scope="session")
def tokens(client):
    out = {}
    for role, email in ACCOUNTS.items():
        r = client.post("/login", data={"username": email, "password": PASSWORD})
        if r.status_code != 200:
            pytest.exit(f"Cannot log in {email} ({r.status_code}). Run qa/seed.py first.")
        out[role] = r.json()["access_token"]
    return out


@pytest.fixture(scope="session")
def api(client, tokens):
    return Api(client, tokens)


@pytest.fixture(scope="session")
def ids(api):
    return {role: api.me(role)["id"] for role in ACCOUNTS}
