"""add ai prediction format columns

Revision ID: a1b2c3d4e5f7
Revises: 2026_06_23_142811_add_analytics_flags
Create Date: 2026-06-25 11:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f7'
down_revision: Union[str, Sequence[str]] = '2026_06_23_142811'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add new columns to predictions and player_predictions for AI JSON format."""

    # --- predictions table: new columns ---
    # BTTS prediction boolean
    op.add_column('predictions', sa.Column('both_teams_to_score_prediction', sa.Boolean(), nullable=True))

    # First goal team probability
    op.add_column('predictions', sa.Column('first_goal_team_probability', sa.Float(), nullable=True))

    # Clean sheet predictions as JSON array
    op.add_column('predictions', sa.Column('clean_sheet_predictions', sa.JSON(), nullable=True))

    # --- player_predictions table: new column ---
    # Team name for player
    op.add_column('player_predictions', sa.Column('team', sa.String(length=255), nullable=True))

    # Make player_id nullable (AI format doesn't require it)
    with op.batch_alter_table('player_predictions') as batch_op:
        batch_op.alter_column('player_id', existing_type=sa.String(length=255), nullable=True)


def downgrade() -> None:
    """Remove AI format columns."""
    op.drop_column('predictions', 'both_teams_to_score_prediction')
    op.drop_column('predictions', 'first_goal_team_probability')
    op.drop_column('predictions', 'clean_sheet_predictions')
    op.drop_column('player_predictions', 'team')

    with op.batch_alter_table('player_predictions') as batch_op:
        batch_op.alter_column('player_id', existing_type=sa.String(length=255), nullable=False)
