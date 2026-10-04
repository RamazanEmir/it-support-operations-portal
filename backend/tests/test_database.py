from collections.abc import Generator
from pathlib import Path

from alembic.config import Config
from alembic.migration import MigrationContext
from alembic.script import ScriptDirectory
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import Engine, inspect, text
from sqlalchemy.orm import Session


def test_database_is_test_database(test_engine: Engine) -> None:
    with test_engine.connect() as connection:
        assert connection.scalar(text("SELECT current_database()")) == "it_support_operations_portal_test"


def test_migration_is_at_head(test_engine: Engine) -> None:
    config = Config(str(Path(__file__).resolve().parents[1] / "alembic.ini"))
    with test_engine.connect() as connection:
        current = MigrationContext.configure(connection).get_current_heads()
    assert set(current) == set(ScriptDirectory.from_config(config).get_heads())


def test_active_assignment_partial_unique_index(test_engine: Engine) -> None:
    indexes = inspect(test_engine).get_indexes("asset_assignments")
    index = next(item for item in indexes if item["name"] == "uq_asset_assignments_active_asset")
    assert index["unique"]
    assert index["column_names"] == ["asset_id"]
    assert "returned_at IS NULL" in index["dialect_options"]["postgresql_where"]


def test_service_commit_and_rollback_remain_isolated(app: FastAPI, test_engine: Engine) -> None:
    from app.core.database import get_db

    data = {"name": "Isolation Employee", "email": "isolation@example.com", "role": "employee"}
    previous_overrides = app.dependency_overrides.copy()
    with test_engine.connect() as connection:
        transaction = connection.begin()
        session = Session(bind=connection, autoflush=False, join_transaction_mode="create_savepoint")

        def override_get_db() -> Generator[Session, None, None]:
            yield session

        app.dependency_overrides[get_db] = override_get_db
        try:
            with TestClient(app) as client:
                assert client.post("/api/v1/users", json=data).status_code == 201
                assert client.post("/api/v1/users", json=data).status_code == 409
                assert client.get("/api/v1/users").json()[0]["email"] == data["email"]
                assert client.post(
                    "/api/v1/users", json={**data, "email": "second@example.com"}
                ).status_code == 201
                with test_engine.connect() as observer:
                    assert observer.scalar(text("SELECT count(*) FROM users")) == 0
        finally:
            app.dependency_overrides.clear()
            app.dependency_overrides.update(previous_overrides)
            session.close()
            transaction.rollback()
    with test_engine.connect() as observer:
        assert observer.scalar(text("SELECT count(*) FROM users")) == 0


def test_client_starts_without_previous_data(client: TestClient) -> None:
    response = client.get("/api/v1/users")
    assert response.status_code == 200
    assert response.json() == []
