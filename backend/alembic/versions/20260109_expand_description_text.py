"""Expand description fields to TEXT.

Revision ID: 20260109_expand_description_text
Revises: 11915fdc90a2
Create Date: 2026-01-09
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260109_expand_description_text"
down_revision = "11915fdc90a2"
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column(
        "datasets",
        "description",
        existing_type=sa.String(length=1024),
        type_=sa.Text(),
        existing_nullable=True,
    )
    op.alter_column(
        "catalogs",
        "description",
        existing_type=sa.String(length=1024),
        type_=sa.Text(),
        existing_nullable=True,
    )


def downgrade():
    op.alter_column(
        "datasets",
        "description",
        existing_type=sa.Text(),
        type_=sa.String(length=1024),
        existing_nullable=True,
    )
    op.alter_column(
        "catalogs",
        "description",
        existing_type=sa.Text(),
        type_=sa.String(length=1024),
        existing_nullable=True,
    )
