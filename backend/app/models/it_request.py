from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.enums import RequestStatus, RequestType


class ITRequest(Base):
    __tablename__ = "it_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    request_type: Mapped[RequestType] = mapped_column(
        SQLAlchemyEnum(
            RequestType,
            values_callable=lambda enum_class: [member.value for member in enum_class],
            native_enum=False,
            length=30,
            create_constraint=True,
            name="request_type",
        ),
        nullable=False,
    )
    status: Mapped[RequestStatus] = mapped_column(
        SQLAlchemyEnum(
            RequestStatus,
            values_callable=lambda enum_class: [member.value for member in enum_class],
            native_enum=False,
            length=30,
            create_constraint=True,
            name="request_status",
        ),
        nullable=False,
        default=RequestStatus.PENDING,
        server_default="pending",
    )
    employee_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
