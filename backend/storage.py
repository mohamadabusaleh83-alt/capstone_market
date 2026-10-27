"""
Private file storage for CVs and report files.

* Supabase Storage when SUPABASE_URL and SUPABASE_SERVICE_KEY are set
  (bucket: SUPABASE_STORAGE_BUCKET, default "capstone-files"; create it as a
  PRIVATE bucket). Files are only reachable through short-lived signed URLs.
* Otherwise a local fallback under backend/uploads/private, which is NOT
  served statically; downloads go through /files/{token}, where the token is
  a short-lived JWT signed with SECRET_KEY. Local files do not survive a
  Render redeploy, so configure Supabase in production.

Uses only the standard library for HTTP so no extra dependency is needed.
"""
import json
import logging
import os
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt

import utils

logger = logging.getLogger("capstone_storage")

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "").strip()
SUPABASE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "capstone-files").strip() or "capstone-files"
LOCAL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads", "private")
SIGNED_URL_TTL_SECONDS = 600


class StorageError(Exception):
    pass


def using_supabase() -> bool:
    return bool(SUPABASE_URL and SUPABASE_SERVICE_KEY)


def _supabase_request(method: str, path: str, body: Optional[bytes] = None, content_type: str = "application/json"):
    req = urllib.request.Request(
        f"{SUPABASE_URL}/storage/v1/{path}",
        data=body,
        method=method,
        headers={
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "apikey": SUPABASE_SERVICE_KEY,
            "Content-Type": content_type,
            "x-upsert": "true",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            raw = resp.read()
            return json.loads(raw) if raw else {}
    except (urllib.error.URLError, ValueError) as e:
        raise StorageError(f"Supabase storage request failed: {method} {path}") from e


def _quote_key(key: str) -> str:
    return urllib.parse.quote(key, safe="/")


def _local_path(key: str) -> str:
    path = os.path.abspath(os.path.join(LOCAL_DIR, key))
    if not path.startswith(os.path.abspath(LOCAL_DIR) + os.sep):
        raise StorageError("invalid storage key")
    return path


def save(key: str, data: bytes, content_type: str) -> None:
    if using_supabase():
        _supabase_request("POST", f"object/{SUPABASE_BUCKET}/{_quote_key(key)}", data, content_type)
        return
    path = _local_path(key)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(data)


def delete(key: Optional[str]) -> None:
    """Best effort: a failed delete must never break the user's request."""
    if not key:
        return
    try:
        if using_supabase():
            _supabase_request("DELETE", f"object/{SUPABASE_BUCKET}", json.dumps({"prefixes": [key]}).encode())
        else:
            path = _local_path(key)
            if os.path.exists(path):
                os.remove(path)
    except Exception:
        logger.warning("Could not delete stored file %s", key, exc_info=True)


def signed_url(key: str) -> str:
    """A short-lived download URL. Local fallback returns an API-relative path."""
    if using_supabase():
        data = _supabase_request(
            "POST", f"object/sign/{SUPABASE_BUCKET}/{_quote_key(key)}",
            json.dumps({"expiresIn": SIGNED_URL_TTL_SECONDS}).encode(),
        )
        signed = data.get("signedURL") or data.get("signedUrl")
        if not signed:
            raise StorageError("Supabase did not return a signed URL")
        return f"{SUPABASE_URL}/storage/v1{signed}"
    token = jwt.encode(
        {"k": key, "purpose": "file", "exp": datetime.now(timezone.utc) + timedelta(seconds=SIGNED_URL_TTL_SECONDS)},
        utils.SECRET_KEY, algorithm=utils.ALGORITHM,
    )
    return f"/files/{token}"


def resolve_local_token(token: str) -> Optional[str]:
    """Path of a locally stored file for a valid download token, else None."""
    try:
        payload = jwt.decode(token, utils.SECRET_KEY, algorithms=[utils.ALGORITHM])
    except JWTError:
        return None
    if payload.get("purpose") != "file" or not payload.get("k"):
        return None
    try:
        path = _local_path(payload["k"])
    except StorageError:
        return None
    return path if os.path.exists(path) else None


# ---------- content validation ----------

PDF_MAGIC = b"%PDF-"
ZIP_MAGIC = b"PK\x03\x04"            # docx / pptx / xlsx / zip
OLE_MAGIC = b"\xd0\xcf\x11\xe0"       # legacy .doc / .ppt

REPORT_TYPES = {
    ".pdf": ("application/pdf", PDF_MAGIC),
    ".docx": ("application/vnd.openxmlformats-officedocument.wordprocessingml.document", ZIP_MAGIC),
    ".pptx": ("application/vnd.openxmlformats-officedocument.presentationml.presentation", ZIP_MAGIC),
    ".zip": ("application/zip", ZIP_MAGIC),
    ".doc": ("application/msword", OLE_MAGIC),
}
