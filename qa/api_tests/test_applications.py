"""Applications, seats, status workflow."""
import pytest


def seats(api, pid):
    p = api.project(pid)
    return p["current_members"], p["available_seats"]


def test_apply_success_and_list(api):
    pid = api.make_project("company")
    app_id = api.make_application("student", pid)
    mine = [a["id"] for a in api.call("student", "GET", "/applications/").json()]
    assert app_id in mine


def test_apply_twice_400(api):
    pid = api.make_project("company")
    api.make_application("student", pid)
    r = api.call("student", "POST", "/applications/", json={"project_id": pid})
    assert r.status_code == 400


def test_apply_missing_project_404(api):
    assert api.call("student", "POST", "/applications/", json={"project_id": 99999999}).status_code == 404


@pytest.mark.parametrize("body", [{}, {"project_id": "abc"}])
def test_apply_invalid_payload_422(api, body):
    assert api.call("student", "POST", "/applications/", json=body).status_code == 422


def test_apply_to_rejected_400(api):
    pid = api.make_project("company", status="rejected")
    assert api.call("student", "POST", "/applications/", json={"project_id": pid}).status_code == 400


def test_apply_to_pending_project_blocked(api):
    pid = api.make_project("company", status="pending")
    r = api.call("student", "POST", "/applications/", json={"project_id": pid})
    assert r.status_code == 400, f"student applied to an unapproved project ({r.status_code})"


def test_apply_to_full_project_400(api):
    pid = api.make_project("company", max_members=1)
    api.make_member("student", pid)
    r = api.call("student2", "POST", "/applications/", json={"project_id": pid})
    assert r.status_code == 400


@pytest.mark.parametrize("role", ["company", "supervisor"])
def test_non_students_cannot_apply(api, role):
    pid = api.make_project("company2")
    assert api.call(role, "POST", "/applications/", json={"project_id": pid}).status_code == 403


def test_seat_counters_follow_status(api):
    pid = api.make_project("company", max_members=2)
    assert seats(api, pid) == (0, 2)
    a = api.make_application("student", pid)
    assert seats(api, pid) == (0, 2), "applying alone should not consume a seat"
    api.set_app_status("company", a, "accepted")
    assert seats(api, pid) == (1, 1), "company nomination should reserve a seat"
    api.set_app_status("company", a, "rejected")
    assert seats(api, pid) == (0, 2), "rejection should free the seat"


def test_company_cannot_nominate_beyond_capacity(api):
    pid = api.make_project("company", max_members=1)
    a1 = api.make_application("student", pid)
    a2 = api.make_application("student2", pid)
    assert api.set_app_status("company", a1, "accepted").status_code == 200
    assert api.set_app_status("company", a2, "accepted").status_code == 400


def test_supervisor_cannot_approve_beyond_capacity(api):
    pid = api.make_project("company", max_members=1)
    a1 = api.make_application("student", pid)
    a2 = api.make_application("student2", pid)
    api.set_app_status("supervisor", a1, "academically_approved")
    r = api.set_app_status("supervisor", a2, "academically_approved")
    cur, avail = seats(api, pid)
    assert r.status_code == 400 and cur <= 1, f"supervisor over-filled project: members={cur}/1"


def test_company_cannot_skip_academic_approval(api):
    pid = api.make_project("company")
    a = api.make_application("student", pid)
    api.set_app_status("company", a, "academically_approved")
    status = [x for x in api.call("student", "GET", "/applications/").json() if x["id"] == a][0]["status"]
    assert status != "academically_approved", "company set academically_approved itself (bypasses supervisor)"


def test_company_cannot_bypass_capacity_via_other_status(api):
    pid = api.make_project("company", max_members=1)
    a1 = api.make_application("student", pid)
    a2 = api.make_application("student2", pid)
    api.set_app_status("company", a1, "accepted")
    api.set_app_status("company", a2, "academically_approved")
    assert seats(api, pid)[0] <= 1, f"capacity exceeded via raw status: {seats(api, pid)}"


def test_student_cannot_change_own_application(api):
    pid = api.make_project("company")
    a = api.make_application("student", pid)
    assert api.set_app_status("student", a, "accepted").status_code == 403


def test_student_project_owner_cannot_self_approve(api):
    """Students may create projects. They must not enrol themselves: applying to their own project is
    refused, and as the project's 'owner' they cannot decide anyone's application.
    (Updated in phase 1: the original version applied to the student's own *pending* project as setup;
    that step is now rejected by I-32, so the test asserts both protections instead.)"""
    pid = api.make_project("student")            # student proposal, approved by the supervisor
    r = api.call("student", "POST", "/applications/", json={"project_id": pid})
    assert r.status_code in (400, 403), f"student applied to own project ({r.status_code})"
    a = api.make_application("student2", pid)
    r = api.set_app_status("student", a, "academically_approved")
    assert r.status_code == 403, f"student project owner changed an application ({r.status_code})"


def test_other_company_cannot_change_status(api):
    pid = api.make_project("company")
    a = api.make_application("student", pid)
    assert api.set_app_status("company2", a, "rejected").status_code == 403


def test_invalid_status_400(api):
    pid = api.make_project("company")
    a = api.make_application("student", pid)
    assert api.set_app_status("company", a, "bogus").status_code == 400


def test_missing_status_400(api):
    pid = api.make_project("company")
    a = api.make_application("student", pid)
    assert api.call("company", "PUT", f"/applications/{a}/status", json={}).status_code in (400, 422)


def test_status_unknown_application_404(api):
    assert api.set_app_status("company", 99999999, "rejected").status_code == 404


def test_rejected_application_cannot_be_reaccepted_by_company_after_supervisor_rejects(api):
    pid = api.make_project("company")
    a = api.make_application("student", pid)
    api.set_app_status("company", a, "accepted")
    api.set_app_status("supervisor", a, "rejected")
    r = api.set_app_status("company", a, "accepted")
    assert r.status_code == 400, "company can overturn a supervisor rejection"


def test_supervisor_approval_auto_approves_pending_project(api):
    pid = api.make_project("company", status="rejected")
    # application created while project briefly approved
    api.call("supervisor", "PUT", f"/projects/{pid}/status", json={"status": "approved"})
    a = api.make_application("student", pid)
    api.call("supervisor", "PUT", f"/projects/{pid}/status", json={"status": "rejected"})
    api.set_app_status("supervisor", a, "academically_approved")
    assert api.project(pid)["status"] == "rejected", \
        "approving one application silently flips a rejected project back to approved"


def test_application_list_isolation(api, ids):
    pid = api.make_project("company")
    api.make_application("student", pid)
    s2 = api.call("student2", "GET", "/applications/").json()
    assert all(a["student_id"] == ids["student2"] for a in s2)
    c2 = api.call("company2", "GET", "/applications/").json()
    assert all(a["project_id"] != pid for a in c2)


def test_application_exposes_student_profile_fields(api):
    """ApplicationResponse has student_major/bio/portfolio but format_application_item reads them off User
    (which has no such attributes) so they are always null."""
    api.call("student", "PUT", "/users/me/profile", json={"major": "QA CS", "bio": "qa bio"})
    pid = api.make_project("company")
    a = api.make_application("student", pid)
    row = [x for x in api.call("company", "GET", "/applications/").json() if x["id"] == a][0]
    assert row["student_major"] == "QA CS" and row["student_bio"] == "qa bio", row


# ---------------- Phase 1 step A: academic approval path ----------------

def test_company_project_requires_nomination_before_academic_approval(api):
    pid = api.make_project("company")
    a = api.make_application("student", pid)
    r = api.set_app_status("supervisor", a, "academically_approved")
    assert r.status_code == 400, f"supervisor skipped the company nomination ({r.status_code})"
    api.set_app_status("company", a, "accepted")
    assert api.set_app_status("supervisor", a, "academically_approved").status_code == 200


def test_supervisor_project_allows_direct_academic_approval(api):
    pid = api.make_project("supervisor")          # no company owner -> supervisor decides directly
    a = api.make_application("student", pid)
    r = api.set_app_status("supervisor", a, "academically_approved")
    assert r.status_code == 200 and r.json()["status"] == "academically_approved", r.text


def test_supervisor_cannot_manage_project_assigned_to_another(api):
    pid = api.make_project("company", status="pending")
    api.call("admin", "PUT", f"/projects/{pid}/status", json={"status": "approved"})   # admin is assigned
    a = api.make_application("student", pid)
    api.set_app_status("company", a, "accepted")
    assert api.set_app_status("supervisor", a, "academically_approved").status_code == 403
    assert api.call("supervisor", "PUT", f"/projects/{pid}/status", json={"status": "rejected"}).status_code == 403
    assert api.set_app_status("admin", a, "academically_approved").status_code == 200
