import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.score import CumulativePhaseScoreModel, ScoreModel
from app.repositories.base_repository import BaseRepository


class ScoreRepository(BaseRepository[ScoreModel]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, ScoreModel)

    def get_by_team_and_match(
        self, team_id: str | uuid.UUID, match_id: str | uuid.UUID
    ) -> ScoreModel | None:
        t_id = str(team_id)
        m_id = str(match_id)
        return self.db.execute(
            select(ScoreModel).where(
                ScoreModel.team_id == t_id,
                ScoreModel.match_id == m_id,
            )
        ).scalar_one_or_none()

    def get_by_match(self, match_id: str | uuid.UUID) -> list[ScoreModel]:
        m_id = str(match_id)
        return list(
            self.db.execute(
                select(ScoreModel).where(ScoreModel.match_id == m_id)
            )
            .scalars()
            .all()
        )

    def get_by_team(self, team_id: str | uuid.UUID) -> list[ScoreModel]:
        t_id = str(team_id)
        return list(
            self.db.execute(
                select(ScoreModel).where(ScoreModel.team_id == t_id)
            )
            .scalars()
            .all()
        )

    def get_team_scores_for_phase(
        self, team_id: str | uuid.UUID
    ) -> list[ScoreModel]:
        t_id = str(team_id)
        return list(
            self.db.execute(
                select(ScoreModel)
                .where(ScoreModel.team_id == t_id)
                .where(ScoreModel.earned_points.isnot(None))
            )
            .scalars()
            .all()
        )


class CumulativePhaseScoreRepository(BaseRepository[CumulativePhaseScoreModel]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, CumulativePhaseScoreModel)

    def get_by_team(
        self, team_id: str | uuid.UUID
    ) -> CumulativePhaseScoreModel | None:
        t_id = str(team_id)
        return self.db.execute(
            select(CumulativePhaseScoreModel).where(
                CumulativePhaseScoreModel.team_id == t_id
            )
        ).scalar_one_or_none()
