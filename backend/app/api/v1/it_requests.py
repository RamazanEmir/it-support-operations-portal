from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_user, require_roles
from app.core.database import get_db
from app.core.enums import UserRole
from app.models import ITRequest, User
from app.schemas.it_request import ITRequestCreate, ITRequestResponse, ITRequestUpdate
from app.services import it_request_service, user_service

router = APIRouter(prefix="/it-requests", tags=["IT Requests"])


@router.get("", response_model=list[ITRequestResponse])
def list_it_requests(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[ITRequest]:
    employee_id = current_user.id if current_user.role == UserRole.EMPLOYEE else None
    return it_request_service.list_it_requests(db, employee_id)


@router.get("/{request_id}", response_model=ITRequestResponse)
def get_it_request(
    request_id: int, db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ITRequest:
    employee_id = current_user.id if current_user.role == UserRole.EMPLOYEE else None
    try:
        return it_request_service.get_it_request(db, request_id, employee_id)
    except it_request_service.ITRequestNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from None


@router.post("", response_model=ITRequestResponse, status_code=status.HTTP_201_CREATED)
def create_it_request(
    request_data: ITRequestCreate, db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ITRequest:
    if current_user.role == UserRole.EMPLOYEE:
        request_data = request_data.model_copy(update={"employee_id": current_user.id})
    elif request_data.employee_id is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="employee_id is required.")
    try:
        return it_request_service.create_it_request(db, request_data)
    except user_service.UserNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from None


@router.put(
    "/{request_id}", response_model=ITRequestResponse,
    dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.TECHNICIAN))],
)
def update_it_request(
    request_id: int, request_data: ITRequestUpdate, db: Annotated[Session, Depends(get_db)]
) -> ITRequest:
    try:
        return it_request_service.update_it_request(db, request_id, request_data)
    except (it_request_service.ITRequestNotFoundError, user_service.UserNotFoundError) as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from None


@router.delete(
    "/{request_id}", status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def delete_it_request(request_id: int, db: Annotated[Session, Depends(get_db)]) -> Response:
    try:
        it_request_service.delete_it_request(db, request_id)
    except it_request_service.ITRequestNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from None
    except it_request_service.ITRequestConflictError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from None
    return Response(status_code=status.HTTP_204_NO_CONTENT)
