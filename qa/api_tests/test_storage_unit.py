"""storage.py against a mocked Supabase Storage API (no external account needed)."""
import io
import json
import os
import sys

import pytest

from conftest import QA_SECRET_KEY

BACKEND = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend"))


@pytest.fixture
def storage_mod(monkeypatch):
    monkeypatch.setenv("SECRET_KEY", QA_SECRET_KEY)
    sys.path.insert(0, BACKEND)
    import storage
    monkeypatch.setattr(storage, "SUPABASE_URL", "https://proj.supabase.co")
    monkeypatch.setattr(storage, "SUPABASE_SERVICE_KEY", "service-key")
    monkeypatch.setattr(storage, "SUPABASE_BUCKET", "capstone-files")
    calls = []

    class Resp(io.BytesIO):
        def __enter__(self):
            return self

        def __exit__(self, *a):
            return False

    def fake_urlopen(req, timeout=0):
        calls.append((req.get_method(), req.full_url, dict(req.header_items()), req.data))
        if "/object/sign/" in req.full_url:
            return Resp(json.dumps({"signedURL": "/object/sign/capstone-files/cvs/1/a.pdf?token=t"}).encode())
        return Resp(b"{}")

    monkeypatch.setattr(storage.urllib.request, "urlopen", fake_urlopen)
    return storage, calls


def test_supabase_upload_sign_delete(storage_mod):
    storage, calls = storage_mod
    assert storage.using_supabase()
    storage.save("cvs/1/a.pdf", b"%PDF-1.4", "application/pdf")
    url = storage.signed_url("cvs/1/a.pdf")
    storage.delete("cvs/1/a.pdf")
    (m1, u1, h1, d1), (m2, u2, _, d2), (m3, u3, _, d3) = calls
    assert (m1, u1) == ("POST", "https://proj.supabase.co/storage/v1/object/capstone-files/cvs/1/a.pdf")
    assert h1.get("Authorization") == "Bearer service-key" and d1 == b"%PDF-1.4"
    assert u2.endswith("/object/sign/capstone-files/cvs/1/a.pdf") and json.loads(d2) == {"expiresIn": 600}
    assert url == "https://proj.supabase.co/storage/v1/object/sign/capstone-files/cvs/1/a.pdf?token=t"
    assert m3 == "DELETE" and json.loads(d3) == {"prefixes": ["cvs/1/a.pdf"]}


def test_local_key_cannot_escape_storage_dir(monkeypatch):
    monkeypatch.setenv("SECRET_KEY", QA_SECRET_KEY)
    sys.path.insert(0, BACKEND)
    import storage
    with pytest.raises(storage.StorageError):
        storage._local_path("../../main.py")
