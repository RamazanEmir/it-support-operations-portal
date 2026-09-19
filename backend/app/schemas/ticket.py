from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import TicketCategory, TicketPriority, TicketStatus


class TicketBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(min_length=1, max_length=150)
    description: str = Field(min_length=1)
    category: TicketCategory
    priority: TicketPriority


class TicketCreate(TicketBase):
    employee_id: int


class TicketResponse(TicketBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: TicketStatus
    employee_id: int
    resolution: str | None
    created_at: datetime
    updated_at: datetime
