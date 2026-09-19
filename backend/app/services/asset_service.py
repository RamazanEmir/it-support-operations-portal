from psycopg.errors import UniqueViolation
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.models import Asset
from app.schemas.asset import AssetCreate, AssetUpdate


class AssetNotFoundError(Exception):
    pass


class AssetConflictError(Exception):
    pass


def list_assets(db: Session) -> list[Asset]:
    return list(db.scalars(select(Asset)).all())


def get_asset(db: Session, asset_id: int) -> Asset:
    asset = db.get(Asset, asset_id)
    if asset is None:
        raise AssetNotFoundError("Asset not found.")
    return asset


def create_asset(db: Session, asset_data: AssetCreate) -> Asset:
    asset = Asset(**asset_data.model_dump())
    try:
        db.add(asset)
        db.commit()
        db.refresh(asset)
    except SQLAlchemyError as error:
        db.rollback()
        if isinstance(error, IntegrityError) and isinstance(error.orig, UniqueViolation):
            if error.orig.diag.constraint_name == "assets_asset_tag_key":
                raise AssetConflictError("Asset tag is already in use.") from None
            if error.orig.diag.constraint_name == "assets_serial_number_key":
                raise AssetConflictError("Serial number is already in use.") from None
        raise
    return asset


def update_asset(db: Session, asset_id: int, asset_data: AssetUpdate) -> Asset:
    asset = get_asset(db, asset_id)
    try:
        asset.asset_tag = asset_data.asset_tag
        asset.name = asset_data.name
        asset.category = asset_data.category
        asset.brand = asset_data.brand
        asset.model = asset_data.model
        asset.serial_number = asset_data.serial_number
        asset.status = asset_data.status
        db.commit()
        db.refresh(asset)
    except SQLAlchemyError as error:
        db.rollback()
        if isinstance(error, IntegrityError) and isinstance(error.orig, UniqueViolation):
            if error.orig.diag.constraint_name == "assets_asset_tag_key":
                raise AssetConflictError("Asset tag is already in use.") from None
            if error.orig.diag.constraint_name == "assets_serial_number_key":
                raise AssetConflictError("Serial number is already in use.") from None
        raise
    return asset


def delete_asset(db: Session, asset_id: int) -> None:
    asset = get_asset(db, asset_id)
    try:
        db.delete(asset)
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise
