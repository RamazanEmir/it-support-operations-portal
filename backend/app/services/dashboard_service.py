from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.enums import AssetStatus, RequestStatus, TicketStatus
from app.models import Asset, AssetAssignment, ITRequest, KnowledgeBaseArticle, Ticket, User, WorkLog
from app.schemas.dashboard import (
    AssetDashboardStats,
    DashboardSummaryResponse,
    ITRequestDashboardStats,
    TicketDashboardStats,
    WorkLogDashboardStats,
)


def get_dashboard_summary(db: Session) -> DashboardSummaryResponse:
    users_total = db.scalar(select(func.count(User.id)))

    ticket_counts = {status.value: 0 for status in TicketStatus}
    for status, count in db.execute(select(Ticket.status, func.count(Ticket.id)).group_by(Ticket.status)):
        ticket_counts[status.value] = count

    request_counts = {status.value: 0 for status in RequestStatus}
    for status, count in db.execute(
        select(ITRequest.status, func.count(ITRequest.id)).group_by(ITRequest.status)
    ):
        request_counts[status.value] = count

    asset_counts = {status.value: 0 for status in AssetStatus}
    for status, count in db.execute(select(Asset.status, func.count(Asset.id)).group_by(Asset.status)):
        asset_counts[status.value] = count

    active_assignments = db.scalar(
        select(func.count(AssetAssignment.id)).where(AssetAssignment.returned_at.is_(None))
    )
    work_log_total, total_duration_minutes = db.execute(
        select(func.count(WorkLog.id), func.coalesce(func.sum(WorkLog.duration_minutes), 0))
    ).one()
    knowledge_base_articles = db.scalar(select(func.count(KnowledgeBaseArticle.id)))

    return DashboardSummaryResponse(
        users_total=users_total,
        tickets=TicketDashboardStats(total=sum(ticket_counts.values()), **ticket_counts),
        it_requests=ITRequestDashboardStats(total=sum(request_counts.values()), **request_counts),
        assets=AssetDashboardStats(total=sum(asset_counts.values()), **asset_counts),
        active_assignments=active_assignments,
        work_logs=WorkLogDashboardStats(
            total=work_log_total, total_duration_minutes=total_duration_minutes
        ),
        knowledge_base_articles=knowledge_base_articles,
    )
