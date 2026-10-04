from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

from app.core.config import settings

JWT_ALGORITHM = "HS256"
password_hasher = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return password_hasher.verify(password, password_hash)


def create_access_token(user_id: int) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode({"sub": str(user_id), "exp": expires_at}, settings.jwt_secret_key, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> int:
    try:
        payload = jwt.decode(
            token, settings.jwt_secret_key, algorithms=[JWT_ALGORITHM],
            options={"require": ["sub", "exp"]},
        )
    except (ValueError, TypeError, OverflowError):
        raise jwt.InvalidTokenError("Invalid claims.") from None
    subject = payload["sub"]
    if not isinstance(subject, str) or len(subject) > 10 or not subject.isascii() or not subject.isdecimal():
        raise jwt.InvalidTokenError("Invalid subject.")
    user_id = int(subject)
    if not 0 < user_id <= 2147483647:
        raise jwt.InvalidTokenError("Invalid subject.")
    return user_id
