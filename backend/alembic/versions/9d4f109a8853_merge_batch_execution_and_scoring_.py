"""merge batch execution and scoring configs

Revision ID: 9d4f109a8853
Revises: 85c37ac8fe4b, a2b3c4d5e6f7
Create Date: 2026-06-30 08:51:20.571092

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9d4f109a8853'
down_revision: Union[str, Sequence[str], None] = ('1e8b23c4f5a6', 'a2b3c4d5e6f7')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
