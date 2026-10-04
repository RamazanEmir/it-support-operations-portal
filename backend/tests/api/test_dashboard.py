from typing import Any

from fastapi.testclient import TestClient


def test_empty_dashboard(client: TestClient) -> None:
    response = client.get("/api/v1/dashboard/summary")
    assert response.status_code == 200
    assert response.json() == {
        "users_total": 1,  # Authentication admin; no business fixture data.
        "tickets": {"total": 0, "open": 0, "in_progress": 0, "resolved": 0, "closed": 0},
        "it_requests": {"total": 0, "pending": 0, "in_progress": 0, "completed": 0, "rejected": 0},
        "assets": {"total": 0, "available": 0, "assigned": 0, "maintenance": 0, "retired": 0},
        "active_assignments": 0, "work_logs": {"total": 0, "total_duration_minutes": 0},
        "knowledge_base_articles": 0,
    }


def test_dashboard_counts_all_modules(
    client: TestClient, ticket_data: dict[str, Any], request_data: dict[str, Any],
    asset_data: dict[str, Any], work_log_data: dict[str, Any], employee: dict[str, Any],
) -> None:
    for status in ["open", "in_progress", "resolved", "closed"]:
        created = client.post("/api/v1/tickets", json=ticket_data)
        assert created.status_code == 201
        response = client.put(f"/api/v1/tickets/{created.json()['id']}", json={
            **ticket_data, "status": status, "resolution": None,
        })
        assert response.status_code == 200
    for status in ["pending", "in_progress", "completed", "rejected"]:
        created = client.post("/api/v1/it-requests", json=request_data)
        assert created.status_code == 201
        assert client.put(f"/api/v1/it-requests/{created.json()['id']}", json={
            **request_data, "status": status,
        }).status_code == 200
    for status in ["available", "assigned", "maintenance", "retired"]:
        data = {**asset_data, "asset_tag": status, "serial_number": status}
        created = client.post("/api/v1/assets", json=data)
        assert created.status_code == 201
        asset_id = created.json()["id"]
        if status in {"available", "assigned"}:
            assigned = client.post("/api/v1/asset-assignments", json={
                "asset_id": asset_id, "employee_id": employee["id"],
            })
            assert assigned.status_code == 201
            if status == "available":
                assert client.post(f"/api/v1/asset-assignments/{assigned.json()['id']}/return").status_code == 200
        else:
            assert client.put(f"/api/v1/assets/{asset_id}", json={**data, "status": status}).status_code == 200
    for duration in [20, 35]:
        assert client.post("/api/v1/work-logs", json={**work_log_data, "duration_minutes": duration}).status_code == 201
    assert client.post("/api/v1/knowledge-base", json={
        "title": "Guide", "category": "Support", "content": "Instructions",
    }).status_code == 201
    response = client.get("/api/v1/dashboard/summary")
    assert response.status_code == 200
    assert response.json() == {
        "users_total": 3,  # Admin, employee and technician.
        "tickets": {"total": 4, "open": 1, "in_progress": 1, "resolved": 1, "closed": 1},
        "it_requests": {"total": 4, "pending": 1, "in_progress": 1, "completed": 1, "rejected": 1},
        "assets": {"total": 4, "available": 1, "assigned": 1, "maintenance": 1, "retired": 1},
        "active_assignments": 1, "work_logs": {"total": 2, "total_duration_minutes": 55},
        "knowledge_base_articles": 1,
    }
