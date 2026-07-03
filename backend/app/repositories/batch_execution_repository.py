import uuid
from sqlalchemy.orm import Session, joinedload
from app.models.batch_execution import BatchExecutionModel, BatchExecutionJobModel


class BatchExecutionRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_batch(self, created_by: uuid.UUID) -> BatchExecutionModel:
        batch = BatchExecutionModel(created_by=created_by)
        self.db.add(batch)
        self.db.commit()
        self.db.refresh(batch)
        return batch

    def discover_latest_models(self) -> list[dict]:
        from app.models.team import TeamModel
        from app.model_execution.models.model_upload import ModelUploadModel

        active_teams = self.db.query(TeamModel).filter(TeamModel.is_active == True).all()
        if not active_teams:
            return []

        active_team_ids = {team.id for team in active_teams}

        uploads = (
            self.db.query(ModelUploadModel)
            .filter(ModelUploadModel.team_id.in_(active_team_ids))
            .all()
        )

        latest_by_team = {}
        for upload in uploads:
            team_id = upload.team_id
            if team_id not in latest_by_team or upload.created_at > latest_by_team[team_id].created_at:
                latest_by_team[team_id] = upload

        discovered = []
        for team in active_teams:
            if team.id in latest_by_team:
                upload = latest_by_team[team.id]
                discovered.append({
                    "team": team,
                    "latest_model": upload,
                    "upload_time": upload.created_at
                })

        return discovered

    def get_batch(self, batch_id: uuid.UUID) -> BatchExecutionModel | None:
        return (
            self.db.query(BatchExecutionModel)
            .options(joinedload(BatchExecutionModel.jobs))
            .filter(BatchExecutionModel.id == batch_id)
            .first()
        )

    def list_batches(self) -> list[BatchExecutionModel]:
        return (
            self.db.query(BatchExecutionModel)
            .options(joinedload(BatchExecutionModel.jobs))
            .order_by(BatchExecutionModel.created_at.desc())
            .all()
        )

    def add_job(
        self,
        batch_id: uuid.UUID,
        team_id: uuid.UUID,
        match_id: uuid.UUID,
        model_upload_id: uuid.UUID | None = None,
    ) -> BatchExecutionJobModel:
        job = BatchExecutionJobModel(
            batch_id=batch_id,
            team_id=team_id,
            match_id=match_id,
            model_upload_id=model_upload_id,
        )
        self.db.add(job)
        batch = self.db.query(BatchExecutionModel).filter(BatchExecutionModel.id == batch_id).first()
        if batch:
            batch.total_jobs += 1
            batch.pending_jobs += 1
        self.db.commit()
        self.db.refresh(job)
        return job
