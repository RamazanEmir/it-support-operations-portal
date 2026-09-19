from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.enums import TicketCategory, TicketPriority, TicketStatus


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[TicketCategory] = mapped_column(
        SQLAlchemyEnum(
            TicketCategory,
            values_callable=lambda enum_class: [member.value for member in enum_class],
            native_enum=False,
            length=20,
            create_constraint=True,
            name="ticket_category",
        ),
        nullable=False,
    )
    priority: Mapped[TicketPriority] = mapped_column(
        SQLAlchemyEnum(
            TicketPriority,
            values_callable=lambda enum_class: [member.value for member in enum_class],
            native_enum=False,
            length=20,
            create_constraint=True,
            name="ticket_priority",
        ),
        nullable=False,
    )
    status: Mapped[TicketStatus] = mapped_column(
        SQLAlchemyEnum(
            TicketStatus,
            values_callable=lambda enum_class: [member.value for member in enum_class],
            native_enum=False,
            length=20,
            create_constraint=True,
            name="ticket_status",
        ),
        nullable=False,
        default=TicketStatus.OPEN,
        server_default="open",
    )
    employee_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    resolution: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
