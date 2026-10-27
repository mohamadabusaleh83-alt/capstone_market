"""Rate limits that the shared QA server raises (per-IP login, registration): exercised in-process
with tight limits so they can be asserted without slowing the live suite."""
import importlib
import os
import sys

import pytest
from fastapi.testclient import TestClient

from conftest import QA_SECRET_KEY

BACKEND = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend"))


@pytest.fixture(scope="module")
def app_module():
    os.environ.setdefault("DATABASE_URL", os.environ.get("QA_DATABASE_URL",
                          "postgresql+psycopg2://postgres@127.0.0.1:54329/capstone_qa_phase1"))
    os.environ["SECRET_KEY"] = QA_SECRET_KEY
    sys.path.insert(0, BACKEND)
    import ratelimit
    import main
    return main, ratelimit


def test_client_ip_uses_rightmost_forwarded_entry():
    sys.path.insert(0, BACKEND)
    import ratelimit
    from starlette.requests import Request
    req = Request({"type": "http", "headers": [(b"x-forwarded-for", b"6.6.6.6, 203.0.113.9")], "client": ("10.0.0.1", 1)})
    assert ratelimit.client_ip(req) == "203.0.113.9"


def test_login_per_ip_limit_429(app_module):
    main, ratelimit = app_module
    ratelimit.LOGIN_IP_LIMITER = ratelimit.SlidingWindowLimiter(3, 60)
    c = TestClient(main.app)
    codes = [c.post("/login", data={"username": f"nobody{i}@example.com", "password": "x"}).status_code for i in range(5)]
    assert codes[:3] == [401, 401, 401] and codes[3:] == [429, 429], codes


def test_register_per_ip_limit_429(app_module):
    main, ratelimit = app_module
    ratelimit.REGISTER_IP_LIMITER = ratelimit.SlidingWindowLimiter(2, 60)
    c = TestClient(main.app)
    import uuid
    codes = [c.post("/users/", json={"full_name": "QA Limit", "email": f"qa_lim_{uuid.uuid4().hex[:8]}@example.com",
                                     "password": "Strong#123"}).status_code for _ in range(3)]
    assert codes == [201, 201, 429], codes
