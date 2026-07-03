import uuid
import sys
import os
import traceback

sys.path.append(os.path.join(os.path.dirname(__file__), "app"))

from app.database.session import SessionLocal
from app.models.match import MatchModel
from app.models.team import TeamModel
from app.model_execution.models.model_upload import ModelUploadModel
from app.models.batch_execution import BatchExecutionModel, BatchExecutionJobModel
from app.models.prediction import PredictionModel
from app.models.score import ScoreModel
from app.models.enums import MatchStatus, BatchJobStatus, BatchExecutionStatus
from app.models.score import CumulativePhaseScoreModel
from app.models.leaderboard import LeaderboardModel
from app.model_execution.models.model_execution import ModelExecutionModel
from app.models.prediction import PlayerPredictionModel
from app.models.actual_result import ActualResultModel, PlayerActualModel
from datetime import datetime, timezone, timedelta

def run_test():
    db = SessionLocal()
    
    try:
        # Create a dummy match
        match_id = uuid.uuid4()
        match = MatchModel(
            id=match_id,
            match_number=9999,
            home_team_name="Test Home",
            away_team_name="Test Away",
            scheduled_at=datetime.now(timezone.utc) + timedelta(days=1),
            freeze_deadline=datetime.now(timezone.utc) + timedelta(hours=23),
            status=MatchStatus.SCHEDULED
        )
        db.add(match)
        
        # Use an existing team
        team = db.query(TeamModel).first()
        if not team:
            print("No teams exist. Cannot test without a team.")
            return
        team_id = team.id
        
        # Create a model upload
        upload_id = uuid.uuid4()
        upload = ModelUploadModel(
            id=upload_id,
            team_id=str(team_id),
            match_id=match_id,
            file_name="test.zip",
            file_path="/tmp/test.zip",
            version=1
        )
        db.add(upload)
        db.flush()
        
        # Create a batch execution job
        batch_id = uuid.uuid4()
        batch_exec = BatchExecutionModel(
            id=batch_id,
            created_by=team_id, # not really correct but just for test
            overall_status=BatchExecutionStatus.PENDING,
            total_jobs=1
        )
        db.add(batch_exec)
        db.flush()
        
        job = BatchExecutionJobModel(
            id=uuid.uuid4(),
            batch_id=batch_id,
            team_id=team_id,
            model_upload_id=upload_id,
            match_id=match_id,
            status=BatchJobStatus.PENDING
        )
        db.add(job)
        db.commit()
        
        print("Created test entities.")
        
        # Inlined deletion logic to avoid MatchService import
        try:
            uploads = db.query(ModelUploadModel.id).filter(ModelUploadModel.match_id == match_id).all()
            upload_ids = [r[0] for r in uploads]

            if upload_ids:
                db.query(BatchExecutionJobModel).filter(
                    BatchExecutionJobModel.model_upload_id.in_(upload_ids)
                ).delete(synchronize_session='fetch')
                
            db.query(BatchExecutionJobModel).filter(
                BatchExecutionJobModel.match_id == match_id
            ).delete(synchronize_session='fetch')

            if upload_ids:
                db.query(ModelExecutionModel).filter(
                    ModelExecutionModel.model_upload_id.in_(upload_ids)
                ).delete(synchronize_session='fetch')

            preds = db.query(PredictionModel.id).filter(PredictionModel.match_id == str(match_id)).all()
            if preds:
                pred_ids = [r[0] for r in preds]
                db.query(PlayerPredictionModel).filter(
                    PlayerPredictionModel.prediction_id.in_(pred_ids)
                ).delete(synchronize_session='fetch')
                db.query(ModelExecutionModel).filter(
                    ModelExecutionModel.prediction_id.in_(pred_ids)
                ).delete(synchronize_session='fetch')
                db.query(PredictionModel).filter(
                    PredictionModel.id.in_(pred_ids)
                ).delete(synchronize_session='fetch')

            results = db.query(ActualResultModel.id).filter(ActualResultModel.match_id == str(match_id)).all()
            if results:
                res_ids = [r[0] for r in results]
                db.query(PlayerActualModel).filter(
                    PlayerActualModel.actual_result_id.in_(res_ids)
                ).delete(synchronize_session='fetch')
                db.query(ActualResultModel).filter(
                    ActualResultModel.id.in_(res_ids)
                ).delete(synchronize_session='fetch')

            db.query(ScoreModel).filter(ScoreModel.match_id == str(match_id)).delete(synchronize_session='fetch')

            db.query(LeaderboardModel).delete(synchronize_session='fetch')
            db.query(CumulativePhaseScoreModel).delete(synchronize_session='fetch')

            if upload_ids:
                db.query(ModelUploadModel).filter(
                    ModelUploadModel.id.in_(upload_ids)
                ).delete(synchronize_session='fetch')

            db.delete(match)
            db.flush()
            db.expire_all()
            db.commit()
            
            print("Successfully deleted match without ForeignKeyViolation!")
            
        except Exception as e:
            print(f"Failed to delete match: {e}")
            traceback.print_exc()
            
    finally:
        db.close()

if __name__ == "__main__":
    run_test()
