from psycopg.errors import ForeignKeyViolation
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.enums import UserRole
from app.models import WorkLog
from app.schemas.work_log import WorkLogCreate, WorkLogUpdate
from app.services import it_request_service, ticket_service, user_service


class WorkLogNotFoundError(Exception):
    pass


class WorkLogConflictError(Exception):
    pass


def list_work_logs(db: Session) -> list[WorkLog]:
    return list(db.scalars(select(WorkLog)).all())


def get_work_log(db: Session, work_log_id: int) -> WorkLog:
    work_log = db.get(WorkLog, work_log_id)
    if work_log is None:
        raise WorkLogNotFoundError("Work log not found.")
    return work_log


def create_work_log(db: Session, work_log_data: WorkLogCreate) -> WorkLog:
    technician = user_service.get_user(db, work_log_data.technician_id)
    if technician.role != UserRole.TECHNICIAN:
        raise WorkLogConflictError("User must have the technician role.")
    if work_log_data.ticket_id is not None:
        ticket_service.get_ticket(db, work_log_data.ticket_id)
    if work_log_data.it_request_id is not None:
        it_request_service.get_it_request(db, work_log_data.it_request_id)
    work_log = WorkLog(**work_log_data.model_dump())
    try:
        db.add(work_log)
        db.commit()
        db.refresh(work_log)
    except SQLAlchemyError as error:
        db.rollback()
        if isinstance(error, IntegrityError) and isinstance(error.orig, ForeignKeyViolation):
            if error.orig.diag.constraint_name == "work_logs_technician_id_fkey":
                raise user_service.UserNotFoundError("User not found.") from None
            if error.orig.diag.constraint_name == "work_logs_ticket_id_fkey":
                raise ticket_service.TicketNotFoundError("Ticket not found.") from None
            if error.orig.diag.constraint_name == "work_logs_it_request_id_fkey":
                raise it_request_service.ITRequestNotFoundError("IT Request not found.") from None
        raise
    return work_log


def update_work_log(db: Session, work_log_id: int, work_log_data: WorkLogUpdate) -> WorkLog:
    work_log = get_work_log(db, work_log_id)
    technician = user_service.get_user(db, work_log_data.technician_id)
    if technician.role != UserRole.TECHNICIAN:
        raise WorkLogConflictError("User must have the technician role.")
    if work_log_data.ticket_id is not None:
        ticket_service.get_ticket(db, work_log_data.ticket_id)
    if work_log_data.it_request_id is not None:
        it_request_service.get_it_request(db, work_log_data.it_request_id)
    try:
        work_log.technician_id = work_log_data.technician_id
        work_log.ticket_id = work_log_data.ticket_id
        work_log.it_request_id = work_log_data.it_request_id
        work_log.description = work_log_data.description
        work_log.duration_minutes = work_log_data.duration_minutes
        work_log.work_date = work_log_data.work_date
        db.commit()
        db.refresh(work_log)
    except SQLAlchemyError as error:
        db.rollback()
        if isinstance(error, IntegrityError) and isinstance(error.orig, ForeignKeyViolation):
            if error.orig.diag.constraint_name == "work_logs_technician_id_fkey":
                raise user_service.UserNotFoundError("User not found.") from None
            if error.orig.diag.constraint_name == "work_logs_ticket_id_fkey":
                raise ticket_service.TicketNotFoundError("Ticket not found.") from None
            if error.orig.diag.constraint_name == "work_logs_it_request_id_fkey":
                raise it_request_service.ITRequestNotFoundError("IT Request not found.") from None
        raise
    return work_log


def delete_work_log(db: Session, work_log_id: int) -> None:
    work_log = get_work_log(db, work_log_id)
    try:
        db.delete(work_log)
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise
