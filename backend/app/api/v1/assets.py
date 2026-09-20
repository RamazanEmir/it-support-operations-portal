from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Asset
from app.schemas.asset import AssetCreate, AssetResponse, AssetUpdate
from app.services import asset_service

router = APIRouter(prefix="/assets", tags=["Assets"])


@router.get("", response_model=list[AssetResponse])
def list_assets(db: Annotated[Session, Depends(get_db)]) -> list[Asset]:
    return asset_service.list_assets(db)


@router.get("/{asset_id}", response_model=AssetResponse)
def get_asset(asset_id: int, db: Annotated[Session, Depends(get_db)]) -> Asset:
    try:
        return asset_service.get_asset(db, asset_id)
    except asset_service.AssetNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from None


@router.post("", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
def create_asset(
    asset_data: AssetCreate, db: Annotated[Session, Depends(get_db)]
) -> Asset:
    try:
        return asset_service.create_asset(db, asset_data)
    except asset_service.AssetConflictError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from None


@router.put("/{asset_id}", response_model=AssetResponse)
def update_asset(
    asset_id: int, asset_data: AssetUpdate, db: Annotated[Session, Depends(get_db)]
) -> Asset:
    try:
        return asset_service.update_asset(db, asset_id, asset_data)
    except asset_service.AssetNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from None
    except asset_service.AssetConflictError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from None


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(asset_id: int, db: Annotated[Session, Depends(get_db)]) -> Response:
    try:
        asset_service.delete_asset(db, asset_id)
    except asset_service.AssetNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from None
    except asset_service.AssetConflictError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from None
    return Response(status_code=status.HTTP_204_NO_CONTENT)
