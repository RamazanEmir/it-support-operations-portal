from pydantic import BaseModel, Field

from app.core.enums import AssetCategory, RequestType, TicketCategory, TicketPriority


class TicketCategoryAnalyticsItem(BaseModel):
    category: TicketCategory
    count: int = Field(ge=0)


class TicketPriorityAnalyticsItem(BaseModel):
    priority: TicketPriority
    count: int = Field(ge=0)


class ITRequestTypeAnalyticsItem(BaseModel):
    request_type: RequestType
    count: int = Field(ge=0)


class AssetCategoryAnalyticsItem(BaseModel):
    category: AssetCategory
    count: int = Field(ge=0)


class TechnicianWorkLogAnalyticsItem(BaseModel):
    technician_id: int
    technician_name: str
    work_log_count: int = Field(ge=0)
    total_duration_minutes: int = Field(ge=0)


class AnalyticsOverviewResponse(BaseModel):
    tickets_by_category: list[TicketCategoryAnalyticsItem]
    tickets_by_priority: list[TicketPriorityAnalyticsItem]
    it_requests_by_type: list[ITRequestTypeAnalyticsItem]
    assets_by_category: list[AssetCategoryAnalyticsItem]
    work_logs_by_technician: list[TechnicianWorkLogAnalyticsItem]
