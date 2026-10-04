import secrets

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models import User

DUMMY_PASSWORD_HASH = hash_password(secrets.token_urlsafe(32))


class InvalidCredentialsError(Exception):
    pass


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = db.scalar(select(User).where(User.email == email))
    password_hash = user.password_hash if user is not None else DUMMY_PASSWORD_HASH
    valid = verify_password(password, password_hash)
    if user is None or not valid:
        raise InvalidCredentialsError("Invalid email or password.")
    return user
