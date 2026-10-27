"""
Endpoint x role permission matrix.

Columns:
  anon        no token
  stu_member  qa_student  - the student who owns / is an approved member of the resource
  stu_other   qa_student2 - a student with no relation to the resource
  co_owner    qa_company  - the company that created the project
  co_other    qa_company2 - a different company
  supervisor  qa_supervisor
  admin       qa_admin

Expected values encode least-privilege policy:
  "ok"   2xx
  "deny" 401/403/404 (anon must be 401)
  "4xx"  a client error other than auth (e.g. 400 validation) is acceptable

Every cell gets freshly created resources so mutating calls never interfere.
"""
import io
import uuid

import pytest

from conftest import MATRIX_ROWS, RUN

ROLES = ["anon", "student", "student2", "company", "company2", "supervisor", "admin"]
LABELS = ["anon", "stu_member", "stu_other", "co_owner", "co_other", "supervisor", "admin"]


def world(api, project_status="approved", member=True, report=True):
    pid = api.make_project("company", status=project_status)
    ctx = {"pid": pid}
    if member:
        ctx["app"] = api.make_member("student", pid)
        if report:
            ctx["rep"] = api.make_report("student", pid)
    return ctx


def w_applied(api):
    pid = api.make_project("company")
    return {"pid": pid, "app": api.make_application("student", pid)}


def w_notif(api):
    pid = api.make_project("company")
    api.make_member("student", pid)
    notif = api.notifications("student")[0]["id"]
    return {"pid": pid, "notif": notif}


def cv_file():
    return {"files": {"file": ("qa.pdf", io.BytesIO(b"%PDF-1.4\n%QA\n"), "application/pdf")}}


O, D, U, X = "ok", "deny", "401", "4xx"
ALL_AUTH = [U, O, O, O, O, O, O]

# (label, method, path, setup, kwargs-builder, expected per column)
CASES = [
    ("GET /", "GET", "/", None, None, [O] * 7),
    ("POST /logout", "POST", "/logout", None, None, ALL_AUTH),
    ("GET /me", "GET", "/me", None, None, ALL_AUTH),
    ("GET /users/me/profile", "GET", "/users/me/profile", None, None, ALL_AUTH),
    ("PUT /users/me/profile", "PUT", "/users/me/profile", None, lambda c: {"json": {"bio": "qa"}}, ALL_AUTH),
    ("PUT /users/me/skills", "PUT", "/users/me/skills", None, lambda c: {"json": {"skills": "Python"}}, ALL_AUTH),
    ("PUT /users/me/password (wrong current)", "PUT", "/users/me/password", None,
     lambda c: {"json": {"current_password": "nope", "new_password": "whatever123"}}, [U, X, X, X, X, X, X]),
    # Phase 2 (I-14): CV upload is students-only (was allowed for every role)
    ("POST /users/me/cv-upload", "POST", "/users/me/cv-upload", None, lambda c: cv_file(), [U, O, O, D, D, D, D]),
    ("GET /users/ (all users + emails/phones)", "GET", "/users/", None, None, [U, D, D, D, D, O, O]),
    ("GET /users/?role=student", "GET", "/users/?role=student", None, None, [U, D, D, D, D, O, O]),
    ("POST /projects/", "POST", "/projects/", None,
     lambda c: {"json": {"title": f"QA-{RUN} matrix", "required_skills": "Python"}}, ALL_AUTH),
    ("GET /projects/my", "GET", "/projects/my", None, None, ALL_AUTH),
    ("GET /projects/", "GET", "/projects/", None, None, [O] * 7),
    ("GET /projects/{id} (approved)", "GET", "/projects/{pid}", lambda a: world(a, member=False), None, [O] * 7),
    ("GET /projects/{id} (pending)", "GET", "/projects/{pid}",
     lambda a: world(a, "pending", member=False), None, [D, D, D, O, D, O, O]),
    ("GET /projects/{id} (rejected)", "GET", "/projects/{pid}",
     lambda a: world(a, "rejected", member=False), None, [D, D, D, O, D, O, O]),
    ("PUT /projects/{id}", "PUT", "/projects/{pid}", lambda a: world(a, member=False),
     lambda c: {"json": {"title": f"QA-{RUN} edited"}}, [U, D, D, O, D, O, O]),
    ("PUT /projects/{id}/status", "PUT", "/projects/{pid}/status", lambda a: world(a, "pending", member=False),
     lambda c: {"json": {"status": "approved"}}, [U, D, D, D, D, O, O]),
    ("PUT /projects/{id}/approve", "PUT", "/projects/{pid}/approve", lambda a: world(a, "pending", member=False),
     lambda c: {"json": {"status": "approved"}}, [U, D, D, D, D, O, O]),
    ("DELETE /projects/{id}", "DELETE", "/projects/{pid}", lambda a: world(a, member=False), None,
     [U, D, D, O, D, O, O]),
    ("POST /applications/", "POST", "/applications/", lambda a: world(a, member=False),
     lambda c: {"json": {"project_id": c["pid"]}}, [U, O, O, D, D, D, D]),
    ("GET /applications/", "GET", "/applications/", None, None, ALL_AUTH),
    ("GET /projects/{id}/applications", "GET", "/projects/{pid}/applications", w_applied, None,
     [U, D, D, O, D, O, O]),
    ("PUT /applications/{id}/status -> rejected", "PUT", "/applications/{app}/status", w_applied,
     lambda c: {"json": {"status": "rejected"}}, [U, D, D, O, D, O, O]),
    # Phase 1 step A: on a company project the supervisor may not approve an un-nominated application
    # (expected 4xx for supervisor/admin, was "ok" before that rule existed)
    ("PUT /applications/{id}/status -> accepted", "PUT", "/applications/{app}/status", w_applied,
     lambda c: {"json": {"status": "accepted"}}, [U, D, D, O, D, X, X]),
    ("GET /projects/{id}/messages", "GET", "/projects/{pid}/messages", lambda a: world(a, report=False), None,
     [U, O, D, O, D, O, O]),
    ("POST /projects/{id}/messages", "POST", "/projects/{pid}/messages", lambda a: world(a, report=False),
     lambda c: {"json": {"text": "qa hello"}}, [U, O, D, O, D, O, O]),
    ("GET /notifications", "GET", "/notifications", None, None, ALL_AUTH),
    ("PUT /notifications/{id}/read (student's)", "PUT", "/notifications/{notif}/read", w_notif, None,
     [U, O, D, D, D, D, D]),
    ("PUT /notifications/read-all", "PUT", "/notifications/read-all", None, None, ALL_AUTH),
    ("GET /reports/", "GET", "/reports/", None, None, ALL_AUTH),
    ("POST /reports/", "POST", "/reports/", lambda a: world(a, report=False),
     lambda c: {"json": {"project_id": c["pid"], "title": f"QA-{RUN} matrix report"}}, [U, O, D, D, D, D, D]),
    ("PUT /reports/{id}/status", "PUT", "/reports/{rep}/status", world,
     lambda c: {"json": {"status": "approved", "grade": "A"}}, [U, D, D, O, D, O, O]),
    ("GET /analytics/overview", "GET", "/analytics/overview", None, None, [O] * 7),
]


def classify(code, expected, role):
    if expected == O:
        return 200 <= code < 300
    if expected == U:
        return code == 401
    if expected == X:
        return 400 <= code < 500 and code not in (401, 403)
    # deny: 401/403/404 are all a refusal. (Phase 1: anon used to require exactly 401, but a public
    # endpoint with an optional token correctly answers 404 for hidden projects. Endpoints that must
    # demand a login use the explicit "401" expectation instead.)
    return code in (401, 403, 404)


@pytest.mark.parametrize("case", CASES, ids=[c[0] for c in CASES])
def test_matrix(api, case):
    label, method, path, setup, kwargs_fn, expected = case
    row = {"endpoint": label, "cells": {}}
    failures = []
    for role, col, exp in zip(ROLES, LABELS, expected):
        ctx = setup(api) if setup else {}
        url = path.format(**ctx)
        kw = kwargs_fn(ctx) if kwargs_fn else {}
        r = api.call(role, method, url, **kw)
        ok = classify(r.status_code, exp, role)
        row["cells"][col] = {"expected": exp, "actual": r.status_code, "pass": ok}
        if not ok:
            failures.append(f"{col}: expected {exp}, got {r.status_code} {r.text[:90]}")
    MATRIX_ROWS.append(row)
    assert not failures, "\n".join(failures)
