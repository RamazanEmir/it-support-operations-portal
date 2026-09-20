from psycopg.errors import ForeignKeyViolation, UniqueViolation
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.models import User
from app.schemas.user import UserCreate, UserUpdate


class UserNotFoundError(Exception):
    pass


class UserConflictError(Exception):
    pass


def list_users(db: Session) -> list[User]:
    return list(db.scalars(select(User).order_by(User.id)).all())


def get_user(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise UserNotFoundError("User not found.")
    return user


def create_user(db: Session, user_data: UserCreate) -> User:
    user = User(**user_data.model_dump())
    try:
        db.add(user)
        db.commit()
        db.refresh(user)
    except SQLAlchemyError as error:
        db.rollback()
        if (
            isinstance(error, IntegrityError)
            and isinstance(error.orig, UniqueViolation)
            and error.orig.diag.constraint_name == "users_email_key"
        ):
            raise UserConflictError("Email is already in use.") from None
        raise
    return user


def update_user(db: Session, user_id: int, user_data: UserUpdate) -> User:
    user = get_user(db, user_id)
    try:
        user.name = user_data.name
        user.email = str(user_data.email)
        user.role = user_data.role
        db.commit()
        db.refresh(user)
    except SQLAlchemyError as error:
        db.rollback()
        if (
            isinstance(error, IntegrityError)
            and isinstance(error.orig, UniqueViolation)
            and error.orig.diag.constraint_name == "users_email_key"
        ):
            raise UserConflictError("Email is already in use.") from None
        raise
    return user


def delete_user(db: Session, user_id: int) -> None:
    user = get_user(db, user_id)
    try:
        db.delete(user)
        db.commit()
    except SQLAlchemyError as error:
        db.rollback()
        if (
            isinstance(error, IntegrityError)
            and isinstance(error.orig, ForeignKeyViolation)
        ):
            if error.orig.diag.constraint_name == "tickets_employee_id_fkey":
                raise UserConflictError("User is referenced by a ticket.") from None
            if error.orig.diag.constraint_name == "it_requests_employee_id_fkey":
                raise UserConflictError("User is referenced by an IT request.") from None
            if error.orig.diag.constraint_name == "asset_assignments_employee_id_fkey":
                raise UserConflictError("User is referenced by an assignment.") from None
        raise
