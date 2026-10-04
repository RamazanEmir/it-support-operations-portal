from typing import Any

import pytest
from fastapi.testclient import TestClient


def test_asset_crud(client: TestClient, asset_data: dict[str, Any]) -> None:
    response = client.post("/api/v1/assets", json=asset_data)
    assert response.status_code == 201
    asset = response.json()
    assert asset["status"] == "available"
    url = f"/api/v1/assets/{asset['id']}"
    assert client.get(url).json() == asset
    assert client.get("/api/v1/assets").json() == [asset]
    for status in ["maintenance", "retired", "available"]:
        data = {**asset_data, "name": "Updated laptop", "brand": "Updated brand", "status": status}
        response = client.put(url, json=data)
        assert response.status_code == 200
        assert all(response.json()[key] == value for key, value in data.items())
    response = client.delete(url)
    assert response.status_code == 204
    assert response.content == b""


@pytest.mark.parametrize("field", ["asset_tag", "serial_number"])
def test_duplicate_asset_identifier_returns_409(
    client: TestClient, asset: dict[str, Any], field: str,
) -> None:
    data = {**asset, "asset_tag": "OTHER-TAG", "serial_number": "OTHER-SERIAL", field: asset[field]}
    assert client.post("/api/v1/assets", json=data).status_code == 409


def test_generic_put_cannot_assign_asset(client: TestClient, asset: dict[str, Any]) -> None:
    url = f"/api/v1/assets/{asset['id']}"
    assert client.put(url, json={**asset, "status": "assigned"}).status_code == 409
    assert client.get(url).json()["status"] == "available"


@pytest.mark.parametrize("status", ["available", "maintenance", "retired"])
def test_generic_put_cannot_unassign_asset(
    client: TestClient, assignment: dict[str, Any], status: str,
) -> None:
    url = f"/api/v1/assets/{assignment['asset_id']}"
    asset = client.get(url).json()
    assert client.put(url, json={**asset, "status": status}).status_code == 409
    assert client.get(url).json()["status"] == "assigned"


def test_assigned_metadata_update_is_allowed(client: TestClient, assignment: dict[str, Any]) -> None:
    url = f"/api/v1/assets/{assignment['asset_id']}"
    asset = client.get(url).json()
    response = client.put(url, json={**asset, "name": "Updated assigned asset"})
    assert response.status_code == 200
    assert response.json()["name"] == "Updated assigned asset"
    assert response.json()["status"] == "assigned"
