from datetime import datetime, timezone

from psycopg.errors import ForeignKeyViolation, UniqueViolation
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.enums import AssetStatus
from app.models import Asset, AssetAssignment
from app.schemas.asset_assignment import AssetAssignmentCreate
from app.services import asset_service, user_service


class AssetAssignmentNotFoundError(Exception):
    pass


class AssetAssignmentConflictError(Exception):
    pass


def list_asset_assignments(db: Session) -> list[AssetAssignment]:
    return list(db.scalars(select(AssetAssignment)).all())


def get_asset_assignment(db: Session, assignment_id: int) -> AssetAssignment:
    assignment = db.get(AssetAssignment, assignment_id)
    if assignment is None:
        raise AssetAssignmentNotFoundError("Asset assignment not found.")
    return assignment


def create_asset_assignment(
    db: Session, assignment_data: AssetAssignmentCreate
) -> AssetAssignment:
    try:
        asset = db.scalar(
            select(Asset)
            .where(Asset.id == assignment_data.asset_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
        if asset is None:
            raise asset_service.AssetNotFoundError("Asset not found.")
        user_service.get_user(db, assignment_data.employee_id)
        if asset.status != AssetStatus.AVAILABLE:
            raise AssetAssignmentConflictError("Asset is not available for assignment.")
        active_assignment = db.scalar(
            select(AssetAssignment.id).where(
                AssetAssignment.asset_id == asset.id,
                AssetAssignment.returned_at.is_(None),
            )
        )
        if active_assignment is not None:
            raise AssetAssignmentConflictError("Asset already has an active assignment.")
        assignment = AssetAssignment(**assignment_data.model_dump())
        db.add(assignment)
        asset.status = AssetStatus.ASSIGNED
        db.commit()
        db.refresh(assignment)
    except (
        asset_service.AssetNotFoundError,
        user_service.UserNotFoundError,
        AssetAssignmentConflictError,
    ):
        db.rollback()
        raise
    except SQLAlchemyError as error:
        db.rollback()
        if isinstance(error, IntegrityError):
            if (
                isinstance(error.orig, UniqueViolation)
                and error.orig.diag.constraint_name == "uq_asset_assignments_active_asset"
            ):
                raise AssetAssignmentConflictError("Asset already has an active assignment.") from None
            if isinstance(error.orig, ForeignKeyViolation):
                if error.orig.diag.constraint_name == "asset_assignments_asset_id_fkey":
                    raise asset_service.AssetNotFoundError("Asset not found.") from None
                if error.orig.diag.constraint_name == "asset_assignments_employee_id_fkey":
                    raise user_service.UserNotFoundError("User not found.") from None
        raise
    return assignment


def return_asset_assignment(db: Session, assignment_id: int) -> AssetAssignment:
    try:
        assignment = get_asset_assignment(db, assignment_id)
        asset = db.scalar(
            select(Asset)
            .where(Asset.id == assignment.asset_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
        if asset is None:
            raise asset_service.AssetNotFoundError("Asset not found.")
        assignment = db.scalar(
            select(AssetAssignment)
            .where(AssetAssignment.id == assignment_id)
            .execution_options(populate_existing=True)
        )
        if assignment is None:
            raise AssetAssignmentNotFoundError("Asset assignment not found.")
        if assignment.returned_at is not None:
            raise AssetAssignmentConflictError("Asset assignment has already been returned.")
        assignment.returned_at = datetime.now(timezone.utc)
        asset.status = AssetStatus.AVAILABLE
        db.commit()
        db.refresh(assignment)
    except (AssetAssignmentNotFoundError, asset_service.AssetNotFoundError, AssetAssignmentConflictError):
        db.rollback()
        raise
    except SQLAlchemyError:
        db.rollback()
        raise
    return assignment
