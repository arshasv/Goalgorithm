import uuid
import pickle
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.database import session
from app.model_execution.models.model_execution import ModelExecutionModel
from app.model_execution.services.model_serializer import ModelSerializer
from app.services.prediction_service import PredictionService

class ModelExecutor:
    def __init__(self, execution_id: uuid.UUID):
        self.execution_id = execution_id

    def execute_in_background(self):
        db: Session = session.SessionLocal()
        try:
            execution = db.query(ModelExecutionModel).filter(
                ModelExecutionModel.id == self.execution_id
            ).first()
            if not execution:
                return

            execution.status = "RUNNING"
            execution.started_at = datetime.now(timezone.utc)
            db.commit()

            model_upload = execution.model_upload
            if not model_upload:
                raise ValueError("Model upload record not found")

            file_path = model_upload.stored_file_path

            # Load model
            try:
                with open(file_path, "rb") as f:
                    model = pickle.load(f)
            except Exception as e:
                raise ValueError(f"Failed to deserialize model: {str(e)}")

            if not hasattr(model, "predict"):
                raise AttributeError("Uploaded model object has no 'predict' method")

            # Execute model
            try:
                model_output = model.predict()
            except Exception as e:
                raise RuntimeError(f"Error during model execution: {str(e)}")

            # Serialize output
            serializer = ModelSerializer()
            payload = serializer.serialize_output(
                model_output=model_output,
                team_id=model_upload.team_id,
                match_id=model_upload.match_id
            )

            # Save prediction
            pred_service = PredictionService(db)
            result = pred_service.save_prediction(payload)
            
            # Fetch the saved prediction to link its ID
            from app.models.prediction import PredictionModel
            pred_record = db.query(PredictionModel).filter(
                PredictionModel.team_id == model_upload.team_id,
                PredictionModel.match_id == model_upload.match_id
            ).first()

            if pred_record:
                execution.prediction_id = pred_record.id

            execution.status = "SUCCESS"
            execution.completed_at = datetime.now(timezone.utc)
            db.commit()

        except Exception as e:
            db.rollback()
            execution = db.query(ModelExecutionModel).filter(ModelExecutionModel.id == self.execution_id).first()
            if execution:
                execution.status = "FAILED"
                execution.error_message = str(e)
                execution.completed_at = datetime.now(timezone.utc)
                db.commit()
        finally:
            db.close()
