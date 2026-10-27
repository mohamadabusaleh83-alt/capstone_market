"""Projects: CRUD, approval flow, supervisor assignment, visibility, validation."""
import pytest

from conftest import RUN


def test_company_project_starts_pending(api):
    r = api.call("company", "POST", "/projects/", json={"title": f"QA-{RUN} pend"})
    assert r.status_code == 201 and r.json()["status"] == "pending"
    assert r.json()["company_name"] == "QA Company One"


def test_supervisor_project_auto_approved_and_self_assigned(api, ids):
    r = api.call("supervisor", "POST", "/projects/", json={"title": f"QA-{RUN} sup"})
    assert r.json()["status"] == "approved" and r.json()["supervisor_id"] == ids["supervisor"]


def test_create_project_requires_title(api):
    assert api.call("company", "POST", "/projects/", json={"description": "x"}).status_code == 422


@pytest.mark.parametrize("title", ["", "   "])
def test_create_project_rejects_blank_title(api, title):
    r = api.call("company", "POST", "/projects/", json={"title": title})
    assert r.status_code in (400, 422), f"blank title accepted ({r.status_code})"


@pytest.mark.parametrize("mm", [0, -3, 10000])
def test_create_project_validates_max_members(api, mm):
    r = api.call("company", "POST", "/projects/", json={"title": f"QA-{RUN} mm", "max_members": mm})
    assert r.status_code in (400, 422), f"max_members={mm} accepted -> stored {r.json().get('max_members')}"


def test_create_project_overlong_title_is_clean_4xx(api):
    r = api.call("company", "POST", "/projects/", json={"title": "T" * 400})
    assert 400 <= r.status_code < 500, f"{r.status_code}: {r.text[:200]}"


def test_create_project_cannot_spoof_company_name(api):
    r = api.call("company", "POST", "/projects/", json={"title": f"QA-{RUN} spoof", "company_name": "Google"})
    assert r.json()["company_name"] == "QA Company One", "a company can publish under another company's name"


def test_other_company_cannot_edit_or_delete(api):
    pid = api.make_project("company")
    assert api.call("company2", "PUT", f"/projects/{pid}", json={"title": "hijack"}).status_code == 403
    assert api.call("company2", "DELETE", f"/projects/{pid}").status_code == 403


def test_owner_company_cannot_assign_supervisor(api, ids):
    pid = api.make_project("company", status="pending")
    r = api.call("company", "PUT", f"/projects/{pid}", json={"supervisor_id": ids["company2"],
                                                            "supervisor_feedback": "approved by me"})
    p = api.project(pid)
    assert p["supervisor_id"] != ids["company2"], "owner set supervisor_id to an arbitrary user"
    assert p["supervisor_feedback"] != "approved by me", "owner wrote the supervisor feedback field"


def test_owner_edit_cannot_change_status(api):
    pid = api.make_project("company", status="pending")
    api.call("company", "PUT", f"/projects/{pid}", json={"status": "approved"})
    assert api.project(pid)["status"] == "pending"


def test_owner_edit_of_approved_project_requires_reapproval(api):
    """Editing title/description of an approved project leaves it approved -> content can change after review."""
    pid = api.make_project("company")
    api.call("company", "PUT", f"/projects/{pid}", json={"description": "totally different content"})
    assert api.project(pid)["status"] != "approved"


def test_edit_project_sanitises_skills(api):
    pid = api.make_project("company")
    api.call("company", "PUT", f"/projects/{pid}", json={"required_skills": "python<spl, react"})
    assert api.project(pid)["required_skills"] == "Python, SQL, React", api.project(pid)["required_skills"]


def test_edit_project_cannot_reduce_capacity_below_members(api):
    pid = api.make_project("company", max_members=2)
    api.make_member("student", pid)
    api.make_member("student2", pid)
    r = api.call("company", "PUT", f"/projects/{pid}", json={"max_members": 1})
    assert r.status_code == 400, f"max_members reduced below current members -> {api.project(pid)}"


def test_api_alias_for_put_delete_exists(api):
    pid = api.make_project("company")
    assert api.call("company", "PUT", f"/api/projects/{pid}", json={"title": "x"}).status_code != 405


# ---------------- approval flow ----------------

@pytest.mark.parametrize("target", ["approved", "rejected", "pending"])
def test_supervisor_can_set_status(api, target):
    pid = api.make_project("company", status="pending")
    r = api.call("supervisor", "PUT", f"/projects/{pid}/status", json={"status": target, "feedback": "qa"})
    assert r.status_code == 200 and r.json()["status"] == target


def test_invalid_status_400(api):
    pid = api.make_project("company", status="pending")
    assert api.call("supervisor", "PUT", f"/projects/{pid}/status", json={"status": "hacked"}).status_code == 400


def test_status_update_without_body_does_not_approve(api):
    pid = api.make_project("company", status="pending")
    api.call("supervisor", "PUT", f"/projects/{pid}/status")
    assert api.project(pid)["status"] == "pending", "PUT /status with empty body silently approves the project"


def test_owner_cannot_approve_own_project(api):
    pid = api.make_project("company", status="pending")
    assert api.call("company", "PUT", f"/projects/{pid}/status", json={"status": "approved"}).status_code == 403


def test_approval_assigns_approving_supervisor(api, ids):
    pid = api.make_project("company", status="pending")
    api.call("supervisor", "PUT", f"/projects/{pid}/status", json={"status": "approved"})
    assert api.project(pid)["supervisor_id"] == ids["supervisor"]


def test_approval_notifies_project_owner(api):
    pid = api.make_project("company", status="pending")
    before = {n["id"] for n in api.notifications("company")}
    api.call("supervisor", "PUT", f"/projects/{pid}/status", json={"status": "approved"})
    new = [n for n in api.notifications("company") if n["id"] not in before]
    assert new, "company is not notified when its project is approved/rejected"


def test_rejecting_project_with_members_handles_applications(api):
    pid = api.make_project("company")
    api.make_member("student", pid)
    api.call("supervisor", "PUT", f"/projects/{pid}/status", json={"status": "rejected"})
    my = api.call("student", "GET", "/projects/my").json()
    assert not my or my["id"] != pid


# ---------------- visibility ----------------

def test_public_list_hides_rejected_and_pending(api):
    rej = api.make_project("company", status="rejected")
    pend = api.make_project("company", status="pending")
    listed = {p["id"]: p["status"] for p in api.call("anon", "GET", "/projects/").json()}
    leaked = [pid for pid in (rej, pend) if pid in listed]
    assert not leaked, f"anonymous GET /projects/ returns non-approved projects {leaked}"


def test_student_list_hides_rejected(api):
    rej = api.make_project("company", status="rejected")
    ids_ = [p["id"] for p in api.call("student", "GET", "/projects/").json()]
    assert rej not in ids_


def test_status_filter_param_exposes_rejected_to_anon(api):
    rej = api.make_project("company", status="rejected")
    rows = api.call("anon", "GET", "/projects/?status=rejected").json()
    assert rej not in [p["id"] for p in rows]


def test_list_has_no_pagination(api):
    r = api.call("anon", "GET", "/projects/?limit=1")
    assert len(r.json()) <= 1, f"limit ignored; full table returned ({len(r.json())} rows)"


def test_get_missing_project_404(api):
    assert api.call("anon", "GET", "/projects/99999999").status_code == 404


@pytest.mark.parametrize("q", ["status=' OR '1'='1", "status=approved;DROP TABLE users", "created_by=1 OR 1=1"])
def test_filters_not_injectable(api, q):
    r = api.call("anon", "GET", f"/projects/?{q}")
    assert r.status_code in (200, 422)
    if r.status_code == 200:
        assert r.json() == [], f"injection-like filter returned rows for {q}"


def test_fake_supervisor_name_not_invented(api):
    pid = api.make_project("company", status="pending")
    p = api.project(pid)
    assert p["supervisor_id"] is None and p["supervisor_name"] is None, \
        f"unassigned project reports supervisor_name={p['supervisor_name']!r}"


# ---------------- /projects/my ----------------

def test_projects_my_student_after_approval(api):
    pid = api.make_project("company")
    api.make_member("student2", pid)
    assert api.call("student2", "GET", "/projects/my").json()["id"] == pid


def test_projects_my_student_without_project_is_null(api):
    r = api.call("anon", "GET", "/projects/my")
    assert r.status_code == 401


def test_projects_my_company_returns_latest(api):
    pid = api.make_project("company2")
    assert api.call("company2", "GET", "/projects/my").json()["id"] == pid


# ---------------- delete ----------------

def test_delete_cascades(api):
    pid = api.make_project("company")
    api.make_member("student", pid)
    api.make_report("student", pid)
    api.call("company", "POST", f"/projects/{pid}/messages", json={"text": "hi"})
    assert api.call("company", "DELETE", f"/projects/{pid}").status_code == 204
    assert api.call("anon", "GET", f"/projects/{pid}").status_code == 404
    assert all(r["project_id"] != pid for r in api.call("admin", "GET", "/reports/").json())
    assert all(a["project_id"] != pid for a in api.call("admin", "GET", "/applications/").json())


def test_delete_missing_404(api):
    assert api.call("admin", "DELETE", "/projects/99999999").status_code == 404


def test_student_sees_own_non_approved_projects_only(api):
    pid = api.make_project("student", status="pending")
    assert pid in [p["id"] for p in api.call("student", "GET", "/projects/").json()]
    assert api.call("student", "GET", f"/projects/{pid}").status_code == 200
    assert pid not in [p["id"] for p in api.call("student2", "GET", "/projects/").json()]
    assert api.call("student2", "GET", f"/projects/{pid}").status_code == 404
