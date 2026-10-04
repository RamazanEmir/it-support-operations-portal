import re
from typing import Any

import jwt
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.security import create_access_token


def test_business_routes_require_authentication(anonymous_client: TestClient, app: FastAPI) -> None:
    checked = 0
    for path, operations in app.openapi()["paths"].items():
        if path in {"/api/v1/health", "/api/v1/auth/login", "/api/v1/auth/me"}:
            continue
        path = re.sub(r"\{[^}]+\}", "-1", path)
        for method in operations:
            response = anonymous_client.request(method, path, json={})
            assert response.status_code == 401, (method, path, response.status_code)
            assert response.headers["www-authenticate"] == "Bearer"
            checked += 1
    assert checked == 36
    health = anonymous_client.get("/api/v1/health")
    assert health.status_code == 200
    assert health.json() == {"status": "ok"}


def test_users_read_only_for_technician(
    client: TestClient, employee: dict[str, Any], technician_headers: dict[str, str],
) -> None:
    url = f"/api/v1/users/{employee['id']}"
    assert client.get("/api/v1/users", headers=technician_headers).status_code == 200
    assert client.get(url, headers=technician_headers).json() == employee
    assert client.post("/api/v1/users", headers=technician_headers, json={
        **employee, "password": "Test-only password 123!",
    }).status_code == 403
    assert client.put(url, headers=technician_headers, json=employee).status_code == 403
    assert client.delete(url, headers=technician_headers).status_code == 403
    assert client.get(url).json() == employee


def test_employee_cannot_access_staff_modules(
    client: TestClient, employee_headers: dict[str, str],
) -> None:
    for path in ["users", "assets", "asset-assignments", "work-logs"]:
        for method, suffix in [("GET", ""), ("GET", "/-1"), ("POST", "")]:
            assert client.request(method, f"/api/v1/{path}{suffix}", headers=employee_headers, json={}).status_code == 403
    for path in ["users", "assets", "work-logs"]:
        for method in ["PUT", "DELETE"]:
            assert client.request(method, f"/api/v1/{path}/-1", headers=employee_headers, json={}).status_code == 403
    assert client.post("/api/v1/asset-assignments/-1/return", headers=employee_headers).status_code == 403


@pytest.mark.parametrize("path,data_fixture", [("tickets", "ticket_data"), ("it-requests", "request_data")])
def test_employee_request_ownership(
    client: TestClient, employee: dict[str, Any], employee_headers: dict[str, str],
    request: pytest.FixtureRequest, path: str, data_fixture: str,
) -> None:
    data = request.getfixturevalue(data_fixture)
    other = client.post("/api/v1/users", json={
        "name": "Other Employee", "email": "other@example.com", "role": "employee",
        "password": "Test-only password 123!",
    })
    assert other.status_code == 201
    base = f"/api/v1/{path}"
    foreign = client.post(base, json={**data, "employee_id": other.json()["id"]})
    assert foreign.status_code == 201
    own_data = {key: value for key, value in data.items() if key != "employee_id"}
    own = client.post(base, headers=employee_headers, json=own_data)
    assert own.status_code == 201
    assert own.json()["employee_id"] == employee["id"]
    assert own.json()["status"] == ("open" if path == "tickets" else "pending")
    spoofed = client.post(base, headers=employee_headers, json={**data, "employee_id": other.json()["id"]})
    assert spoofed.status_code == 201
    assert spoofed.json()["employee_id"] == employee["id"]
    own_url = f"{base}/{own.json()['id']}"
    assert client.get(own_url, headers=employee_headers).json() == own.json()
    hidden = client.get(f"{base}/{foreign.json()['id']}", headers=employee_headers)
    missing = client.get(f"{base}/-1", headers=employee_headers)
    assert hidden.status_code == missing.status_code == 404
    assert hidden.json() == missing.json()
    listing = client.get(base, headers=employee_headers)
    assert listing.status_code == 200
    assert {row["id"] for row in listing.json()} == {own.json()["id"], spoofed.json()["id"]}
    assert client.put(own_url, headers=employee_headers, json={**own.json(), "resolution": None}).status_code == 403
    assert client.delete(own_url, headers=employee_headers).status_code == 403


@pytest.mark.parametrize("headers_fixture", ["admin_headers", "technician_headers"])
@pytest.mark.parametrize("path,data_fixture", [("tickets", "ticket_data"), ("it-requests", "request_data")])
def test_staff_create_requires_employee_id(
    client: TestClient, request: pytest.FixtureRequest, path: str, data_fixture: str, headers_fixture: str,
) -> None:
    headers = request.getfixturevalue(headers_fixture)
    data = {key: value for key, value in request.getfixturevalue(data_fixture).items() if key != "employee_id"}
    for extra in [{}, {"employee_id": None}]:
        assert client.post(f"/api/v1/{path}", headers=headers, json={**data, **extra}).status_code == 422
    assert client.get(f"/api/v1/{path}").json() == []


@pytest.mark.parametrize("path,data_fixture", [("tickets", "ticket_data"), ("it-requests", "request_data")])
def test_technician_can_read_create_update_but_not_delete_requests(
    client: TestClient, technician_headers: dict[str, str], request: pytest.FixtureRequest,
    path: str, data_fixture: str,
) -> None:
    base = f"/api/v1/{path}"
    data = request.getfixturevalue(data_fixture)
    admin_created = client.post(base, json=data)
    assert admin_created.status_code == 201
    created = client.post(base, headers=technician_headers, json=data)
    assert created.status_code == 201
    for headers in [None, technician_headers]:
        listing = client.get(base, headers=headers)
        assert listing.status_code == 200
        assert {row["id"] for row in listing.json()} == {admin_created.json()["id"], created.json()["id"]}
        assert client.get(f"{base}/{admin_created.json()['id']}", headers=headers).status_code == 200
    url = f"{base}/{created.json()['id']}"
    updated = client.put(url, headers=technician_headers, json={
        **data, "title": "Updated by technician", "status": "in_progress", "resolution": None,
    })
    assert updated.status_code == 200
    assert updated.json()["title"] == "Updated by technician"
    assert client.delete(url, headers=technician_headers).status_code == 403


def test_technician_asset_and_assignment_workflow(
    client: TestClient, technician_headers: dict[str, str], asset_data: dict[str, Any], employee: dict[str, Any],
    employee_headers: dict[str, str],
) -> None:
    created = client.post("/api/v1/assets", headers=technician_headers, json=asset_data)
    assert created.status_code == 201
    url = f"/api/v1/assets/{created.json()['id']}"
    assert client.get(url, headers=technician_headers).status_code == 200
    assert client.get("/api/v1/assets", headers=technician_headers).status_code == 200
    updated = client.put(url, headers=technician_headers, json={**asset_data, "name": "Updated asset", "status": "available"})
    assert updated.status_code == 200
    assert updated.json()["name"] == "Updated asset"
    assert client.delete(url, headers=technician_headers).status_code == 403
    assigned = client.post("/api/v1/asset-assignments", headers=technician_headers, json={
        "asset_id": created.json()["id"], "employee_id": employee["id"],
    })
    assert assigned.status_code == 201
    assignment_url = f"/api/v1/asset-assignments/{assigned.json()['id']}"
    assert client.get(assignment_url, headers=technician_headers).json() == assigned.json()
    assert client.get("/api/v1/asset-assignments", headers=technician_headers).json() == [assigned.json()]
    assert client.get(url).json()["status"] == "assigned"
    assert client.post(f"{assignment_url}/return", headers=employee_headers).status_code == 403
    assert client.get(assignment_url).json()["returned_at"] is None
    assert client.get(url).json()["status"] == "assigned"
    assert client.post(f"{assignment_url}/return", headers=technician_headers).status_code == 200
    assert client.get(url).json()["status"] == "available"


def test_technician_work_log_mutations_are_ownership_scoped(
    client: TestClient, technician: dict[str, Any], technician_headers: dict[str, str], work_log_data: dict[str, Any],
) -> None:
    other = client.post("/api/v1/users", json={
        "name": "Other Technician", "email": "other-tech@example.com", "role": "technician",
        "password": "Test-only password 123!",
    })
    assert other.status_code == 201
    spoofed_data = {**work_log_data, "technician_id": other.json()["id"]}
    foreign = client.post("/api/v1/work-logs", json=spoofed_data)
    own = client.post("/api/v1/work-logs", headers=technician_headers, json=spoofed_data)
    assert foreign.status_code == own.status_code == 201
    assert foreign.json()["technician_id"] == other.json()["id"]
    assert own.json()["technician_id"] == technician["id"]
    foreign_url = f"/api/v1/work-logs/{foreign.json()['id']}"
    own_url = f"/api/v1/work-logs/{own.json()['id']}"
    assert client.get(foreign_url, headers=technician_headers).json() == foreign.json()
    for headers in [None, technician_headers]:
        listing = client.get("/api/v1/work-logs", headers=headers)
        assert listing.status_code == 200
        assert {row["id"] for row in listing.json()} == {foreign.json()["id"], own.json()["id"]}
    updated = client.put(own_url, headers=technician_headers, json={**spoofed_data, "duration_minutes": 45})
    assert updated.status_code == 200
    assert updated.json()["technician_id"] == technician["id"]
    assert updated.json()["duration_minutes"] == 45
    assert client.put(foreign_url, headers=technician_headers, json=work_log_data).status_code == 403
    assert client.delete(foreign_url, headers=technician_headers).status_code == 403
    assert client.get(foreign_url).json() == foreign.json()
    assert client.delete(own_url, headers=technician_headers).status_code == 204
    assert client.get(own_url).status_code == 404
    admin_update = client.put(foreign_url, json=work_log_data)
    assert admin_update.status_code == 200
    assert admin_update.json()["technician_id"] == technician["id"]
    assert client.delete(foreign_url).status_code == 204


def test_knowledge_base_role_permissions(
    client: TestClient, employee_headers: dict[str, str], technician_headers: dict[str, str],
) -> None:
    data = {"title": "Network guide", "category": "Support", "content": "Plain text instructions"}
    created = client.post("/api/v1/knowledge-base", headers=technician_headers, json=data)
    assert created.status_code == 201
    url = f"/api/v1/knowledge-base/{created.json()['id']}"
    for headers in [employee_headers, technician_headers]:
        detail = client.get(url, headers=headers)
        assert detail.status_code == 200
        assert detail.json() == created.json()
        for params in [{}, {"search": "Network"}]:
            listing = client.get("/api/v1/knowledge-base", headers=headers, params=params)
            assert listing.status_code == 200
            assert listing.json() == [created.json()]
    assert client.post("/api/v1/knowledge-base", headers=employee_headers, json=data).status_code == 403
    assert client.put(url, headers=employee_headers, json=data).status_code == 403
    assert client.delete(url, headers=employee_headers).status_code == 403
    updated = client.put(url, headers=technician_headers, json={**data, "content": "Updated instructions"})
    assert updated.status_code == 200
    assert updated.json()["content"] == "Updated instructions"
    assert client.delete(url, headers=technician_headers).status_code == 403


@pytest.mark.parametrize("path", ["dashboard/summary", "analytics/overview"])
def test_reports_allow_staff_only(
    client: TestClient, technician_headers: dict[str, str], employee_headers: dict[str, str], path: str,
) -> None:
    assert client.get(f"/api/v1/{path}").status_code == 200
    assert client.get(f"/api/v1/{path}", headers=technician_headers).status_code == 200
    assert client.get(f"/api/v1/{path}", headers=employee_headers).status_code == 403


def test_authorization_uses_current_database_role(client: TestClient, employee: dict[str, Any]) -> None:
    headers = {"Authorization": "Bearer " + create_access_token(employee["id"])}
    assert client.get("/api/v1/users", headers=headers).status_code == 403
    url = f"/api/v1/users/{employee['id']}"
    assert client.put(url, json={**employee, "role": "technician"}).status_code == 200
    assert client.get("/api/v1/users", headers=headers).status_code == 200
    assert client.put(url, json=employee).status_code == 200
    assert client.get("/api/v1/users", headers=headers).status_code == 403


@pytest.mark.parametrize("new_role", ["admin", "employee"])
def test_technician_role_change_applies_to_same_token(
    client: TestClient, anonymous_client: TestClient, technician: dict[str, Any], new_role: str,
) -> None:
    login = anonymous_client.post("/api/v1/auth/login", json={
        "email": technician["email"], "password": "Test-only password 123!",
    })
    assert login.status_code == 200
    token = login.json()["access_token"]
    claims = jwt.decode(token, settings.jwt_secret_key, algorithms=["HS256"])
    assert set(claims) == {"sub", "exp"}
    assert claims["sub"] == str(technician["id"])
    headers = {"Authorization": "Bearer " + token}
    url = f"/api/v1/users/{technician['id']}"
    assert client.get("/api/v1/users", headers=headers).status_code == 200
    assert client.put(url, headers=headers, json=technician).status_code == 403
    assert client.put(url, json={**technician, "role": new_role}).status_code == 200
    current = anonymous_client.get("/api/v1/auth/me", headers=headers)
    assert current.status_code == 200
    assert current.json()["role"] == new_role
    expected = 200 if new_role == "admin" else 403
    assert client.get("/api/v1/users", headers=headers).status_code == expected
    assert client.put(url, headers=headers, json={**technician, "role": new_role}).status_code == expected


@pytest.mark.parametrize("path,headers_fixture", [
    ("users", "technician_headers"),
    ("tickets", "technician_headers"),
    ("it-requests", "admin_headers"),
    ("it-requests", "technician_headers"),
    ("assets", "admin_headers"),
    ("assets", "technician_headers"),
    ("asset-assignments", "admin_headers"),
    ("asset-assignments", "technician_headers"),
    ("work-logs", "technician_headers"),
    ("knowledge-base", "admin_headers"),
    ("knowledge-base", "technician_headers"),
    ("knowledge-base", "employee_headers"),
])
def test_authorized_missing_detail_returns_404(
    client: TestClient, request: pytest.FixtureRequest, path: str, headers_fixture: str,
) -> None:
    headers = request.getfixturevalue(headers_fixture)
    assert client.get(f"/api/v1/{path}/-1", headers=headers).status_code == 404
