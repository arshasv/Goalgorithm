"""Add drive fields to model_uploads

Revision ID: d7e8f9a0b1c2
Revises: c1d2e3f4g5h6
Create Date: 2026-06-30 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'd7e8f9a0b1c2'
down_revision = 'c1d2e3f4g5h6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table('model_uploads', schema=None) as batch_op:
        batch_op.add_column(sa.Column('drive_file_id', sa.String(length=1024), nullable=True))
        batch_op.add_column(sa.Column('drive_web_link', sa.String(length=2048), nullable=True))
        batch_op.add_column(
            sa.Column('storage_provider', sa.String(length=20), nullable=False, server_default='LOCAL')
        )
        batch_op.add_column(sa.Column('mime_type', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('file_size', sa.BigInteger(), nullable=True))
        batch_op.add_column(
            sa.Column('uploaded_to_drive_at', sa.DateTime(timezone=True), nullable=True)
        )


def downgrade() -> None:
    with op.batch_alter_table('model_uploads', schema=None) as batch_op:
        batch_op.drop_column('uploaded_to_drive_at')
        batch_op.drop_column('file_size')
        batch_op.drop_column('mime_type')
        batch_op.drop_column('storage_provider')
        batch_op.drop_column('drive_web_link')
        batch_op.drop_column('drive_file_id')
