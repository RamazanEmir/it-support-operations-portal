from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, verify_password
from app.models import User

TEST_PASSWORD = "Test-only password 123!"


def test_login_and_current_user(anonymous_client: TestClient, employee: dict[str, Any]) -> None:
    response = anonymous_client.post("/api/v1/auth/login", json={"email": employee["email"], "password": TEST_PASSWORD})
    assert response.status_code == 200
    token = response.json()
    assert set(token) == {"access_token", "token_type"}
    assert token["token_type"] == "bearer"
    claims = jwt.decode(token["access_token"], settings.jwt_secret_key, algorithms=["HS256"])
    assert set(claims) == {"sub", "exp"}
    assert claims["sub"] == str(employee["id"])
    remaining = claims["exp"] - datetime.now(timezone.utc).timestamp()
    assert 0 < remaining <= settings.access_token_expire_minutes * 60
    response = anonymous_client.get("/api/v1/auth/me", headers={"Authorization": "Bearer " + token["access_token"]})
    assert response.status_code == 200
    assert response.json() == employee


def test_bad_credentials_have_same_response(client: TestClient, employee: dict[str, Any]) -> None:
    wrong = client.post("/api/v1/auth/login", json={"email": employee["email"], "password": "Wrong password 123!"})
    unknown = client.post("/api/v1/auth/login", json={"email": "unknown@example.com", "password": TEST_PASSWORD})
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.json() == unknown.json()
    assert wrong.headers["www-authenticate"] == unknown.headers["www-authenticate"] == "Bearer"


@pytest.mark.parametrize("authorization", [None, "Bearer invalid", "Basic invalid", "Bearer"])
def test_missing_or_malformed_token_returns_401(anonymous_client: TestClient, authorization: str | None) -> None:
    response = anonymous_client.get("/api/v1/auth/me", headers={"Authorization": authorization} if authorization else {})
    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


@pytest.mark.parametrize("case", ["expired", "missing_exp", "missing_sub", "wrong_algorithm", "invalid_sub", "large_sub", "invalid_exp"])
def test_invalid_claims_return_401(client: TestClient, employee: dict[str, Any], case: str) -> None:
    payload = {"sub": str(employee["id"]), "exp": datetime.now(timezone.utc) + timedelta(minutes=5)}
    algorithm = "HS256"
    if case == "expired":
        payload["exp"] = datetime.now(timezone.utc) - timedelta(seconds=1)
    elif case == "missing_exp":
        del payload["exp"]
    elif case == "missing_sub":
        del payload["sub"]
    elif case == "wrong_algorithm":
        algorithm = "HS384"
    elif case == "invalid_sub":
        payload["sub"] = "not-an-id"
    elif case == "invalid_exp":
        payload["exp"] = []
    else:
        payload["sub"] = "999999999999999999999999"
    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=algorithm)
    for path in ["/api/v1/auth/me", "/api/v1/tickets"]:
        response = client.get(path, headers={"Authorization": "Bearer " + token})
        assert response.status_code == 401
        assert response.headers["www-authenticate"] == "Bearer"


def test_deleted_user_token_returns_401(client: TestClient, employee: dict[str, Any]) -> None:
    token = create_access_token(employee["id"])
    assert client.delete(f"/api/v1/users/{employee['id']}").status_code == 204
    for path in ["/api/v1/auth/me", "/api/v1/tickets"]:
        response = client.get(path, headers={"Authorization": "Bearer " + token})
        assert response.status_code == 401
        assert response.headers["www-authenticate"] == "Bearer"


def test_current_role_is_loaded_from_database(client: TestClient, employee: dict[str, Any]) -> None:
    token = create_access_token(employee["id"])
    assert client.put(f"/api/v1/users/{employee['id']}", json={**employee, "role": "technician"}).status_code == 200
    response = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer " + token})
    assert response.status_code == 200
    assert response.json()["role"] == "technician"


def test_argon2_hash_and_public_response(client: TestClient, employee: dict[str, Any], db_session: Session) -> None:
    user = db_session.get(User, employee["id"])
    assert user.password_hash.startswith("$argon2id$")
    assert user.password_hash != TEST_PASSWORD
    assert verify_password(TEST_PASSWORD, user.password_hash)
    assert set(employee) == {"id", "name", "email", "role"}
    assert set(client.get(f"/api/v1/users/{user.id}").json()) == set(employee)
    assert all(set(row) == set(employee) for row in client.get("/api/v1/users").json())


@pytest.mark.parametrize("length,status", [(0, 422), (11, 422), (12, 201), (128, 201), (129, 422)])
def test_unicode_password_length(client: TestClient, length: int, status: int) -> None:
    response = client.post("/api/v1/users", json={
        "name": "Length Test", "email": "length@example.com", "role": "employee",
        "password": "\U0001f600" * length,
    })
    assert response.status_code == status


def test_password_whitespace_is_preserved(client: TestClient, db_session: Session) -> None:
    password = "  password  "
    response = client.post("/api/v1/users", json={
        "name": "  Trim name  ", "email": "spaces@example.com", "role": "employee", "password": password,
    })
    assert response.status_code == 201
    assert response.json()["name"] == "Trim name"
    user = db_session.get(User, response.json()["id"])
    assert verify_password(password, user.password_hash)
    assert not verify_password(password.strip(), user.password_hash)


@pytest.mark.parametrize("extra", [{}, {"password": None}])
def test_password_update_preserves_hash(
    client: TestClient, employee: dict[str, Any], db_session: Session, extra: dict[str, Any],
) -> None:
    user = db_session.get(User, employee["id"])
    previous = user.password_hash
    response = client.put(f"/api/v1/users/{user.id}", json={**employee, **extra})
    assert response.status_code == 200
    db_session.refresh(user)
    assert user.password_hash == previous


def test_password_update_changes_login(client: TestClient, employee: dict[str, Any], db_session: Session) -> None:
    user = db_session.get(User, employee["id"])
    previous = user.password_hash
    password = "A new password 456!"
    response = client.put(f"/api/v1/users/{user.id}", json={**employee, "password": password})
    assert response.status_code == 200
    assert set(response.json()) == {"id", "name", "email", "role"}
    db_session.refresh(user)
    assert user.password_hash != previous
    assert verify_password(password, user.password_hash)
    assert client.post("/api/v1/auth/login", json={"email": employee["email"], "password": TEST_PASSWORD}).status_code == 401
    assert client.post("/api/v1/auth/login", json={"email": employee["email"], "password": password}).status_code == 200
    assert client.put(f"/api/v1/users/{user.id}", json={**employee, "password": ""}).status_code == 422


@pytest.mark.parametrize("endpoint", ["/api/v1/users", "/api/v1/auth/login"])
def test_password_validation_does_not_echo_input(client: TestClient, endpoint: str) -> None:
    password = "shortsecret"
    response = client.post(endpoint, json={
        "name": "Privacy Test", "email": "privacy@example.com", "role": "employee", "password": password,
    })
    assert response.status_code == 422
    assert password not in response.text


def test_missing_field_validation_does_not_echo_password(client: TestClient) -> None:
    response = client.post("/api/v1/users", json={"password": TEST_PASSWORD})
    assert response.status_code == 422
    assert TEST_PASSWORD not in response.text
