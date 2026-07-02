"""merge_heads

Revision ID: 64a694934e1f
Revises: 7c8d9e0f1a2b, c1d2e3f4g5h6
Create Date: 2026-06-29 16:46:58.459283

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '64a694934e1f'
down_revision: Union[str, Sequence[str], None] = ('7c8d9e0f1a2b', 'c1d2e3f4g5h6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
