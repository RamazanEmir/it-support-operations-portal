from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.enums import AssetCategory, AssetStatus


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(primary_key=True)
    asset_tag: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    category: Mapped[AssetCategory] = mapped_column(
        SQLAlchemyEnum(
            AssetCategory,
            values_callable=lambda enum_class: [member.value for member in enum_class],
            native_enum=False,
            length=20,
            create_constraint=True,
            name="asset_category",
        ),
        nullable=False,
    )
    brand: Mapped[str] = mapped_column(String(100), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    serial_number: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    status: Mapped[AssetStatus] = mapped_column(
        SQLAlchemyEnum(
            AssetStatus,
            values_callable=lambda enum_class: [member.value for member in enum_class],
            native_enum=False,
            length=20,
            create_constraint=True,
            name="asset_status",
        ),
        nullable=False,
        default=AssetStatus.AVAILABLE,
        server_default="available",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
