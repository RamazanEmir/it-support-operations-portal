from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import ITRequest
from app.schemas.it_request import ITRequestCreate, ITRequestResponse, ITRequestUpdate
from app.services import it_request_service, user_service

router = APIRouter(prefix="/it-requests", tags=["IT Requests"])


@router.get("", response_model=list[ITRequestResponse])
def list_it_requests(db: Annotated[Session, Depends(get_db)]) -> list[ITRequest]:
    return it_request_service.list_it_requests(db)


@router.get("/{request_id}", response_model=ITRequestResponse)
def get_it_request(request_id: int, db: Annotated[Session, Depends(get_db)]) -> ITRequest:
    try:
        return it_request_service.get_it_request(db, request_id)
    except it_request_service.ITRequestNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from None


@router.post("", response_model=ITRequestResponse, status_code=status.HTTP_201_CREATED)
def create_it_request(
    request_data: ITRequestCreate, db: Annotated[Session, Depends(get_db)]
) -> ITRequest:
    try:
        return it_request_service.create_it_request(db, request_data)
    except user_service.UserNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from None


@router.put("/{request_id}", response_model=ITRequestResponse)
def update_it_request(
    request_id: int, request_data: ITRequestUpdate, db: Annotated[Session, Depends(get_db)]
) -> ITRequest:
    try:
        return it_request_service.update_it_request(db, request_id, request_data)
    except (it_request_service.ITRequestNotFoundError, user_service.UserNotFoundError) as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from None


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_it_request(request_id: int, db: Annotated[Session, Depends(get_db)]) -> Response:
    try:
        it_request_service.delete_it_request(db, request_id)
    except it_request_service.ITRequestNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from None
    return Response(status_code=status.HTTP_204_NO_CONTENT)
