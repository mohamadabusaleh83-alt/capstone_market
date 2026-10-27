"""Project chat + notifications."""
import pytest


def new_notifs(api, role, before):
    return [n for n in api.notifications(role) if n["id"] not in before]


def snap(api, role):
    return {n["id"] for n in api.notifications(role)}


# ---------------- messages ----------------

def test_member_and_owner_can_chat(api):
    pid = api.make_project("company")
    api.make_member("student", pid)
    assert api.call("student", "POST", f"/projects/{pid}/messages", json={"text": "hi from student"}).status_code == 201
    assert api.call("company", "POST", f"/projects/{pid}/messages", json={"text": "hi from company"}).status_code == 201
    msgs = api.call("student", "GET", f"/projects/{pid}/messages").json()
    assert [m["text"] for m in msgs][-2:] == ["hi from student", "hi from company"]
    assert msgs[-1]["sender_role"] == "partner"


def test_unrelated_student_cannot_read_or_write(api):
    pid = api.make_project("company")
    assert api.call("student2", "GET", f"/projects/{pid}/messages").status_code == 403
    assert api.call("student2", "POST", f"/projects/{pid}/messages", json={"text": "x"}).status_code == 403


def test_rejected_applicant_loses_chat_access(api):
    pid = api.make_project("company")
    a = api.make_application("student2", pid)
    api.call("company", "POST", f"/projects/{pid}/messages", json={"text": "internal: salary 5000"})
    api.set_app_status("company", a, "rejected")
    r = api.call("student2", "GET", f"/projects/{pid}/messages")
    assert r.status_code == 403, "a REJECTED applicant can still read the project chat"


def test_mere_applicant_cannot_read_team_chat(api):
    pid = api.make_project("company")
    api.make_application("student2", pid)
    r = api.call("student2", "GET", f"/projects/{pid}/messages")
    assert r.status_code == 403, "anyone who merely applied can read the team chat"


def test_unassigned_supervisor_cannot_read_chat(api):
    """Phase 1 (I-09) policy: only the *assigned* supervisor reads a project chat.
    (The original test documented the old 'any supervisor' rule, and its setup accidentally made
    qa_supervisor the assigned supervisor, because make_project approves through that account.)"""
    pid = api.make_project("company2", status="pending")
    api.call("admin", "PUT", f"/projects/{pid}/status", json={"status": "approved"})  # admin becomes assigned
    assert api.call("supervisor", "GET", f"/projects/{pid}/messages").status_code == 403
    assert api.call("admin", "GET", f"/projects/{pid}/messages").status_code == 200


@pytest.mark.parametrize("body,code", [({"text": ""}, 400), ({"text": "   "}, 400), ({}, 422)])
def test_message_validation(api, body, code):
    pid = api.make_project("company")
    assert api.call("company", "POST", f"/projects/{pid}/messages", json=body).status_code == code


def test_message_length_limited(api):
    pid = api.make_project("company")
    r = api.call("company", "POST", f"/projects/{pid}/messages", json={"text": "A" * 200_000})
    assert r.status_code in (400, 413, 422), "200 KB chat message accepted"


def test_message_unknown_project_404(api):
    assert api.call("admin", "GET", "/projects/99999999/messages").status_code == 404


def test_message_html_stored_verbatim(api):
    """Not an XSS by itself (React escapes), recorded for awareness."""
    pid = api.make_project("company")
    r = api.call("company", "POST", f"/projects/{pid}/messages", json={"text": "<img src=x onerror=alert(1)>"})
    assert r.json()["text"] == "<img src=x onerror=alert(1)>"


# ---------------- notifications are created on events ----------------

def test_notif_on_application_to_owner(api):
    pid = api.make_project("company")
    b = snap(api, "company")
    api.make_application("student", pid)
    assert new_notifs(api, "company", b)


def test_notif_on_company_accept_to_student_and_supervisor(api):
    pid = api.make_project("company")
    a = api.make_application("student", pid)
    bs, bv = snap(api, "student"), snap(api, "supervisor")
    api.set_app_status("company", a, "accepted")
    assert new_notifs(api, "student", bs)
    assert new_notifs(api, "supervisor", bv)


def test_notif_on_rejection_to_student(api):
    pid = api.make_project("company")
    a = api.make_application("student", pid)
    b = snap(api, "student")
    api.set_app_status("company", a, "rejected")
    assert new_notifs(api, "student", b)


def test_notif_on_academic_approval_to_student_and_company(api):
    pid = api.make_project("company")
    a = api.make_application("student", pid)
    api.set_app_status("company", a, "accepted")
    bs, bc = snap(api, "student"), snap(api, "company")
    api.set_app_status("supervisor", a, "academically_approved")
    assert new_notifs(api, "student", bs) and new_notifs(api, "company", bc)


def test_notif_on_message_to_owner(api):
    pid = api.make_project("company")
    api.make_member("student", pid)
    b = snap(api, "company")
    api.call("student", "POST", f"/projects/{pid}/messages", json={"text": "ping"})
    assert new_notifs(api, "company", b)


def test_notif_on_message_to_student_members(api):
    pid = api.make_project("company")
    api.make_member("student", pid)
    b = snap(api, "student")
    api.call("company", "POST", f"/projects/{pid}/messages", json={"text": "ping back"})
    assert new_notifs(api, "student", b), "students are never notified about new chat messages"


def test_notif_on_report_submit_to_supervisor(api):
    pid = api.make_project("company")
    api.make_member("student", pid)
    b = snap(api, "supervisor")
    api.make_report("student", pid)
    assert new_notifs(api, "supervisor", b)


def test_notif_on_report_review_to_student(api):
    pid = api.make_project("company")
    api.make_member("student", pid)
    rep = api.make_report("student", pid)
    b = snap(api, "student")
    api.call("supervisor", "PUT", f"/reports/{rep}/status", json={"status": "approved"})
    assert new_notifs(api, "student", b)


def test_notif_on_project_approval_to_owner(api):
    pid = api.make_project("company", status="pending")
    b = snap(api, "company")
    api.call("supervisor", "PUT", f"/projects/{pid}/status", json={"status": "approved"})
    assert new_notifs(api, "company", b), "no notification when a project is approved"


def test_notif_on_new_pending_project_to_supervisors(api):
    b = snap(api, "supervisor")
    api.make_project("company", status="pending")
    assert new_notifs(api, "supervisor", b), "supervisors are not told a project awaits approval"


def test_notification_links_point_to_existing_routes(api):
    """Links used: /projects/{id}, /browse, /workspace, /supervisor, /reports - frontend has no
    /projects/:id, /browse or /workspace routes (App.jsx)."""
    pid = api.make_project("company")
    a = api.make_application("student", pid)
    api.set_app_status("company", a, "rejected")
    # Phase 3: /company/opportunities is the company's own-projects page (a real route) - added to the list
    frontend_routes = {"/", "/projects", "/dashboard", "/notifications", "/my-projects", "/supervisor", "/reports",
                       "/company/opportunities"}
    bad = {n["link"] for n in api.notifications("student") + api.notifications("company")
           if n["link"] and n["link"].split("?")[0] not in frontend_routes}
    assert not bad, f"notification links that 404 in the SPA: {sorted(bad)[:6]}"


# ---------------- read / read-all ----------------

def test_mark_own_read(api):
    pid = api.make_project("company")
    api.make_application("student", pid)
    n = api.notifications("company")[0]
    r = api.call("company", "PUT", f"/notifications/{n['id']}/read")
    assert r.status_code == 200 and r.json()["is_read"] is True


def test_cannot_mark_other_users_notification(api):
    pid = api.make_project("company")
    api.make_application("student", pid)
    n = api.notifications("company")[0]
    for role in ("student", "company2", "supervisor", "admin"):
        assert api.call(role, "PUT", f"/notifications/{n['id']}/read").status_code == 404


def test_read_all_only_affects_self(api):
    pid = api.make_project("company")
    api.make_application("student", pid)       # unread for company
    api.call("student", "PUT", "/notifications/read-all")
    assert any(not n["is_read"] for n in api.notifications("company"))
    api.call("company", "PUT", "/notifications/read-all")
    assert all(n["is_read"] for n in api.notifications("company"))


def test_notifications_capped_at_50_no_paging(api):
    assert len(api.notifications("supervisor")) <= 50



# ---------------- Phase 3 (I-28, I-48) ----------------

def test_errors_and_notifications_follow_accept_language(api):
    en = {"Accept-Language": "en-US,en;q=0.9"}
    r = api.call("student", "GET", "/projects/99999999", headers=en)
    assert r.status_code == 404 and r.json()["detail"] == "Project 99999999 not found"
    r = api.call("student", "GET", "/projects/99999999")
    assert "غير موجود" in r.json()["detail"]
    pid = api.make_project("company")
    api.make_application("student", pid)
    n_en = api.call("company", "GET", "/notifications", headers=en).json()[0]
    n_ar = api.call("company", "GET", "/notifications").json()[0]
    assert n_en["title"] == "New application" and n_ar["title"] == "طلب انضمام جديد"
    assert n_en["project_id"] == pid


def test_deleting_project_removes_its_notifications(api):
    pid = api.make_project("company")
    api.make_application("student", pid)
    assert any(n["project_id"] == pid for n in api.notifications("company"))
    api.call("company", "DELETE", f"/projects/{pid}")
    assert not any(n["project_id"] == pid for n in api.notifications("company"))
