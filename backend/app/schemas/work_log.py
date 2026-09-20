from datetime import date, datetime
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, model_validator


class WorkLogBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    description: str = Field(min_length=1)
    duration_minutes: int = Field(gt=0)
    work_date: date


class WorkLogCreate(WorkLogBase):
    technician_id: int
    ticket_id: int | None = None
    it_request_id: int | None = None

    @model_validator(mode="after")
    def validate_single_reference(self) -> Self:
        if self.ticket_id is not None and self.it_request_id is not None:
            raise ValueError("A work log cannot reference both a ticket and an IT request.")
        return self


class WorkLogResponse(WorkLogBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    technician_id: int
    ticket_id: int | None
    it_request_id: int | None
    created_at: datetime
