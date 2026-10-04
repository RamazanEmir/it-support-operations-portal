"""add user password hash"""

from alembic import op
import sqlalchemy as sa

revision = "a33f1b7c9201"
down_revision = "7ca7489b52a9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("password_hash", sa.String(length=255), nullable=False))


def downgrade() -> None:
    op.drop_column("users", "password_hash")
