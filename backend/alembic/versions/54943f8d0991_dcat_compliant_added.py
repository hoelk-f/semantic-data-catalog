"""DCAT compliant added

Revision ID: 54943f8d0991
Revises: 7a055a194917
Create Date: 2024-12-16 11:16:24.768668

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = '54943f8d0991'
down_revision: Union[str, None] = '7a055a194917'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Entfernen der Fremdschlüssel vor dem Löschen von "persons"
    op.drop_constraint('datasets_ibfk_1', 'datasets', type_='foreignkey')
    op.drop_constraint('datasets_ibfk_2', 'datasets', type_='foreignkey')

    # Hinzufügen neuer Tabellen und Spalten
    op.create_table('agents',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('phone_number', sa.String(length=50), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table('catalogs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.String(length=1024), nullable=True),
        sa.Column('issued', sa.DateTime(), nullable=False),
        sa.Column('modified', sa.DateTime(), nullable=False),
        sa.Column('publisher_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['publisher_id'], ['agents.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Entfernen von "persons"-Tabelle und Index
    op.drop_index('email', table_name='persons')
    op.drop_table('persons')

    # Hinzufügen neuer Spalten zur Tabelle "datasets"
    op.add_column('datasets', sa.Column('title', sa.String(length=255), nullable=False))
    op.add_column('datasets', sa.Column('identifier', sa.String(length=255), nullable=False))
    op.add_column('datasets', sa.Column('issued', sa.DateTime(), nullable=False))
    op.add_column('datasets', sa.Column('modified', sa.DateTime(), nullable=False))
    op.add_column('datasets', sa.Column('publisher_id', sa.Integer(), nullable=False))
    op.add_column('datasets', sa.Column('contact_point_id', sa.Integer(), nullable=False))
    op.add_column('datasets', sa.Column('access_url', sa.String(length=1024), nullable=True))
    op.add_column('datasets', sa.Column('download_url', sa.String(length=1024), nullable=True))
    op.add_column('datasets', sa.Column('file_format', sa.String(length=50), nullable=True))
    op.add_column('datasets', sa.Column('theme', sa.String(length=255), nullable=True))
    op.add_column('datasets', sa.Column('semantic_model', sa.String(length=1024), nullable=True))

    # Hinzufügen von Constraints und Entfernen alter Spalten
    op.create_unique_constraint(None, 'datasets', ['identifier'])
    op.create_foreign_key(None, 'datasets', 'agents', ['publisher_id'], ['id'])
    op.create_foreign_key(None, 'datasets', 'agents', ['contact_point_id'], ['id'])

    op.drop_column('datasets', 'file_path')
    op.drop_column('datasets', 'last_modified_date')
    op.drop_column('datasets', 'incremental_replace')
    op.drop_column('datasets', 'creation_date')
    op.drop_column('datasets', 'owner_id')
    op.drop_column('datasets', 'name')
    op.drop_column('datasets', 'contact_id')
    op.drop_column('datasets', 'file_blob')

def downgrade() -> None:
    # Wiederherstellen der Spalten
    op.add_column('datasets', sa.Column('file_blob', sa.BLOB(), nullable=True))
    op.add_column('datasets', sa.Column('contact_id', mysql.INTEGER(display_width=11), autoincrement=False, nullable=False))
    op.add_column('datasets', sa.Column('name', mysql.VARCHAR(length=255), nullable=False))
    op.add_column('datasets', sa.Column('owner_id', mysql.INTEGER(display_width=11), autoincrement=False, nullable=False))
    op.add_column('datasets', sa.Column('creation_date', mysql.DATETIME(), nullable=False))
    op.add_column('datasets', sa.Column('incremental_replace', mysql.VARCHAR(length=50), nullable=False))
    op.add_column('datasets', sa.Column('last_modified_date', mysql.DATETIME(), nullable=False))
    op.add_column('datasets', sa.Column('file_path', mysql.VARCHAR(length=1024), nullable=True))

    # Wiederherstellen von Constraints
    op.drop_constraint(None, 'datasets', type_='foreignkey')
    op.drop_constraint(None, 'datasets', type_='foreignkey')
    op.create_foreign_key('datasets_ibfk_2', 'datasets', 'persons', ['owner_id'], ['id'])
    op.create_foreign_key('datasets_ibfk_1', 'datasets', 'persons', ['contact_id'], ['id'])
    op.drop_constraint(None, 'datasets', type_='unique')
    op.drop_column('datasets', 'semantic_model')
    op.drop_column('datasets', 'theme')
    op.drop_column('datasets', 'file_format')
    op.drop_column('datasets', 'download_url')
    op.drop_column('datasets', 'access_url')
    op.drop_column('datasets', 'contact_point_id')
    op.drop_column('datasets', 'publisher_id')
    op.drop_column('datasets', 'modified')
    op.drop_column('datasets', 'issued')
    op.drop_column('datasets', 'identifier')
    op.drop_column('datasets', 'title')

    # Wiederherstellen der "persons"-Tabelle
    op.create_table('persons',
        sa.Column('id', mysql.INTEGER(display_width=11), autoincrement=True, nullable=False),
        sa.Column('name', mysql.VARCHAR(length=255), nullable=False),
        sa.Column('email', mysql.VARCHAR(length=255), nullable=False),
        sa.Column('phone_number', mysql.VARCHAR(length=50), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        mysql_collate='utf8mb4_general_ci',
        mysql_default_charset='utf8mb4',
        mysql_engine='InnoDB'
    )
    op.create_index('email', 'persons', ['email'], unique=True)
    op.drop_table('catalogs')
    op.drop_table('agents')
