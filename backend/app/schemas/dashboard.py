from pydantic import BaseModel, Field


class TicketDashboardStats(BaseModel):
    total: int = Field(ge=0)
    open: int = Field(ge=0)
    in_progress: int = Field(ge=0)
    resolved: int = Field(ge=0)
    closed: int = Field(ge=0)


class ITRequestDashboardStats(BaseModel):
    total: int = Field(ge=0)
    pending: int = Field(ge=0)
    in_progress: int = Field(ge=0)
    completed: int = Field(ge=0)
    rejected: int = Field(ge=0)


class AssetDashboardStats(BaseModel):
    total: int = Field(ge=0)
    available: int = Field(ge=0)
    assigned: int = Field(ge=0)
    maintenance: int = Field(ge=0)
    retired: int = Field(ge=0)


class WorkLogDashboardStats(BaseModel):
    total: int = Field(ge=0)
    total_duration_minutes: int = Field(ge=0)


class DashboardSummaryResponse(BaseModel):
    users_total: int = Field(ge=0)
    tickets: TicketDashboardStats
    it_requests: ITRequestDashboardStats
    assets: AssetDashboardStats
    active_assignments: int = Field(ge=0)
    work_logs: WorkLogDashboardStats
    knowledge_base_articles: int = Field(ge=0)
