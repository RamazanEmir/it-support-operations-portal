from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import AssetAssignment
from app.schemas.asset_assignment import AssetAssignmentCreate, AssetAssignmentResponse
from app.services import asset_assignment_service, asset_service, user_service

router = APIRouter(prefix="/asset-assignments", tags=["Asset Assignments"])


@router.get("", response_model=list[AssetAssignmentResponse])
def list_asset_assignments(db: Annotated[Session, Depends(get_db)]) -> list[AssetAssignment]:
    return asset_assignment_service.list_asset_assignments(db)


@router.get("/{assignment_id}", response_model=AssetAssignmentResponse)
def get_asset_assignment(assignment_id: int, db: Annotated[Session, Depends(get_db)]) -> AssetAssignment:
    try:
        return asset_assignment_service.get_asset_assignment(db, assignment_id)
    except asset_assignment_service.AssetAssignmentNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from None


@router.post("", response_model=AssetAssignmentResponse, status_code=status.HTTP_201_CREATED)
def create_asset_assignment(
    assignment_data: AssetAssignmentCreate, db: Annotated[Session, Depends(get_db)]
) -> AssetAssignment:
    try:
        return asset_assignment_service.create_asset_assignment(db, assignment_data)
    except (asset_service.AssetNotFoundError, user_service.UserNotFoundError) as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from None
    except asset_assignment_service.AssetAssignmentConflictError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from None


@router.post("/{assignment_id}/return", response_model=AssetAssignmentResponse)
def return_asset_assignment(assignment_id: int, db: Annotated[Session, Depends(get_db)]) -> AssetAssignment:
    try:
        return asset_assignment_service.return_asset_assignment(db, assignment_id)
    except (asset_assignment_service.AssetAssignmentNotFoundError, asset_service.AssetNotFoundError) as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from None
    except asset_assignment_service.AssetAssignmentConflictError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from None
