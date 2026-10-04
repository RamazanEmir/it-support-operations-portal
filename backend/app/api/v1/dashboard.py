from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies.auth import require_roles
from app.core.database import get_db
from app.core.enums import UserRole
from app.schemas.dashboard import DashboardSummaryResponse
from app.services import dashboard_service

router = APIRouter(
    prefix="/dashboard", tags=["Dashboard"],
    dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.TECHNICIAN))],
)


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Annotated[Session, Depends(get_db)]) -> DashboardSummaryResponse:
    return dashboard_service.get_dashboard_summary(db)
