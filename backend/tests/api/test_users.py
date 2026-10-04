from typing import Any

import pytest
from fastapi.testclient import TestClient


def test_user_crud(client: TestClient) -> None:
    data = {"name": "Test Employee", "email": "employee@example.com", "role": "employee"}
    response = client.post("/api/v1/users", json=data)
    assert response.status_code == 201
    user = response.json()
    assert user == {"id": user["id"], **data}
    url = f"/api/v1/users/{user['id']}"
    assert client.get(url).json() == user
    assert client.get("/api/v1/users").json() == [user]
    updated = client.put(url, json={**data, "name": "Updated Employee", "role": "technician"})
    assert updated.status_code == 200
    assert updated.json()["name"] == "Updated Employee"
    assert updated.json()["role"] == "technician"
    deleted = client.delete(url)
    assert deleted.status_code == 204
    assert deleted.content == b""
    assert client.get(url).status_code == 404


def test_duplicate_email_create_returns_409(client: TestClient, employee: dict[str, Any]) -> None:
    response = client.post("/api/v1/users", json=employee)
    assert response.status_code == 409
    assert len(client.get("/api/v1/users").json()) == 1


def test_duplicate_email_update_returns_409(
    client: TestClient, employee: dict[str, Any], technician: dict[str, Any],
) -> None:
    response = client.put(f"/api/v1/users/{technician['id']}", json={**technician, "email": employee["email"]})
    assert response.status_code == 409
    assert client.get(f"/api/v1/users/{technician['id']}").json() == technician


@pytest.mark.parametrize("method", ["get", "put", "delete"])
def test_unknown_user_returns_404(client: TestClient, method: str) -> None:
    data = {"name": "Missing", "email": "missing@example.com", "role": "employee"}
    response = client.request(method, "/api/v1/users/-1", **({"json": data} if method == "put" else {}))
    assert response.status_code == 404
