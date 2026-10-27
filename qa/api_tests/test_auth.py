"""Registration, login, tokens, password change."""
import time
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from jose import jwt

from conftest import ACCOUNTS, PASSWORD, QA_SECRET_KEY, RUN

# Copied verbatim from backend/utils.py: the public development key (only used with DEV_INSECURE_KEY=1).
DEV_DEFAULT_SECRET = "your-super-secret-key-change-this-in-production"


def qa_token(client, email, **claims):
    """A token signed with the QA server key, carrying the account's current token version."""
    real = client.post("/login", data={"username": email, "password": PASSWORD}).json()["access_token"]
    base = jwt.get_unverified_claims(real)
    base.update(claims)
    return jwt.encode(base, QA_SECRET_KEY, algorithm="HS256")


def email(tag):
    return f"qa_{tag}_{RUN}_{uuid.uuid4().hex[:4]}@example.com"


def register(client, **over):
    body = {"full_name": "QA Reg", "email": email("reg"), "password": "StrongPass#1", "role": "student", **over}
    return client.post("/users/", json=body), body


def login(client, username, password):
    return client.post("/login", data={"username": username, "password": password})


# ---------------- registration ----------------

@pytest.mark.parametrize("role", ["admin", "supervisor", "ADMIN", " Supervisor ", "Admin"])
def test_register_cannot_escalate_role(client, role):
    r, _ = register(client, role=role)
    assert r.status_code == 403, f"role={role!r} -> {r.status_code} {r.text}"


@pytest.mark.parametrize("role,stored", [("student", "student"), ("partner", "partner"),
                                         ("company", "partner"), ("business", "partner"),
                                         ("superadmin", "student"), (None, "student")])
def test_register_role_normalisation(client, role, stored):
    r, _ = register(client, role=role)
    assert r.status_code == 201, r.text
    assert r.json()["role"] == stored


def test_register_duplicate_email(client):
    r, body = register(client)
    assert r.status_code == 201
    r2, _ = register(client, email=body["email"])
    assert r2.status_code == 400


def test_register_duplicate_email_case_insensitive(client):
    r, body = register(client)
    assert r.status_code == 201
    r2, _ = register(client, email=body["email"].upper())
    assert r2.status_code == 400, f"uppercase duplicate accepted: {r2.status_code}"


@pytest.mark.parametrize("pw", ["", "1", "123", "aaaaa"])
def test_register_rejects_weak_password(client, pw):
    r, _ = register(client, password=pw)
    assert r.status_code in (400, 422), f"weak password {pw!r} accepted -> {r.status_code}"


@pytest.mark.parametrize("payload", [
    {},
    {"email": "not-an-email", "password": "StrongPass#1", "full_name": "x"},
    {"email": "a@test.local", "password": "StrongPass#1"},          # no full_name
    {"full_name": "x", "password": "StrongPass#1"},                 # no email
])
def test_register_invalid_payload_422(client, payload):
    assert client.post("/users/", json=payload).status_code == 422


def test_register_blank_full_name_rejected(client):
    r, _ = register(client, full_name="   ")
    assert r.status_code in (400, 422), f"blank name accepted -> {r.status_code}"


def test_register_overlong_full_name_handled(client):
    r, _ = register(client, full_name="x" * 300)
    assert r.status_code in (400, 422), f"overlong name -> {r.status_code}: {r.text[:120]}"


# ---------------- login ----------------

def test_login_success_returns_bearer(client):
    r = login(client, ACCOUNTS["student"], PASSWORD)
    assert r.status_code == 200 and r.json()["token_type"] == "bearer"


def test_login_email_case_insensitive(client):
    assert login(client, ACCOUNTS["student"].upper(), PASSWORD).status_code == 200


def test_login_wrong_password_401(client):
    assert login(client, ACCOUNTS["student"], "wrong-password").status_code == 401


def test_login_unknown_email_same_error(client):
    a = login(client, "nobody_" + RUN + "@test.local", "x")
    b = login(client, ACCOUNTS["student"], "x")
    assert a.status_code == b.status_code == 401
    assert a.json() == b.json(), "login error differs for unknown vs known email (user enumeration)"


def test_login_missing_fields_422(client):
    assert client.post("/login", data={}).status_code == 422


def test_login_json_body_rejected(client):
    r = client.post("/login", json={"username": ACCOUNTS["student"], "password": PASSWORD})
    assert r.status_code == 422


def test_login_rate_limited(client):
    """Per-account lockout after repeated failures. (Phase 2: uses a throwaway account - the original
    used qa_student2, which the now-working lockout would block for the rest of the run.)"""
    r, body = register(client)
    codes = [login(client, body["email"], f"bad{i}").status_code for i in range(8)]
    assert 429 in codes, f"8 consecutive bad logins, no throttling (codes={codes})"
    locked = login(client, body["email"], body["password"])
    assert locked.status_code == 429 and locked.headers.get("retry-after"), "correct password accepted during lockout"


# ---------------- tokens ----------------

def test_no_token_401(client):
    assert client.get("/me").status_code == 401


@pytest.mark.parametrize("hdr", ["Bearer garbage", "Bearer x.y.z", "Basic abc", "garbage"])
def test_malformed_token_401(client, hdr):
    assert client.get("/me", headers={"Authorization": hdr}).status_code == 401


def test_tampered_token_401(client, tokens):
    t = tokens["student"]
    head, payload, sig = t.split(".")
    bad = f"{head}.{payload}.{sig[:-2]}{'AA' if sig[-2:] != 'AA' else 'BB'}"
    assert client.get("/me", headers={"Authorization": f"Bearer {bad}"}).status_code == 401


def test_alg_none_token_rejected(client, ids):
    tok = jwt.encode({"user_id": ids["admin"]}, "", algorithm="HS256").split(".")
    import base64, json as _j
    hdr = base64.urlsafe_b64encode(_j.dumps({"alg": "none", "typ": "JWT"}).encode()).rstrip(b"=").decode()
    none_tok = f"{hdr}.{tok[1]}."
    assert client.get("/me", headers={"Authorization": f"Bearer {none_tok}"}).status_code == 401


def test_token_expiry_is_24h(tokens):
    claims = jwt.get_unverified_claims(tokens["student"])
    life = claims["exp"] - int(time.time())
    assert 0 < life <= 24 * 3600 + 60, f"token lifetime {life}s"


def test_expired_token_rejected(client, ids):
    """Correctly signed (QA server key) but expired."""
    tok = qa_token(client, ACCOUNTS["student"], exp=int((datetime.now(timezone.utc) - timedelta(minutes=1)).timestamp()))
    assert client.get("/me", headers={"Authorization": f"Bearer {tok}"}).status_code == 401


def test_cannot_forge_admin_token_with_public_default_key(client, ids):
    """If SECRET_KEY is unset and ENVIRONMENT/RENDER are not set, the server signs with a key
    published in the repo. Anyone can mint an admin token."""
    tok = jwt.encode({"user_id": ids["admin"], "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
                     DEV_DEFAULT_SECRET, algorithm="HS256")
    r = client.get("/me", headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 401, f"forged admin token accepted -> {r.json().get('role')}"


def test_token_for_deleted_or_unknown_user_rejected(client):
    tok = qa_token(client, ACCOUNTS["student"], user_id=999999, sub="999999")
    assert client.get("/me", headers={"Authorization": f"Bearer {tok}"}).status_code == 401


def test_logout_invalidates_token(client):
    r, body = register(client)
    tok = login(client, body["email"], body["password"]).json()["access_token"]
    h = {"Authorization": f"Bearer {tok}"}
    assert client.post("/logout", headers=h).status_code == 200
    assert client.get("/me", headers=h).status_code == 401, "token still valid after /logout"


def test_role_comes_from_db_not_token(client, ids):
    """A token whose 'role' claim says admin must not grant admin to a student."""
    tok = qa_token(client, ACCOUNTS["student"], role="admin")
    r = client.get("/users/", headers={"Authorization": f"Bearer {tok}"})
    me = client.get("/me", headers={"Authorization": f"Bearer {tok}"}).json()
    assert me["role"] == "student"


# ---------------- password change ----------------

def _fresh_user(client):
    r, body = register(client)
    tok = login(client, body["email"], body["password"]).json()["access_token"]
    return body, {"Authorization": f"Bearer {tok}"}


def test_password_change_requires_auth(client):
    r = client.put("/users/me/password", json={"current_password": "a", "new_password": "bbbbbbbb"})
    assert r.status_code == 401


def test_password_change_wrong_current_400(client):
    body, h = _fresh_user(client)
    r = client.put("/users/me/password", headers=h, json={"current_password": "nope", "new_password": "NewPass#123"})
    assert r.status_code == 400


def test_password_change_too_short_400(client):
    body, h = _fresh_user(client)
    r = client.put("/users/me/password", headers=h,
                   json={"current_password": body["password"], "new_password": "12"})
    # 422 since I-20 (schema min_length) - any 4xx rejection is correct
    assert r.status_code in (400, 422)


def test_password_change_missing_fields_422(client):
    body, h = _fresh_user(client)
    assert client.put("/users/me/password", headers=h, json={}).status_code == 422


def test_password_change_success_old_password_stops_working(client):
    body, h = _fresh_user(client)
    r = client.put("/users/me/password", headers=h,
                   json={"current_password": body["password"], "new_password": "NewPass#123"})
    assert r.status_code == 200
    assert login(client, body["email"], body["password"]).status_code == 401
    assert login(client, body["email"], "NewPass#123").status_code == 200


def test_password_change_revokes_existing_tokens(client):
    body, h = _fresh_user(client)
    client.put("/users/me/password", headers=h, json={"current_password": body["password"], "new_password": "NewPass#123"})
    assert client.get("/me", headers=h).status_code == 401, "old token still valid after password change"


def test_password_whitespace_is_silently_stripped(client):
    """new_password is .strip()-ed before hashing (main.py change_my_password) but login does not strip."""
    body, h = _fresh_user(client)
    client.put("/users/me/password", headers=h,
               json={"current_password": body["password"], "new_password": "  Spaced#123  "})
    assert login(client, body["email"], "  Spaced#123  ").status_code == 200, \
        "user cannot log in with the exact password they chose"


# ---------------- hardcoded default accounts ----------------

@pytest.mark.parametrize("email,pw", [
    ("osama.merhi@capstone.ps", "password123"),
    ("omarie@qou.edu", "Doctor@2025"),
    ("student@capstone.ps", "pass1234"),
    ("company@capstone.ps", "pass1234"),
])
def test_no_default_accounts_with_public_passwords(client, email, pw):
    """backend/seed.py runs on every startup (main.py:54-58) and creates these accounts with
    passwords that are committed to the repository."""
    r = login(client, email, pw)
    assert r.status_code == 401, f"{email} / {pw} logs in successfully"
