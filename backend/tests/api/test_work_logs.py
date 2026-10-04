from typing import Any

import pytest
from fastapi.testclient import TestClient


@pytest.mark.parametrize("relation", ["none", "ticket", "it_request"])
def test_work_log_create(
    client: TestClient, work_log_data: dict[str, Any], request: pytest.FixtureRequest, relation: str,
) -> None:
    data = dict(work_log_data)
    if relation != "none":
        data[relation + "_id"] = request.getfixturevalue(relation)["id"]
    response = client.post("/api/v1/work-logs", json=data)
    assert response.status_code == 201
    log = response.json()
    assert all(log[key] == value for key, value in data.items())
    assert log["work_date"] == "2026-01-15"
    assert client.get(f"/api/v1/work-logs/{log['id']}").json() == log
    assert client.get("/api/v1/work-logs").json() == [log]


def test_non_technician_returns_409(
    client: TestClient, employee: dict[str, Any], work_log_data: dict[str, Any],
) -> None:
    response = client.post("/api/v1/work-logs", json={**work_log_data, "technician_id": employee["id"]})
    assert response.status_code == 409


def test_two_references_return_422(
    client: TestClient, work_log_data: dict[str, Any], ticket: dict[str, Any], it_request: dict[str, Any],
) -> None:
    response = client.post("/api/v1/work-logs", json={
        **work_log_data, "ticket_id": ticket["id"], "it_request_id": it_request["id"],
    })
    assert response.status_code == 422


@pytest.mark.parametrize("duration", [0, -1, 1.5])
def test_invalid_duration_returns_422(
    client: TestClient, work_log_data: dict[str, Any], duration: float,
) -> None:
    assert client.post("/api/v1/work-logs", json={**work_log_data, "duration_minutes": duration}).status_code == 422


@pytest.mark.parametrize("field", ["ticket_id", "it_request_id"])
def test_missing_relation_returns_404(
    client: TestClient, work_log_data: dict[str, Any], field: str,
) -> None:
    assert client.post("/api/v1/work-logs", json={**work_log_data, field: -1}).status_code == 404


def test_work_log_full_update_and_delete(
    client: TestClient, work_log_data: dict[str, Any], ticket: dict[str, Any], it_request: dict[str, Any],
) -> None:
    response = client.post("/api/v1/work-logs", json={**work_log_data, "ticket_id": ticket["id"]})
    assert response.status_code == 201
    url = f"/api/v1/work-logs/{response.json()['id']}"
    assert client.delete(f"/api/v1/tickets/{ticket['id']}").status_code == 409
    assert client.delete(f"/api/v1/users/{work_log_data['technician_id']}").status_code == 409
    data = {**work_log_data, "description": "Updated work", "duration_minutes": 45, "it_request_id": it_request["id"]}
    response = client.put(url, json=data)
    assert response.status_code == 200
    assert all(response.json()[key] == value for key, value in data.items())
    incomplete = {key: value for key, value in data.items() if key != "ticket_id"}
    assert client.put(url, json=incomplete).status_code == 422
    response = client.delete(url)
    assert response.status_code == 204
    assert response.content == b""
    assert client.get(url).status_code == 404
