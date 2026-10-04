from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_user, require_roles
from app.core.database import get_db
from app.core.enums import UserRole
from app.models import Ticket, User
from app.schemas.ticket import TicketCreate, TicketResponse, TicketUpdate
from app.services import ticket_service, user_service

router = APIRouter(prefix="/tickets", tags=["Tickets"])


@router.get("", response_model=list[TicketResponse])
def list_tickets(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[Ticket]:
    employee_id = current_user.id if current_user.role == UserRole.EMPLOYEE else None
    return ticket_service.list_tickets(db, employee_id)


@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(
    ticket_id: int, db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Ticket:
    employee_id = current_user.id if current_user.role == UserRole.EMPLOYEE else None
    try:
        return ticket_service.get_ticket(db, ticket_id, employee_id)
    except ticket_service.TicketNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from None


@router.post("", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(
    ticket_data: TicketCreate, db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Ticket:
    if current_user.role == UserRole.EMPLOYEE:
        ticket_data = ticket_data.model_copy(update={"employee_id": current_user.id})
    elif ticket_data.employee_id is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="employee_id is required.")
    try:
        return ticket_service.create_ticket(db, ticket_data)
    except user_service.UserNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from None


@router.put(
    "/{ticket_id}", response_model=TicketResponse,
    dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.TECHNICIAN))],
)
def update_ticket(
    ticket_id: int, ticket_data: TicketUpdate, db: Annotated[Session, Depends(get_db)]
) -> Ticket:
    try:
        return ticket_service.update_ticket(db, ticket_id, ticket_data)
    except (ticket_service.TicketNotFoundError, user_service.UserNotFoundError) as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from None


@router.delete(
    "/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def delete_ticket(ticket_id: int, db: Annotated[Session, Depends(get_db)]) -> Response:
    try:
        ticket_service.delete_ticket(db, ticket_id)
    except ticket_service.TicketNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from None
    except ticket_service.TicketConflictError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from None
    return Response(status_code=status.HTTP_204_NO_CONTENT)
