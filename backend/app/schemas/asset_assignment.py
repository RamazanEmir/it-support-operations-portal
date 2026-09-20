from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AssetAssignmentCreate(BaseModel):
    asset_id: int
    employee_id: int


class AssetAssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    asset_id: int
    employee_id: int
    assigned_at: datetime
    returned_at: datetime | None
