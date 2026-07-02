"""add_new_scoring_components_to_score_model

Revision ID: 163561739060
Revises: 64a694934e1f
Create Date: 2026-06-29 16:47:18.586243

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '163561739060'
down_revision: Union[str, Sequence[str], None] = '64a694934e1f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('scores', sa.Column('winner_prediction_points', sa.Float(), nullable=True, server_default='0.0'))
    op.add_column('scores', sa.Column('exact_scoreline_points', sa.Float(), nullable=True, server_default='0.0'))
    op.add_column('scores', sa.Column('one_team_score_points', sa.Float(), nullable=True, server_default='0.0'))
    op.add_column('scores', sa.Column('goal_difference_points', sa.Float(), nullable=True, server_default='0.0'))
    op.add_column('scores', sa.Column('winner_confidence_points', sa.Float(), nullable=True, server_default='0.0'))
    op.add_column('scores', sa.Column('btts_probability_points', sa.Float(), nullable=True, server_default='0.0'))
    op.add_column('scores', sa.Column('first_team_to_score_probability_points', sa.Float(), nullable=True, server_default='0.0'))
    op.add_column('scores', sa.Column('goal_scorer_points', sa.Float(), nullable=True, server_default='0.0'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('scores', 'goal_scorer_points')
    op.drop_column('scores', 'first_team_to_score_probability_points')
    op.drop_column('scores', 'btts_probability_points')
    op.drop_column('scores', 'winner_confidence_points')
    op.drop_column('scores', 'goal_difference_points')
    op.drop_column('scores', 'one_team_score_points')
    op.drop_column('scores', 'exact_scoreline_points')
    op.drop_column('scores', 'winner_prediction_points')
