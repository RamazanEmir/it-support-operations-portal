from typing import Any

import pytest
from fastapi.testclient import TestClient


def test_ticket_crud(client: TestClient, ticket_data: dict[str, Any]) -> None:
    response = client.post("/api/v1/tickets", json=ticket_data)
    assert response.status_code == 201
    ticket = response.json()
    assert ticket["status"] == "open"
    assert ticket["resolution"] is None
    url = f"/api/v1/tickets/{ticket['id']}"
    assert client.get(url).json() == ticket
    assert client.get("/api/v1/tickets").json() == [ticket]
    data = {**ticket_data, "title": "Updated ticket", "priority": "high", "status": "resolved", "resolution": "Repaired"}
    response = client.put(url, json=data)
    assert response.status_code == 200
    assert all(response.json()[key] == value for key, value in data.items())
    response = client.put(url, json={**data, "resolution": None})
    assert response.status_code == 200
    assert response.json()["resolution"] is None
    response = client.delete(url)
    assert response.status_code == 204
    assert response.content == b""


def test_ticket_put_requires_resolution(client: TestClient, ticket: dict[str, Any]) -> None:
    data = {key: value for key, value in ticket.items() if key != "resolution"}
    assert client.put(f"/api/v1/tickets/{ticket['id']}", json=data).status_code == 422


@pytest.mark.parametrize("method", ["post", "put"])
def test_missing_requester_returns_404(client: TestClient, ticket: dict[str, Any], method: str) -> None:
    url = "/api/v1/tickets" if method == "post" else f"/api/v1/tickets/{ticket['id']}"
    assert client.request(method, url, json={**ticket, "employee_id": -1}).status_code == 404


def test_unknown_ticket_returns_404(client: TestClient) -> None:
    assert client.get("/api/v1/tickets/-1").status_code == 404


def test_user_with_ticket_cannot_be_deleted(
    client: TestClient, ticket: dict[str, Any],
) -> None:
    assert client.delete(f"/api/v1/users/{ticket['employee_id']}").status_code == 409
