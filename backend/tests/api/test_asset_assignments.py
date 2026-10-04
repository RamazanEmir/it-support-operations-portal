from typing import Any

from fastapi.testclient import TestClient


def test_assignment_create_and_return(
    client: TestClient, asset: dict[str, Any], employee: dict[str, Any],
) -> None:
    data = {"asset_id": asset["id"], "employee_id": employee["id"]}
    response = client.post("/api/v1/asset-assignments", json=data)
    assert response.status_code == 201
    assignment = response.json()
    assert assignment["returned_at"] is None
    url = f"/api/v1/asset-assignments/{assignment['id']}"
    assert client.get(url).json() == assignment
    assert client.get("/api/v1/asset-assignments").json() == [assignment]
    assert client.get(f"/api/v1/assets/{asset['id']}").json()["status"] == "assigned"
    response = client.post(url + "/return")
    assert response.status_code == 200
    assert response.json()["returned_at"] is not None
    assert client.get(f"/api/v1/assets/{asset['id']}").json()["status"] == "available"
    assert client.get(url).json() == response.json()
    assert client.get("/api/v1/asset-assignments").json() == [response.json()]
    # The partial index must allow a new active assignment after a return.
    assert client.post("/api/v1/asset-assignments", json=data).status_code == 201


def test_second_active_assignment_returns_409(client: TestClient, assignment: dict[str, Any]) -> None:
    data = {"asset_id": assignment["asset_id"], "employee_id": assignment["employee_id"]}
    assert client.post("/api/v1/asset-assignments", json=data).status_code == 409
    assert len(client.get("/api/v1/asset-assignments").json()) == 1


def test_second_return_returns_409(client: TestClient, assignment: dict[str, Any]) -> None:
    url = f"/api/v1/asset-assignments/{assignment['id']}/return"
    assert client.post(url).status_code == 200
    assert client.post(url).status_code == 409


def test_assignment_history_blocks_asset_and_user_delete(
    client: TestClient, assignment: dict[str, Any],
) -> None:
    assert client.post(f"/api/v1/asset-assignments/{assignment['id']}/return").status_code == 200
    assert client.delete(f"/api/v1/assets/{assignment['asset_id']}").status_code == 409
    assert client.delete(f"/api/v1/users/{assignment['employee_id']}").status_code == 409
