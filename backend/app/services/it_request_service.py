from psycopg.errors import ForeignKeyViolation
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.models import ITRequest
from app.schemas.it_request import ITRequestCreate, ITRequestUpdate
from app.services import user_service


class ITRequestNotFoundError(Exception):
    pass


def list_it_requests(db: Session) -> list[ITRequest]:
    return list(db.scalars(select(ITRequest)).all())


def get_it_request(db: Session, request_id: int) -> ITRequest:
    it_request = db.get(ITRequest, request_id)
    if it_request is None:
        raise ITRequestNotFoundError("IT Request not found.")
    return it_request


def create_it_request(db: Session, request_data: ITRequestCreate) -> ITRequest:
    user_service.get_user(db, request_data.employee_id)
    it_request = ITRequest(**request_data.model_dump())
    try:
        db.add(it_request)
        db.commit()
        db.refresh(it_request)
    except SQLAlchemyError as error:
        db.rollback()
        if (
            isinstance(error, IntegrityError)
            and isinstance(error.orig, ForeignKeyViolation)
            and error.orig.diag.constraint_name == "it_requests_employee_id_fkey"
        ):
            raise user_service.UserNotFoundError("User not found.") from None
        raise
    return it_request


def update_it_request(db: Session, request_id: int, request_data: ITRequestUpdate) -> ITRequest:
    it_request = get_it_request(db, request_id)
    user_service.get_user(db, request_data.employee_id)
    try:
        it_request.title = request_data.title
        it_request.description = request_data.description
        it_request.request_type = request_data.request_type
        it_request.status = request_data.status
        it_request.employee_id = request_data.employee_id
        db.commit()
        db.refresh(it_request)
    except SQLAlchemyError as error:
        db.rollback()
        if (
            isinstance(error, IntegrityError)
            and isinstance(error.orig, ForeignKeyViolation)
            and error.orig.diag.constraint_name == "it_requests_employee_id_fkey"
        ):
            raise user_service.UserNotFoundError("User not found.") from None
        raise
    return it_request


def delete_it_request(db: Session, request_id: int) -> None:
    it_request = get_it_request(db, request_id)
    try:
        db.delete(it_request)
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise
