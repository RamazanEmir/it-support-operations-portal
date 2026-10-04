import os
import secrets
import sys
from collections.abc import Generator
from pathlib import Path
from typing import Any

import pytest
from alembic import command
from alembic.config import Config
from dotenv import dotenv_values
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import Engine, inspect, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session

TEST_DATABASE_NAME = "it_support_operations_portal_test"
BACKEND_DIR = Path(__file__).resolve().parents[1]
BUSINESS_TABLES = (
    "users", "tickets", "it_requests", "assets", "asset_assignments",
    "work_logs", "knowledge_base_articles",
)


def pytest_configure(config: pytest.Config) -> None:
    test_env_file = BACKEND_DIR / ".env.test"
    if not test_env_file.is_file():
        raise pytest.UsageError("backend/.env.test is required; no database fallback is allowed.")
    try:
        test_values = dotenv_values(test_env_file, encoding="utf-8", interpolate=False)
    except Exception:
        raise pytest.UsageError("backend/.env.test could not be read.") from None
    test_url = (test_values.get("TEST_DATABASE_URL") or "").strip()
    if not test_url:
        raise pytest.UsageError("TEST_DATABASE_URL is required in backend/.env.test; no database fallback is allowed.")
    try:
        url = make_url(test_url)
        valid = (
            url.drivername in {"postgresql", "postgresql+psycopg"}
            and url.database == TEST_DATABASE_NAME
            and not url.query
        )
    except Exception:
        valid = False
    if not valid:
        raise pytest.UsageError("TEST_DATABASE_URL must target the dedicated PostgreSQL test database without URL query options.")
    if any(name == "app" or name.startswith("app.") for name in sys.modules):
        raise pytest.UsageError("Application modules were imported before test database safety checks.")
    previous_url = os.environ.get("DATABASE_URL")
    previous_secret = os.environ.get("JWT_SECRET_KEY")
    previous_expiry = os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES")

    def restore_environment() -> None:
        if previous_url is None:
            os.environ.pop("DATABASE_URL", None)
        else:
            os.environ["DATABASE_URL"] = previous_url
        for key, value in (("JWT_SECRET_KEY", previous_secret), ("ACCESS_TOKEN_EXPIRE_MINUTES", previous_expiry)):
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value

    config.add_cleanup(restore_environment)
    os.environ["DATABASE_URL"] = test_url
    os.environ["JWT_SECRET_KEY"] = secrets.token_urlsafe(48)
    os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"


@pytest.fixture(scope="session")
def test_engine() -> Generator[Engine, None, None]:
    safety_error = None
    try:
        from app.core.database import engine

        with engine.connect() as connection:
            if connection.scalar(text("SELECT current_database()")) != TEST_DATABASE_NAME:
                safety_error = "Connected database is not the dedicated test database."
            else:
                existing_tables = set(inspect(connection).get_table_names())
                for table_name in BUSINESS_TABLES:
                    if table_name in existing_tables and connection.scalar(
                        text(f'SELECT EXISTS (SELECT 1 FROM "{table_name}")')
                    ):
                        safety_error = "Test database contains business data; no data was deleted."
                        break
    except Exception:
        pytest.exit("Test database was not found or could not be accessed; check its existence and connection settings.", returncode=1)
    if safety_error:
        engine.dispose()
        pytest.exit(safety_error, returncode=1)

    try:
        command.upgrade(Config(str(BACKEND_DIR / "alembic.ini")), "head")
    except Exception:
        engine.dispose()
        pytest.exit("Test database migration failed; connection details are suppressed.", returncode=1)
    try:
        yield engine
    finally:
        engine.dispose()


@pytest.fixture(scope="session")
def app(test_engine: Engine) -> FastAPI:
    from app.main import app

    return app


@pytest.fixture
def db_session(test_engine: Engine) -> Generator[Session, None, None]:
    with test_engine.connect() as connection:
        transaction = connection.begin()
        session = Session(bind=connection, autoflush=False, join_transaction_mode="create_savepoint")
        try:
            yield session
        finally:
            session.close()
            transaction.rollback()


@pytest.fixture
def admin(db_session: Session) -> dict[str, Any]:
    from app.schemas.user import UserCreate, UserResponse
    from app.services.user_service import create_user

    user = create_user(db_session, UserCreate(
        name="Test Admin", email="admin@example.com", role="admin",
        password="Test-only password 123!",
    ))
    return UserResponse.model_validate(user).model_dump(mode="json")


@pytest.fixture
def admin_headers(admin: dict[str, Any]) -> dict[str, str]:
    from app.core.security import create_access_token

    return {"Authorization": "Bearer " + create_access_token(admin["id"])}


@pytest.fixture
def technician_headers(technician: dict[str, Any]) -> dict[str, str]:
    from app.core.security import create_access_token

    return {"Authorization": "Bearer " + create_access_token(technician["id"])}


@pytest.fixture
def employee_headers(employee: dict[str, Any]) -> dict[str, str]:
    from app.core.security import create_access_token

    return {"Authorization": "Bearer " + create_access_token(employee["id"])}


@pytest.fixture
def client(
    app: FastAPI, db_session: Session, admin_headers: dict[str, str],
) -> Generator[TestClient, None, None]:
    from app.core.database import get_db

    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    previous_overrides = app.dependency_overrides.copy()
    app.dependency_overrides[get_db] = override_get_db
    try:
        with TestClient(app, headers=admin_headers) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(previous_overrides)


@pytest.fixture
def anonymous_client(client: TestClient, app: FastAPI) -> Generator[TestClient, None, None]:
    # Reuse the database override, but never inherit the admin client's headers.
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def employee(client: TestClient) -> dict[str, Any]:
    response = client.post("/api/v1/users", json={
        "name": "Test Employee", "email": "employee@example.com", "role": "employee",
        "password": "Test-only password 123!",
    })
    assert response.status_code == 201
    return response.json()


@pytest.fixture
def technician(client: TestClient) -> dict[str, Any]:
    response = client.post("/api/v1/users", json={
        "name": "Test Technician", "email": "technician@example.com", "role": "technician",
        "password": "Test-only password 123!",
    })
    assert response.status_code == 201
    return response.json()


@pytest.fixture
def ticket_data(employee: dict[str, Any]) -> dict[str, Any]:
    return {
        "title": "Printer unavailable", "description": "Printer does not respond.",
        "category": "printer", "priority": "medium", "employee_id": employee["id"],
    }


@pytest.fixture
def ticket(client: TestClient, ticket_data: dict[str, Any]) -> dict[str, Any]:
    response = client.post("/api/v1/tickets", json=ticket_data)
    assert response.status_code == 201
    return response.json()


@pytest.fixture
def request_data(employee: dict[str, Any]) -> dict[str, Any]:
    return {
        "title": "Install editor", "description": "Install approved editor.",
        "request_type": "software_installation", "employee_id": employee["id"],
    }


@pytest.fixture
def it_request(client: TestClient, request_data: dict[str, Any]) -> dict[str, Any]:
    response = client.post("/api/v1/it-requests", json=request_data)
    assert response.status_code == 201
    return response.json()


@pytest.fixture
def asset_data() -> dict[str, Any]:
    return {
        "asset_tag": "TEST-LAPTOP", "name": "Test Laptop", "category": "laptop",
        "brand": "Test Brand", "model": "Test Model", "serial_number": "TEST-SERIAL",
    }


@pytest.fixture
def asset(client: TestClient, asset_data: dict[str, Any]) -> dict[str, Any]:
    response = client.post("/api/v1/assets", json=asset_data)
    assert response.status_code == 201
    return response.json()


@pytest.fixture
def assignment(
    client: TestClient, asset: dict[str, Any], employee: dict[str, Any],
) -> dict[str, Any]:
    response = client.post("/api/v1/asset-assignments", json={
        "asset_id": asset["id"], "employee_id": employee["id"],
    })
    assert response.status_code == 201
    return response.json()


@pytest.fixture
def work_log_data(technician: dict[str, Any]) -> dict[str, Any]:
    return {
        "description": "Investigated incident", "duration_minutes": 20,
        "work_date": "2026-01-15", "technician_id": technician["id"],
        "ticket_id": None, "it_request_id": None,
    }
