"""merge_heads

Revision ID: 3511674ec231
Revises: 5e6f7bb94e76, 85c37ac8fe4b
Create Date: 2026-07-03 05:57:23.522828

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3511674ec231'
down_revision: Union[str, Sequence[str], None] = ('5e6f7bb94e76', '85c37ac8fe4b')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
