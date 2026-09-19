from psycopg.errors import ForeignKeyViolation
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.models import Ticket
from app.schemas.ticket import TicketCreate, TicketUpdate
from app.services import user_service


class TicketNotFoundError(Exception):
    pass


def list_tickets(db: Session) -> list[Ticket]:
    return list(db.scalars(select(Ticket)).all())


def get_ticket(db: Session, ticket_id: int) -> Ticket:
    ticket = db.get(Ticket, ticket_id)
    if ticket is None:
        raise TicketNotFoundError("Ticket not found.")
    return ticket


def create_ticket(db: Session, ticket_data: TicketCreate) -> Ticket:
    user_service.get_user(db, ticket_data.employee_id)
    ticket = Ticket(**ticket_data.model_dump())
    try:
        db.add(ticket)
        db.commit()
        db.refresh(ticket)
    except SQLAlchemyError as error:
        db.rollback()
        if (
            isinstance(error, IntegrityError)
            and isinstance(error.orig, ForeignKeyViolation)
            and error.orig.diag.constraint_name == "tickets_employee_id_fkey"
        ):
            raise user_service.UserNotFoundError("User not found.") from None
        raise
    return ticket


def update_ticket(db: Session, ticket_id: int, ticket_data: TicketUpdate) -> Ticket:
    ticket = get_ticket(db, ticket_id)
    user_service.get_user(db, ticket_data.employee_id)
    try:
        ticket.title = ticket_data.title
        ticket.description = ticket_data.description
        ticket.category = ticket_data.category
        ticket.priority = ticket_data.priority
        ticket.status = ticket_data.status
        ticket.employee_id = ticket_data.employee_id
        ticket.resolution = ticket_data.resolution
        db.commit()
        db.refresh(ticket)
    except SQLAlchemyError as error:
        db.rollback()
        if (
            isinstance(error, IntegrityError)
            and isinstance(error.orig, ForeignKeyViolation)
            and error.orig.diag.constraint_name == "tickets_employee_id_fkey"
        ):
            raise user_service.UserNotFoundError("User not found.") from None
        raise
    return ticket


def delete_ticket(db: Session, ticket_id: int) -> None:
    ticket = get_ticket(db, ticket_id)
    try:
        db.delete(ticket)
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise
