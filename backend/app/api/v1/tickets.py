from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Ticket
from app.schemas.ticket import TicketCreate, TicketResponse, TicketUpdate
from app.services import ticket_service, user_service

router = APIRouter(prefix="/tickets", tags=["Tickets"])


@router.get("", response_model=list[TicketResponse])
def list_tickets(db: Annotated[Session, Depends(get_db)]) -> list[Ticket]:
    return ticket_service.list_tickets(db)


@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(ticket_id: int, db: Annotated[Session, Depends(get_db)]) -> Ticket:
    try:
        return ticket_service.get_ticket(db, ticket_id)
    except ticket_service.TicketNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from None


@router.post("", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(
    ticket_data: TicketCreate, db: Annotated[Session, Depends(get_db)]
) -> Ticket:
    try:
        return ticket_service.create_ticket(db, ticket_data)
    except user_service.UserNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from None


@router.put("/{ticket_id}", response_model=TicketResponse)
def update_ticket(
    ticket_id: int, ticket_data: TicketUpdate, db: Annotated[Session, Depends(get_db)]
) -> Ticket:
    try:
        return ticket_service.update_ticket(db, ticket_id, ticket_data)
    except (ticket_service.TicketNotFoundError, user_service.UserNotFoundError) as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from None


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(ticket_id: int, db: Annotated[Session, Depends(get_db)]) -> Response:
    try:
        ticket_service.delete_ticket(db, ticket_id)
    except ticket_service.TicketNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from None
    return Response(status_code=status.HTTP_204_NO_CONTENT)
