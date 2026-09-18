from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.enums import UserRole


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(254), nullable=False, unique=True)
    role: Mapped[UserRole] = mapped_column(
        SQLAlchemyEnum(
            UserRole,
            values_callable=lambda enum_class: [member.value for member in enum_class],
            native_enum=False,
            length=20,
            create_constraint=True,
            name="user_role",
        ),
        nullable=False,
    )
