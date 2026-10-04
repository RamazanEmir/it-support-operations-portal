from typing import Any

import pytest
from fastapi.testclient import TestClient


def test_it_request_crud(client: TestClient, request_data: dict[str, Any]) -> None:
    response = client.post("/api/v1/it-requests", json=request_data)
    assert response.status_code == 201
    request = response.json()
    assert request["status"] == "pending"
    url = f"/api/v1/it-requests/{request['id']}"
    assert client.get(url).json() == request
    assert client.get("/api/v1/it-requests").json() == [request]
    data = {**request_data, "title": "Updated request", "status": "completed"}
    response = client.put(url, json=data)
    assert response.status_code == 200
    assert all(response.json()[key] == value for key, value in data.items())
    response = client.delete(url)
    assert response.status_code == 204
    assert response.content == b""


@pytest.mark.parametrize("method", ["post", "put"])
def test_missing_employee_returns_404(client: TestClient, it_request: dict[str, Any], method: str) -> None:
    url = "/api/v1/it-requests" if method == "post" else f"/api/v1/it-requests/{it_request['id']}"
    assert client.request(method, url, json={**it_request, "employee_id": -1}).status_code == 404


def test_work_log_history_blocks_request_delete(
    client: TestClient, it_request: dict[str, Any], work_log_data: dict[str, Any],
) -> None:
    response = client.post("/api/v1/work-logs", json={**work_log_data, "it_request_id": it_request["id"]})
    assert response.status_code == 201
    assert client.delete(f"/api/v1/it-requests/{it_request['id']}").status_code == 409
    assert client.get(f"/api/v1/it-requests/{it_request['id']}").status_code == 200
