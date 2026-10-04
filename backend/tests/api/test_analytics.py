from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.core.enums import AssetCategory, RequestType, TicketCategory, TicketPriority


@pytest.mark.parametrize("populated", [False, True])
def test_analytics_counts_and_zero_enum_rows(
    client: TestClient, request: pytest.FixtureRequest, populated: bool,
) -> None:
    if populated:
        ticket_data = request.getfixturevalue("ticket_data")
        for _ in range(2):
            assert client.post("/api/v1/tickets", json=ticket_data).status_code == 201
        request.getfixturevalue("it_request")
        request.getfixturevalue("asset")
    response = client.get("/api/v1/analytics/overview")
    assert response.status_code == 200
    data = response.json()
    groups = [
        ("tickets_by_category", "category", TicketCategory, "printer", 2),
        ("tickets_by_priority", "priority", TicketPriority, "medium", 2),
        ("it_requests_by_type", "request_type", RequestType, "software_installation", 1),
        ("assets_by_category", "category", AssetCategory, "laptop", 1),
    ]
    for group, field, enum_class, selected, count in groups:
        expected = {member.value: count if populated and member.value == selected else 0 for member in enum_class}
        assert len(data[group]) == len(expected)
        assert {row[field]: row["count"] for row in data[group]} == expected
    assert data["work_logs_by_technician"] == []


def test_work_log_analytics_by_technician(
    client: TestClient, technician: dict[str, Any], work_log_data: dict[str, Any],
) -> None:
    second = client.post("/api/v1/users", json={
        "name": "Second Technician", "email": "second@example.com", "role": "technician",
    })
    assert second.status_code == 201
    second_id = second.json()["id"]
    for technician_id, duration in [(technician["id"], 20), (technician["id"], 35), (second_id, 10)]:
        assert client.post("/api/v1/work-logs", json={
            **work_log_data, "technician_id": technician_id, "duration_minutes": duration,
        }).status_code == 201
    response = client.get("/api/v1/analytics/overview")
    assert response.status_code == 200
    rows = sorted(response.json()["work_logs_by_technician"], key=lambda row: row["technician_id"])
    assert rows == sorted([
        {"technician_id": technician["id"], "technician_name": technician["name"],
         "work_log_count": 2, "total_duration_minutes": 55},
        {"technician_id": second_id, "technician_name": "Second Technician",
         "work_log_count": 1, "total_duration_minutes": 10},
    ], key=lambda row: row["technician_id"])
