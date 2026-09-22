from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.enums import AssetCategory, RequestType, TicketCategory, TicketPriority
from app.models import Asset, ITRequest, Ticket, User, WorkLog
from app.schemas.analytics import (
    AnalyticsOverviewResponse,
    AssetCategoryAnalyticsItem,
    ITRequestTypeAnalyticsItem,
    TechnicianWorkLogAnalyticsItem,
    TicketCategoryAnalyticsItem,
    TicketPriorityAnalyticsItem,
)


def get_analytics_overview(db: Session) -> AnalyticsOverviewResponse:
    ticket_category_counts = {category: 0 for category in TicketCategory}
    for category, count in db.execute(
        select(Ticket.category, func.count(Ticket.id)).group_by(Ticket.category)
    ):
        ticket_category_counts[category] = count

    ticket_priority_counts = {priority: 0 for priority in TicketPriority}
    for priority, count in db.execute(
        select(Ticket.priority, func.count(Ticket.id)).group_by(Ticket.priority)
    ):
        ticket_priority_counts[priority] = count

    request_type_counts = {request_type: 0 for request_type in RequestType}
    for request_type, count in db.execute(
        select(ITRequest.request_type, func.count(ITRequest.id)).group_by(ITRequest.request_type)
    ):
        request_type_counts[request_type] = count

    asset_category_counts = {category: 0 for category in AssetCategory}
    for category, count in db.execute(
        select(Asset.category, func.count(Asset.id)).group_by(Asset.category)
    ):
        asset_category_counts[category] = count

    technician_rows = db.execute(
        select(
            User.id,
            User.name,
            func.count(WorkLog.id),
            func.coalesce(func.sum(WorkLog.duration_minutes), 0),
        )
        .join(WorkLog, WorkLog.technician_id == User.id)
        .group_by(User.id, User.name)
    )

    return AnalyticsOverviewResponse(
        tickets_by_category=[
            TicketCategoryAnalyticsItem(category=category, count=ticket_category_counts[category])
            for category in TicketCategory
        ],
        tickets_by_priority=[
            TicketPriorityAnalyticsItem(priority=priority, count=ticket_priority_counts[priority])
            for priority in TicketPriority
        ],
        it_requests_by_type=[
            ITRequestTypeAnalyticsItem(request_type=request_type, count=request_type_counts[request_type])
            for request_type in RequestType
        ],
        assets_by_category=[
            AssetCategoryAnalyticsItem(category=category, count=asset_category_counts[category])
            for category in AssetCategory
        ],
        work_logs_by_technician=[
            TechnicianWorkLogAnalyticsItem(
                technician_id=technician_id,
                technician_name=technician_name,
                work_log_count=work_log_count,
                total_duration_minutes=total_duration_minutes,
            )
            for technician_id, technician_name, work_log_count, total_duration_minutes in technician_rows
        ],
    )
