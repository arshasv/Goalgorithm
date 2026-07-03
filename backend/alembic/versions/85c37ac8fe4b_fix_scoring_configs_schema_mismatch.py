"""fix_scoring_configs_schema_mismatch

Revision ID: 85c37ac8fe4b
Revises: 163561739060
Create Date: 2026-06-29 17:21:38.614617

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '85c37ac8fe4b'
down_revision: Union[str, Sequence[str], None] = '163561739060'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    from sqlalchemy.engine.reflection import Inspector
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    columns = [c['name'] for c in inspector.get_columns('scoring_configs')]

    # Winner Prediction
    if 'first_team_to_score_points_correct' not in columns:
        op.add_column('scoring_configs', sa.Column('first_team_to_score_points_correct', sa.Float(), server_default='2.5', nullable=False))
    else:
        op.alter_column('scoring_configs', 'first_team_to_score_points_correct', type_=sa.Float(), server_default='2.5', existing_type=sa.Integer())

    if 'first_team_to_score_points_incorrect' not in columns:
        op.add_column('scoring_configs', sa.Column('first_team_to_score_points_incorrect', sa.Float(), server_default='0.0', nullable=False))
    else:
        op.alter_column('scoring_configs', 'first_team_to_score_points_incorrect', type_=sa.Float(), server_default='0.0', existing_type=sa.Integer())

    # Scoreline Prediction
    if 'scoreline_points_one_team_correct' not in columns:
        op.add_column('scoring_configs', sa.Column('scoreline_points_one_team_correct', sa.Float(), server_default='4.0', nullable=False))

    # Probability — Winner Confidence
    if 'prob_winner_high_threshold' not in columns:
        op.add_column('scoring_configs', sa.Column('prob_winner_high_threshold', sa.Float(), server_default='70.0', nullable=False))
    if 'prob_winner_high_points' not in columns:
        op.add_column('scoring_configs', sa.Column('prob_winner_high_points', sa.Float(), server_default='2.0', nullable=False))
    if 'prob_winner_medium_threshold' not in columns:
        op.add_column('scoring_configs', sa.Column('prob_winner_medium_threshold', sa.Float(), server_default='50.0', nullable=False))
    if 'prob_winner_medium_points' not in columns:
        op.add_column('scoring_configs', sa.Column('prob_winner_medium_points', sa.Float(), server_default='1.5', nullable=False))
    if 'prob_winner_low_threshold' not in columns:
        op.add_column('scoring_configs', sa.Column('prob_winner_low_threshold', sa.Float(), server_default='30.0', nullable=False))
    if 'prob_winner_low_points' not in columns:
        op.add_column('scoring_configs', sa.Column('prob_winner_low_points', sa.Float(), server_default='1.0', nullable=False))
    if 'prob_winner_fail_points' not in columns:
        op.add_column('scoring_configs', sa.Column('prob_winner_fail_points', sa.Float(), server_default='0.0', nullable=False))

    # Probability — BTTS
    if 'prob_btts_high_threshold' not in columns:
        op.add_column('scoring_configs', sa.Column('prob_btts_high_threshold', sa.Float(), server_default='70.0', nullable=False))
    if 'prob_btts_high_points' not in columns:
        op.add_column('scoring_configs', sa.Column('prob_btts_high_points', sa.Float(), server_default='1.0', nullable=False))
    if 'prob_btts_medium_threshold' not in columns:
        op.add_column('scoring_configs', sa.Column('prob_btts_medium_threshold', sa.Float(), server_default='50.0', nullable=False))
    if 'prob_btts_medium_points' not in columns:
        op.add_column('scoring_configs', sa.Column('prob_btts_medium_points', sa.Float(), server_default='0.75', nullable=False))
    if 'prob_btts_low_threshold' not in columns:
        op.add_column('scoring_configs', sa.Column('prob_btts_low_threshold', sa.Float(), server_default='30.0', nullable=False))
    if 'prob_btts_low_points' not in columns:
        op.add_column('scoring_configs', sa.Column('prob_btts_low_points', sa.Float(), server_default='0.5', nullable=False))
    if 'prob_btts_fail_points' not in columns:
        op.add_column('scoring_configs', sa.Column('prob_btts_fail_points', sa.Float(), server_default='0.0', nullable=False))

    # Probability — First Team to Score
    if 'prob_first_goal_high_threshold' not in columns:
        op.add_column('scoring_configs', sa.Column('prob_first_goal_high_threshold', sa.Float(), server_default='70.0', nullable=False))
    if 'prob_first_goal_high_points' not in columns:
        op.add_column('scoring_configs', sa.Column('prob_first_goal_high_points', sa.Float(), server_default='2.0', nullable=False))
    if 'prob_first_goal_medium_threshold' not in columns:
        op.add_column('scoring_configs', sa.Column('prob_first_goal_medium_threshold', sa.Float(), server_default='50.0', nullable=False))
    if 'prob_first_goal_medium_points' not in columns:
        op.add_column('scoring_configs', sa.Column('prob_first_goal_medium_points', sa.Float(), server_default='1.5', nullable=False))
    if 'prob_first_goal_low_threshold' not in columns:
        op.add_column('scoring_configs', sa.Column('prob_first_goal_low_threshold', sa.Float(), server_default='30.0', nullable=False))
    if 'prob_first_goal_low_points' not in columns:
        op.add_column('scoring_configs', sa.Column('prob_first_goal_low_points', sa.Float(), server_default='1.0', nullable=False))
    if 'prob_first_goal_fail_points' not in columns:
        op.add_column('scoring_configs', sa.Column('prob_first_goal_fail_points', sa.Float(), server_default='0.0', nullable=False))

    # Player Performance — Goal Scorers
    if 'player_goals_all_correct' not in columns:
        op.add_column('scoring_configs', sa.Column('player_goals_all_correct', sa.Float(), server_default='2.5', nullable=False))
    if 'player_goals_half_correct' not in columns:
        op.add_column('scoring_configs', sa.Column('player_goals_half_correct', sa.Float(), server_default='1.5', nullable=False))
    if 'player_goals_at_least_one' not in columns:
        op.add_column('scoring_configs', sa.Column('player_goals_at_least_one', sa.Float(), server_default='1.0', nullable=False))
    if 'player_goals_none' not in columns:
        op.add_column('scoring_configs', sa.Column('player_goals_none', sa.Float(), server_default='0.0', nullable=False))

    # Player Performance — Clean Sheet
    if 'clean_sheet_both_correct' not in columns:
        op.add_column('scoring_configs', sa.Column('clean_sheet_both_correct', sa.Float(), server_default='2.5', nullable=False))
    if 'clean_sheet_one_correct' not in columns:
        op.add_column('scoring_configs', sa.Column('clean_sheet_one_correct', sa.Float(), server_default='1.0', nullable=False))
    if 'clean_sheet_none' not in columns:
        op.add_column('scoring_configs', sa.Column('clean_sheet_none', sa.Float(), server_default='0.0', nullable=False))

    # Alter existing columns to Float
    op.alter_column('scoring_configs', 'winner_points_correct', type_=sa.Float(), server_default='2.5', existing_type=sa.Integer())
    op.alter_column('scoring_configs', 'winner_points_incorrect', type_=sa.Float(), server_default='0.0', existing_type=sa.Integer())
    op.alter_column('scoring_configs', 'scoreline_points_exact', type_=sa.Float(), server_default='7.5', existing_type=sa.Integer())
    op.alter_column('scoring_configs', 'scoreline_points_margin', type_=sa.Float(), server_default='3.0', existing_type=sa.Integer())
    op.alter_column('scoring_configs', 'scoreline_points_incorrect', type_=sa.Float(), server_default='0.0', existing_type=sa.Integer())

    # Update probability-related columns to Float
    op.alter_column('scoring_configs', 'probability_points_pass', type_=sa.Float(), server_default='5.0', existing_type=sa.Integer())
    op.alter_column('scoring_configs', 'probability_points_fail', type_=sa.Float(), server_default='0.0', existing_type=sa.Integer())
    op.alter_column('scoring_configs', 'probability_high_points', type_=sa.Float(), server_default='5.0', existing_type=sa.Integer())
    op.alter_column('scoring_configs', 'probability_medium_points', type_=sa.Float(), server_default='2.0', existing_type=sa.Integer())

    # Update player performance columns
    op.alter_column('scoring_configs', 'player_points_exact', type_=sa.Float(), server_default='5.0', existing_type=sa.Integer())
    op.alter_column('scoring_configs', 'player_points_close', type_=sa.Float(), server_default='2.0', existing_type=sa.Integer())
    op.alter_column('scoring_configs', 'player_points_wrong', type_=sa.Float(), server_default='0.0', existing_type=sa.Integer())

    # Update BTTS columns
    op.alter_column('scoring_configs', 'btts_points_correct', type_=sa.Float(), server_default='2.5', existing_type=sa.Integer())
    op.alter_column('scoring_configs', 'btts_points_incorrect', type_=sa.Float(), server_default='0.0', existing_type=sa.Integer())

    # Update clean sheet columns
    op.alter_column('scoring_configs', 'clean_sheet_points_correct', type_=sa.Float(), server_default='5.0', existing_type=sa.Integer())
    op.alter_column('scoring_configs', 'clean_sheet_points_incorrect', type_=sa.Float(), server_default='0.0', existing_type=sa.Integer())

    # Update total goals columns
    op.alter_column('scoring_configs', 'total_goals_points_exact', type_=sa.Float(), server_default='5.0', existing_type=sa.Integer())
    op.alter_column('scoring_configs', 'total_goals_points_wrong', type_=sa.Float(), server_default='0.0', existing_type=sa.Integer())

    # Map/migrate existing configuration row values to new policy values:
    connection = op.get_bind()
    connection.execute(
        sa.text("""
            UPDATE scoring_configs
            SET
                winner_points_correct = 2.5,
                winner_points_incorrect = 0.0,
                first_team_to_score_points_correct = 2.5,
                first_team_to_score_points_incorrect = 0.0,
                scoreline_points_exact = 7.5,
                scoreline_points_one_team_correct = 4.0,
                scoreline_points_margin = 3.0,
                scoreline_points_incorrect = 0.0,
                btts_points_correct = 2.5,
                btts_points_incorrect = 0.0,
                prob_winner_high_threshold = 70.0,
                prob_winner_high_points = 2.0,
                prob_winner_medium_threshold = 50.0,
                prob_winner_medium_points = 1.5,
                prob_winner_low_threshold = 30.0,
                prob_winner_low_points = 1.0,
                prob_winner_fail_points = 0.0,
                prob_btts_high_threshold = 70.0,
                prob_btts_high_points = 1.0,
                prob_btts_medium_threshold = 50.0,
                prob_btts_medium_points = 0.75,
                prob_btts_low_threshold = 30.0,
                prob_btts_low_points = 0.5,
                prob_btts_fail_points = 0.0,
                prob_first_goal_high_threshold = 70.0,
                prob_first_goal_high_points = 2.0,
                prob_first_goal_medium_threshold = 50.0,
                prob_first_goal_medium_points = 1.5,
                prob_first_goal_low_threshold = 30.0,
                prob_first_goal_low_points = 1.0,
                prob_first_goal_fail_points = 0.0,
                player_goals_all_correct = 2.5,
                player_goals_half_correct = 1.5,
                player_goals_at_least_one = 1.0,
                player_goals_none = 0.0,
                clean_sheet_both_correct = 2.5,
                clean_sheet_one_correct = 1.0,
                clean_sheet_none = 0.0
        """)
    )


def downgrade() -> None:
    op.drop_column('scoring_configs', 'clean_sheet_none')
    op.drop_column('scoring_configs', 'clean_sheet_one_correct')
    op.drop_column('scoring_configs', 'clean_sheet_both_correct')
    op.drop_column('scoring_configs', 'player_goals_none')
    op.drop_column('scoring_configs', 'player_goals_at_least_one')
    op.drop_column('scoring_configs', 'player_goals_half_correct')
    op.drop_column('scoring_configs', 'player_goals_all_correct')
    op.drop_column('scoring_configs', 'prob_first_goal_fail_points')
    op.drop_column('scoring_configs', 'prob_first_goal_low_points')
    op.drop_column('scoring_configs', 'prob_first_goal_low_threshold')
    op.drop_column('scoring_configs', 'prob_first_goal_medium_points')
    op.drop_column('scoring_configs', 'prob_first_goal_medium_threshold')
    op.drop_column('scoring_configs', 'prob_first_goal_high_points')
    op.drop_column('scoring_configs', 'prob_first_goal_high_threshold')
    op.drop_column('scoring_configs', 'prob_btts_fail_points')
    op.drop_column('scoring_configs', 'prob_btts_low_points')
    op.drop_column('scoring_configs', 'prob_btts_low_threshold')
    op.drop_column('scoring_configs', 'prob_btts_medium_points')
    op.drop_column('scoring_configs', 'prob_btts_medium_threshold')
    op.drop_column('scoring_configs', 'prob_btts_high_points')
    op.drop_column('scoring_configs', 'prob_btts_high_threshold')
    op.drop_column('scoring_configs', 'prob_winner_fail_points')
    op.drop_column('scoring_configs', 'prob_winner_low_points')
    op.drop_column('scoring_configs', 'prob_winner_low_threshold')
    op.drop_column('scoring_configs', 'prob_winner_medium_points')
    op.drop_column('scoring_configs', 'prob_winner_medium_threshold')
    op.drop_column('scoring_configs', 'prob_winner_high_points')
    op.drop_column('scoring_configs', 'prob_winner_high_threshold')
    op.drop_column('scoring_configs', 'scoreline_points_one_team_correct')
