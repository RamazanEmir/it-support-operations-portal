from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import WorkLog
from app.schemas.work_log import WorkLogCreate, WorkLogResponse, WorkLogUpdate
from app.services import it_request_service, ticket_service, work_log_service, user_service

router = APIRouter(prefix="/work-logs", tags=["Work Logs"])


@router.get("", response_model=list[WorkLogResponse])
def list_work_logs(db: Annotated[Session, Depends(get_db)]) -> list[WorkLog]:
    return work_log_service.list_work_logs(db)


@router.get("/{work_log_id}", response_model=WorkLogResponse)
def get_work_log(work_log_id: int, db: Annotated[Session, Depends(get_db)]) -> WorkLog:
    try:
        return work_log_service.get_work_log(db, work_log_id)
    except work_log_service.WorkLogNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from None


@router.post("", response_model=WorkLogResponse, status_code=status.HTTP_201_CREATED)
def create_work_log(
    work_log_data: WorkLogCreate, db: Annotated[Session, Depends(get_db)]
) -> WorkLog:
    try:
        return work_log_service.create_work_log(db, work_log_data)
    except (
        user_service.UserNotFoundError,
        ticket_service.TicketNotFoundError,
        it_request_service.ITRequestNotFoundError,
    ) as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from None
    except work_log_service.WorkLogConflictError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from None


@router.put("/{work_log_id}", response_model=WorkLogResponse)
def update_work_log(
    work_log_id: int, work_log_data: WorkLogUpdate, db: Annotated[Session, Depends(get_db)]
) -> WorkLog:
    try:
        return work_log_service.update_work_log(db, work_log_id, work_log_data)
    except (
        work_log_service.WorkLogNotFoundError,
        user_service.UserNotFoundError,
        ticket_service.TicketNotFoundError,
        it_request_service.ITRequestNotFoundError,
    ) as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from None
    except work_log_service.WorkLogConflictError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from None


@router.delete("/{work_log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_work_log(work_log_id: int, db: Annotated[Session, Depends(get_db)]) -> Response:
    try:
        work_log_service.delete_work_log(db, work_log_id)
    except work_log_service.WorkLogNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from None
    return Response(status_code=status.HTTP_204_NO_CONTENT)
