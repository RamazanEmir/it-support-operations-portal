from psycopg.errors import ForeignKeyViolation, UniqueViolation
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.enums import AssetStatus
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
    try:
        asset = db.scalar(
            select(Asset)
            .where(Asset.id == asset_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
        if asset is None:
            raise AssetNotFoundError("Asset not found.")
        if (asset.status == AssetStatus.ASSIGNED) != (asset_data.status == AssetStatus.ASSIGNED):
            raise AssetConflictError("Assigned status can only be changed through the assignment workflow.")
        asset.asset_tag = asset_data.asset_tag
        asset.name = asset_data.name
        asset.category = asset_data.category
        asset.brand = asset_data.brand
        asset.model = asset_data.model
        asset.serial_number = asset_data.serial_number
        asset.status = asset_data.status
        db.commit()
        db.refresh(asset)
    except (AssetNotFoundError, AssetConflictError):
        db.rollback()
        raise
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
    except SQLAlchemyError as error:
        db.rollback()
        if (
            isinstance(error, IntegrityError)
            and isinstance(error.orig, ForeignKeyViolation)
            and error.orig.diag.constraint_name == "asset_assignments_asset_id_fkey"
        ):
            raise AssetConflictError("Asset is referenced by an assignment.") from None
        raise
