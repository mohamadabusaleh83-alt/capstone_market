"""Reports, user directory/profile/skills, CV upload."""
import io
import os

import pytest

BACKEND_UPLOADS = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend", "uploads"))


# ---------------- reports ----------------

def test_member_submits_and_supervisor_reviews(api):
    pid = api.make_project("company")
    api.make_member("student", pid)
    rep = api.make_report("student", pid)
    r = api.call("supervisor", "PUT", f"/reports/{rep}/status",
                 json={"status": "needs_changes", "supervisor_feedback": "fix ERD", "grade": "70"})
    assert r.status_code == 200 and r.json()["status"] == "needs_changes" and r.json()["grade"] == "70"


def test_non_member_cannot_submit_report(api):
    pid = api.make_project("company")
    r = api.call("student2", "POST", "/reports/", json={"project_id": pid, "title": "spam"})
    assert r.status_code == 403, f"student with no relation to project filed a report ({r.status_code})"


def test_report_needs_title(api):
    pid = api.make_project("company")
    api.make_member("student", pid)
    assert api.call("student", "POST", "/reports/", json={"project_id": pid}).status_code == 422
    r = api.call("student", "POST", "/reports/", json={"project_id": pid, "title": "  "})
    assert r.status_code in (400, 422), "blank report title accepted"


def test_report_file_url_must_be_http(api):
    pid = api.make_project("company")
    api.make_member("student", pid)
    r = api.call("student", "POST", "/reports/", json={"project_id": pid, "title": "x",
                                                       "file_url": "javascript:alert(document.cookie)"})
    assert r.status_code in (400, 422), "javascript: URL stored as report link (rendered as <a href> in ReportsPage)"


def test_report_unknown_project_404(api):
    assert api.call("student", "POST", "/reports/", json={"project_id": 99999999, "title": "x"}).status_code == 404


def test_student_cannot_see_other_students_reports(api, ids):
    """Reports from a project the viewer is not a member of stay hidden. (Phase 2: earlier tests make
    the two QA students teammates, and teammates now legitimately see each other's reports, so the
    check is scoped to this project instead of "student2 sees nothing of student".)"""
    pid = api.make_project("company")
    api.make_member("student", pid)
    rep = api.make_report("student", pid)
    rows = api.call("student2", "GET", f"/reports/?student_id={ids['student']}").json()
    assert rep not in [r["id"] for r in rows]
    assert api.call("student2", "GET", f"/reports/{rep}/file").status_code == 403


def test_teammates_see_each_others_reports(api, ids):
    pid = api.make_project("company")
    api.make_member("student", pid)
    api.make_member("student2", pid)
    rep = api.make_report("student", pid)
    rows = [r["id"] for r in api.call("student2", "GET", "/reports/").json()]
    assert rep in rows, "teammate approved via the official flow (academically_approved) can't see team reports"


def test_company_sees_only_own_project_reports(api):
    pid = api.make_project("company")
    api.make_member("student", pid)
    rep = api.make_report("student", pid)
    assert rep in [r["id"] for r in api.call("company", "GET", "/reports/").json()]
    assert rep not in [r["id"] for r in api.call("company2", "GET", "/reports/").json()]


def test_other_company_cannot_grade_report(api):
    pid = api.make_project("company")
    api.make_member("student", pid)
    rep = api.make_report("student", pid)
    r = api.call("company2", "PUT", f"/reports/{rep}/status", json={"status": "rejected", "grade": "0"})
    assert r.status_code == 403, "company B graded a report on company A's project"


def test_student_cannot_grade_own_report(api):
    pid = api.make_project("company")
    api.make_member("student", pid)
    rep = api.make_report("student", pid)
    assert api.call("student", "PUT", f"/reports/{rep}/status", json={"status": "approved"}).status_code == 403


def test_report_invalid_status(api):
    pid = api.make_project("company")
    api.make_member("student", pid)
    rep = api.make_report("student", pid)
    assert api.call("supervisor", "PUT", f"/reports/{rep}/status", json={"status": "x"}).status_code == 400


def test_report_unknown_404(api):
    assert api.call("supervisor", "PUT", "/reports/99999999/status", json={"status": "approved"}).status_code == 404


# ---------------- users ----------------

def test_student_cannot_list_all_users(api):
    r = api.call("student", "GET", "/users/")
    assert r.status_code == 403, f"student downloaded {len(r.json())} users incl. emails/phones"


def test_profile_round_trip(api):
    body = {"full_name": "QA Student One", "phone": "000", "major": "QA Major", "bio": "bio",
            "university": "QA U", "course": "Capstone 1", "portfolio_url": "https://example.test"}
    r = api.call("student", "PUT", "/users/me/profile", json=body)
    assert r.status_code == 200
    got = api.call("student", "GET", "/users/me/profile").json()
    assert {k: got[k] for k in body} == body


def test_profile_aliases_consistent(api):
    paths = ["/users/me/profile", "/profile", "/users/me", "/api/users/me", "/api/users/me/profile"]
    bodies = [api.call("student", "GET", p).json() for p in paths]
    assert all(b == bodies[0] for b in bodies)


def test_profile_portfolio_url_scheme_validated(api):
    r = api.call("student", "PUT", "/users/me/profile", json={"portfolio_url": "javascript:alert(1)"})
    assert r.status_code in (400, 422), "javascript: portfolio URL accepted"
    api.call("student", "PUT", "/users/me/profile", json={"portfolio_url": "https://example.test"})


@pytest.mark.parametrize("raw,clean", [
    ("python<spl", "Python, SQL"),
    ("react, React , REACT", "React"),
    ("'docker', <fastapi>", "Docker, FastAPI"),
    ("Python<Splunk", "Python, Splunk"),
])
def test_skill_sanitiser(api, raw, clean):
    r = api.call("student2", "PUT", "/users/me/skills", json={"skills": raw})
    assert r.json()["skills"] == clean, f"{raw!r} -> {r.json()['skills']!r}"


def test_skills_stored_on_create_project(api):
    r = api.call("company", "POST", "/projects/", json={"title": "QA skills", "required_skills": "python<spl"})
    assert r.json()["required_skills"] == "Python, SQL"


# ---------------- CV upload ----------------
# Phase 2 (I-14): CVs live in private storage (Supabase or backend/uploads/private locally) and are
# downloaded through GET /users/{id}/cv -> short-lived signed URL. The original tests asserted the old
# public /uploads/cvs/... layout and were rewritten for the new contract.

PRIVATE_CVS = os.path.join(BACKEND_UPLOADS, "private", "cvs")


def upload(api, role, name, data, ctype="application/pdf"):
    return api.call(role, "POST", "/users/me/cv-upload", files={"file": (name, io.BytesIO(data), ctype)})


def cv_files(user_id):
    d = os.path.join(PRIVATE_CVS, str(user_id))
    return os.listdir(d) if os.path.isdir(d) else []


def test_cv_pdf_ok_and_stored_privately(api, ids, client):
    r = upload(api, "student", "cv.pdf", b"%PDF-1.4\n% qa\n")
    assert r.status_code == 200 and r.json()["has_cv"] is True
    assert "portfolio_url" not in r.json() or not str(r.json().get("portfolio_url", "")).startswith("/uploads/")
    assert api.call("student", "GET", "/users/me/profile").json()["has_cv"] is True
    assert cv_files(ids["student"]), "file not in private storage"
    link = api.call("student", "GET", f"/users/{ids['student']}/cv").json()["url"]
    body = client.get(link).content if link.startswith("/") else b""
    assert body.startswith(b"%PDF-"), "signed link does not return the PDF"


def test_cv_requires_auth(api):
    assert upload(api, "anon", "cv.pdf", b"%PDF-1.4").status_code == 401


@pytest.mark.parametrize("name", ["cv.exe", "cv.html", "cv.pdf.exe", "cv"])
def test_cv_rejects_non_pdf_extension(api, name):
    assert upload(api, "student", name, b"MZ....").status_code == 400


def test_cv_rejects_non_pdf_content(api):
    r = upload(api, "student", "evil.pdf", b"<html><script>alert(1)</script></html>", "text/html")
    assert r.status_code == 400, "HTML payload named .pdf accepted (no magic-byte / content-type check)"


def test_cv_size_limit(api):
    big = b"%PDF-1.4\n" + b"0" * (6 * 1024 * 1024)
    r = upload(api, "student", "big.pdf", big)
    assert r.status_code in (400, 413), "6 MB CV accepted - limit is 5 MB"


def test_cv_not_publicly_downloadable(api, ids, client):
    upload(api, "student", "cv.pdf", b"%PDF-1.4\n% private\n")
    assert api.call("anon", "GET", f"/users/{ids['student']}/cv").status_code == 401
    assert api.call("student2", "GET", f"/users/{ids['student']}/cv").status_code == 403
    assert api.call("company2", "GET", f"/users/{ids['student']}/cv").status_code == 403
    assert client.get(f"/uploads/cvs/cv_{ids['student']}_1.pdf").status_code == 404, "static /uploads still mounted"
    assert client.get("/files/not-a-valid-token").status_code == 404


def test_cv_visible_to_supervisor_and_applied_company(api, ids):
    upload(api, "student", "cv.pdf", b"%PDF-1.4\n")
    assert api.call("supervisor", "GET", f"/users/{ids['student']}/cv").status_code == 200
    pid = api.make_project("company")
    api.make_application("student", pid)
    assert api.call("company", "GET", f"/users/{ids['student']}/cv").status_code == 200
    rows = [a for a in api.call("company", "GET", "/applications/").json() if a["project_id"] == pid]
    assert rows and rows[0]["student_has_cv"] is True


def test_cv_upload_old_files_cleaned(api, ids):
    # only count files this test creates (fresh QA databases reuse user ids, the folder persists)
    before = set(cv_files(ids["student2"]))
    upload(api, "student2", "cv.pdf", b"%PDF-1.4\n")
    upload(api, "student2", "cv2.pdf", b"%PDF-1.4\n")
    new = set(cv_files(ids["student2"])) - before
    assert len(new) == 1, f"old CV files are not deleted ({len(new)} new files kept)"


def test_cv_upload_allowed_for_non_students(api):
    r = upload(api, "company", "cv.pdf", b"%PDF-1.4\n")
    assert r.status_code == 403, "companies/supervisors can upload a CV (creates a StudentProfile for them)"



# ---------------- Phase 2 (I-05): report files ----------------

def test_report_file_upload_link_and_permissions(api, client):
    pid = api.make_project("company")
    api.make_member("student", pid)
    up = api.call("student", "POST", "/reports/upload", files={"file": ("r.pdf", io.BytesIO(b"%PDF-1.4 qa"), "application/pdf")})
    assert up.status_code == 200, up.text
    key = up.json()["file_key"]
    r = api.call("student", "POST", "/reports/", json={"project_id": pid, "title": "QA file report", "file_key": key})
    assert r.status_code == 201 and r.json()["has_file"] is True
    rep = r.json()["id"]
    for role in ("student", "company", "supervisor", "admin"):
        res = api.call(role, "GET", f"/reports/{rep}/file")
        assert res.status_code == 200, (role, res.status_code)
    link = api.call("student", "GET", f"/reports/{rep}/file").json()["url"]
    assert client.get(link).content.startswith(b"%PDF-")
    assert api.call("company2", "GET", f"/reports/{rep}/file").status_code == 403
    assert api.call("anon", "GET", f"/reports/{rep}/file").status_code == 401


def test_report_file_rejects_bad_content_and_foreign_keys(api):
    pid = api.make_project("company")
    api.make_member("student", pid)
    bad = api.call("student", "POST", "/reports/upload", files={"file": ("x.pdf", io.BytesIO(b"<html>"), "application/pdf")})
    assert bad.status_code == 400
    assert api.call("company", "POST", "/reports/upload", files={"file": ("r.pdf", io.BytesIO(b"%PDF-1.4"), "application/pdf")}).status_code == 403
    r = api.call("student", "POST", "/reports/", json={"project_id": pid, "title": "x", "file_key": "reports/999999/stolen.pdf"})
    assert r.status_code == 400, "student attached another user's stored file"


def test_report_can_review_flag(api):
    pid = api.make_project("company")
    api.make_member("student", pid)
    rep = api.make_report("student", pid)
    flag = lambda role: [r for r in api.call(role, "GET", "/reports/").json() if r["id"] == rep][0]["can_review"]
    assert flag("company") is True and flag("supervisor") is True and flag("student") is False
