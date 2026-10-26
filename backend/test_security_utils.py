import os
import logging
import importlib
import pytest
import utils


def test_password_hashing_and_verification():
    pwd = "MySecretPassword123!"
    hashed = utils.hash_password(pwd)
    assert hashed != pwd
    assert utils.verify_password(pwd, hashed) is True
    assert utils.verify_password("wrong_password", hashed) is False
    assert utils.verify_password("", hashed) is False
    assert utils.verify_password(pwd, "") is False


def test_token_creation_and_decoding():
    data = {"sub": "123", "user_id": 123, "role": "student"}
    token = utils.create_access_token(data)
    assert token is not None

    payload = utils.decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "123"
    assert payload["user_id"] == 123
    assert payload["role"] == "student"

    user_id = utils.verify_access_token(token)
    assert user_id == 123


def test_production_enforcement_missing_secret(caplog):
    caplog.set_level(logging.INFO)
    os.environ["ENVIRONMENT"] = "production"
    os.environ["SECRET_KEY"] = ""
    try:
        with pytest.raises(RuntimeError) as exc_info:
            importlib.reload(utils)
        assert "missing or empty" in str(exc_info.value)
        assert "present=False" in caplog.text
    finally:
        os.environ.pop("ENVIRONMENT", None)
        os.environ.pop("SECRET_KEY", None)
        importlib.reload(utils)


def test_production_enforcement_insecure_defaults():
    for insecure in [
        "your-super-secret-key-change-this-in-production",
        "capstone_secret_key_change_in_production",
        "CAPSTONE_SECRET_KEY_CHANGE_IN_PRODUCTION",
        "secret",
        "changeme",
        "admin",
        "password",
    ]:
        os.environ["ENVIRONMENT"] = "production"
        os.environ["SECRET_KEY"] = insecure
        try:
            with pytest.raises(RuntimeError) as exc_info:
                importlib.reload(utils)
            assert "insecure/example" in str(exc_info.value)
        finally:
            os.environ.pop("ENVIRONMENT", None)
            os.environ.pop("SECRET_KEY", None)
            importlib.reload(utils)


def test_production_enforcement_short_key():
    os.environ["ENVIRONMENT"] = "production"
    os.environ["SECRET_KEY"] = "short_key_12345"
    try:
        with pytest.raises(RuntimeError) as exc_info:
            importlib.reload(utils)
        assert "length is 15 characters" in str(exc_info.value)
    finally:
        os.environ.pop("ENVIRONMENT", None)
        os.environ.pop("SECRET_KEY", None)
        importlib.reload(utils)


def test_production_enforcement_valid_strong_key_with_quotes():
    strong_key = "x" * 64
    os.environ["RENDER"] = "true"
    os.environ["SECRET_KEY"] = f'"{strong_key}"'
    try:
        importlib.reload(utils)
        assert utils.SECRET_KEY == strong_key
        assert utils.IS_PRODUCTION is True
    finally:
        os.environ.pop("RENDER", None)
        os.environ.pop("SECRET_KEY", None)
        importlib.reload(utils)


def test_development_fallback_secret():
    os.environ.pop("ENVIRONMENT", None)
    os.environ.pop("RENDER", None)
    os.environ.pop("SECRET_KEY", None)
    importlib.reload(utils)
    assert utils.IS_PRODUCTION is False
    assert utils.SECRET_KEY == utils.DEV_DEFAULT_SECRET
