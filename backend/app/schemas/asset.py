from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import AssetCategory, AssetStatus


class AssetBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    asset_tag: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1, max_length=150)
    category: AssetCategory
    brand: str = Field(min_length=1, max_length=100)
    model: str = Field(min_length=1, max_length=100)
    serial_number: str = Field(min_length=1, max_length=100)


class AssetCreate(AssetBase):
    pass


class AssetResponse(AssetBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: AssetStatus
    created_at: datetime
    updated_at: datetime
