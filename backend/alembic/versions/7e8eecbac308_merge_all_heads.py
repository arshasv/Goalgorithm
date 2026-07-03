"""Merge all heads

Revision ID: 7e8eecbac308
Revises: 9d4f109a8853, d7e8f9a0b1c2
Create Date: 2026-07-01 04:47:00.255268

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7e8eecbac308'
down_revision: Union[str, Sequence[str], None] = ('9d4f109a8853', 'd7e8f9a0b1c2')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
