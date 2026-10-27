"""OpenAPI/docs, error leakage, CORS, security config."""
import os
import subprocess
import sys

import pytest

BACKEND = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
PY = sys.executable


def test_openapi_json_200(client):
    r = client.get("/openapi.json")
    assert r.status_code == 200, f"{r.status_code}: {r.text[:160]}"


def test_docs_page_loads_schema(client):
    assert client.get("/docs").status_code == 200
    assert client.get("/openapi.json").status_code == 200, "/docs HTML loads but its schema fetch fails"


def test_analytics_overview_200(client):
    r = client.get("/analytics/overview")
    assert r.status_code == 200, f"{r.status_code}: {r.text[:160]}"


def test_schemas_import_on_python_311_semantics():
    """schemas.py uses List without importing it. On Python <3.14 this is a NameError at import time
    (whole app fails to boot); on 3.14 it is deferred to the first use. Check the source directly."""
    src = open(os.path.join(BACKEND, "schemas.py"), encoding="utf-8").read()
    uses_list = "List[" in src
    imports_list = any(l.startswith("from typing import") and "List" in l for l in src.splitlines())
    assert not uses_list or imports_list, "schemas.py uses List[...] but never imports it"


# ---------------- error leakage ----------------

def _leaks(text):
    needles = ["Traceback", "sqlalchemy", "psycopg2", "pydantic", "TypeAdapter", "not fully defined",
               "StringDataRightTruncation", "INSERT INTO", "File \""]
    return [n for n in needles if n.lower() in text.lower()]


def test_500_does_not_leak_internals(client):
    r = client.get("/openapi.json")
    assert not _leaks(r.text), f"500 body leaks: {_leaks(r.text)}"


def test_db_error_does_not_leak_sql(api):
    r = api.call("company", "POST", "/projects/", json={"title": "T" * 400})
    assert not _leaks(r.text), f"{r.status_code} body leaks: {_leaks(r.text)} :: {r.text[:200]}"


def test_register_db_error_does_not_leak_sql(client):
    r = client.post("/users/", json={"full_name": "x" * 300, "email": "qa_long@example.com", "password": "Strong#123"})
    assert not _leaks(r.text), f"{r.status_code} body leaks: {_leaks(r.text)} :: {r.text[:200]}"


def test_404_and_422_are_generic(client):
    assert not _leaks(client.get("/projects/abc").text)
    assert not _leaks(client.get("/does-not-exist").text)


# ---------------- CORS ----------------

def preflight(client, origin):
    return client.options("/projects/", headers={"Origin": origin, "Access-Control-Request-Method": "GET"})


def test_cors_allows_real_frontend(client):
    r = preflight(client, "https://capstone-market.vercel.app")
    assert r.headers.get("access-control-allow-origin") == "https://capstone-market.vercel.app"


def test_cors_rejects_random_vercel_app(client):
    r = preflight(client, "https://attacker-demo.vercel.app")
    assert r.headers.get("access-control-allow-origin") is None, \
        "any *.vercel.app site is an allowed credentialed origin (allow_origin_regex)"


def test_cors_rejects_foreign_origin(client):
    assert preflight(client, "https://evil.example").headers.get("access-control-allow-origin") is None


def test_error_handler_does_not_reflect_arbitrary_origin(client):
    r = client.get("/openapi.json", headers={"Origin": "https://evil.example"})
    assert r.headers.get("access-control-allow-origin") != "https://evil.example", \
        "global 500 handler reflects any Origin with Allow-Credentials: true"


# ---------------- config / secrets ----------------

def _boot_utils(env):
    full = {k: v for k, v in os.environ.items() if k not in ("SECRET_KEY", "RENDER", "ENVIRONMENT")}
    full.update(env)
    return subprocess.run([PY, "-c", "import utils"], cwd=BACKEND, env=full, capture_output=True, text=True)


def test_production_refuses_missing_secret():
    assert _boot_utils({"ENVIRONMENT": "production"}).returncode != 0


def test_production_refuses_example_secret():
    assert _boot_utils({"ENVIRONMENT": "production", "SECRET_KEY": "capstone_secret_key_change_in_production"}).returncode != 0


def test_non_production_without_secret_fails_closed():
    """Any deploy that forgets ENVIRONMENT=production (or RENDER=true) silently uses the public default key."""
    assert _boot_utils({}).returncode != 0, "server boots with the hardcoded default SECRET_KEY"


def test_security_headers_present(client):
    r = client.get("/")
    missing = [h for h in ("x-content-type-options", "x-frame-options", "strict-transport-security")
               if h not in r.headers]
    assert not missing, f"missing security headers: {missing}"


def test_uploads_dir_is_gitignored():
    gi = open(os.path.join(BACKEND, ".gitignore"), encoding="utf-8").read()
    assert "uploads" in gi, "backend/uploads (user CVs) is not in .gitignore"


def test_requirements_are_pinned():
    req = open(os.path.join(BACKEND, "requirements.txt"), encoding="utf-8").read().splitlines()
    loose = [l for l in req if l.strip() and not l.strip().startswith("#") and "==" not in l]
    assert not loose, f"unpinned: {loose}"


def test_email_validator_dependency_declared():
    req = open(os.path.join(BACKEND, "requirements.txt"), encoding="utf-8").read().lower()
    assert "email-validator" in req or "pydantic[email]" in req, \
        "schemas.py uses EmailStr but email-validator is not in requirements.txt"
