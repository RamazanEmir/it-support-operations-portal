from fastapi.testclient import TestClient
import pytest


def test_article_crud(client: TestClient) -> None:
    data = {"title": "VPN Guide", "category": "Network", "content": "Connect securely."}
    response = client.post("/api/v1/knowledge-base", json=data)
    assert response.status_code == 201
    article = response.json()
    url = f"/api/v1/knowledge-base/{article['id']}"
    assert client.get(url).json() == article
    assert client.get("/api/v1/knowledge-base").json() == [article]
    data["content"] = "Updated <b>plain text</b>"
    response = client.put(url, json=data)
    assert response.status_code == 200
    assert response.json()["content"] == data["content"]
    response = client.delete(url)
    assert response.status_code == 204
    assert response.content == b""


@pytest.mark.parametrize("field", ["title", "category", "content"])
def test_article_search_is_case_insensitive(client: TestClient, field: str) -> None:
    data = {"title": "Guide", "category": "Network", "content": "Instructions", field: "UniqueNeedle"}
    created = client.post("/api/v1/knowledge-base", json=data)
    assert created.status_code == 201
    other = client.post("/api/v1/knowledge-base", json={"title": "Other", "category": "Other", "content": "Other"})
    assert other.status_code == 201
    response = client.get("/api/v1/knowledge-base", params={"search": "  uNIQUEnEEDLE  "})
    assert response.status_code == 200
    assert response.json() == [created.json()]


@pytest.mark.parametrize("search", ["%", "_"])
def test_search_preserves_ilike_wildcards(client: TestClient, search: str) -> None:
    created = client.post("/api/v1/knowledge-base", json={"title": "Guide", "category": "Network", "content": "Text"})
    assert created.status_code == 201
    response = client.get("/api/v1/knowledge-base", params={"search": search})
    assert response.status_code == 200
    assert response.json() == [created.json()]
