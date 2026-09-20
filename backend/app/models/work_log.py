from datetime import date, datetime

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class WorkLog(Base):
    __tablename__ = "work_logs"
    __table_args__ = (
        CheckConstraint("duration_minutes > 0", name="ck_work_logs_duration_positive"),
        CheckConstraint(
            "ticket_id IS NULL OR it_request_id IS NULL",
            name="ck_work_logs_single_reference",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    technician_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    ticket_id: Mapped[int | None] = mapped_column(ForeignKey("tickets.id"), nullable=True)
    it_request_id: Mapped[int | None] = mapped_column(ForeignKey("it_requests.id"), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(nullable=False)
    work_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
