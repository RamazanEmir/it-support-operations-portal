from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import RequestStatus, RequestType


class ITRequestBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(min_length=1, max_length=150)
    description: str = Field(min_length=1)
    request_type: RequestType


class ITRequestCreate(ITRequestBase):
    employee_id: int


class ITRequestUpdate(ITRequestBase):
    status: RequestStatus
    employee_id: int


class ITRequestResponse(ITRequestBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: RequestStatus
    employee_id: int
    created_at: datetime
    updated_at: datetime
