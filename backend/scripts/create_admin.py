import sys
import warnings
from getpass import GetPassWarning, getpass
from pathlib import Path

from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import session_factory
from app.core.enums import UserRole
from app.schemas.user import UserCreate
from app.services.user_service import UserConflictError, create_user


def main() -> int:
    name = input("Name: ")
    email = input("Email: ")
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", GetPassWarning)
            password = getpass("Password: ")
    except GetPassWarning:
        print("A terminal with hidden password input is required.")
        return 1
    try:
        data = UserCreate(name=name, email=email, role=UserRole.ADMIN, password=password)
    except ValidationError:
        print("Invalid name, email or password. Password must contain 12 to 128 characters.")
        return 1
    try:
        with session_factory() as db:
            create_user(db, data)
    except UserConflictError:
        print("Email is already in use.")
        return 1
    except SQLAlchemyError:
        print("Admin could not be created. Check the database configuration.")
        return 1
    print("Admin created.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
