import logging
import pickle
import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.database import session
from app.model_execution.models.model_execution import ModelExecutionModel
from app.model_execution.services.model_serializer import ModelSerializer
from app.services.prediction_service import PredictionService
import pandas as pd
import numpy as np
import scipy
from scipy import stats
import xgboost as xgb
import lightgbm as lgb
import sklearn
import math
from app.file_manager.services.storage_service import StorageService, StorageDownloadError

logger = logging.getLogger(__name__)


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
                logger.error("Execution record not found: id=%s", self.execution_id)
                return

            execution.status = "RUNNING"
            execution.started_at = datetime.now(timezone.utc)
            db.commit()

            logger.info(
                "Execution started: id=%s, model_upload_id=%s",
                self.execution_id,
                execution.model_upload_id,
            )

            model_upload = execution.model_upload

            if not model_upload:
                raise ValueError("Model upload record not found")

            # -------------------------
            # Retrieve & deserialize model via StorageService (with retries)
            # -------------------------
            storage = StorageService()
            temp_path: str | None = None

            try:
                temp_path = storage.download_with_retry(
                    model_upload,
                    max_retries=3,
                    retry_delay_seconds=2.0,
                )
                logger.info(
                    "Model downloaded to temp file: path=%s, model_upload_id=%s",
                    temp_path,
                    model_upload.id,
                )

                import joblib
                import pickle
                
                original_filename = model_upload.original_filename.lower() if model_upload.original_filename else ""
                model = None
                loaded_lib = None
                
                with open(temp_path, "rb") as f:
                    model = pickle.load(f)
                loaded_lib = "pickle"

                # -------------------------
                # DIAGNOSTICS: Verify Model Loading
                # -------------------------
                logger.info("=== DIAGNOSTICS: Model Loading ===")
                logger.info(f"Model Class: {model.__class__.__name__}")
                logger.info(f"Module Name: {model.__class__.__module__}")
                logger.info(f"Full Type: {type(model)}")
                logger.info(f"Exposes predict(): {hasattr(model, 'predict')}")
                logger.info(f"Exposes predict_proba(): {hasattr(model, 'predict_proba')}")
                logger.info(f"Public Attributes: {[d for d in dir(model) if not d.startswith('_')]}")
                if hasattr(model, "__dict__"):
                    logger.info(f"Instance Dictionary Keys: {list(model.__dict__.keys())}")

                # -------------------------
                # DIAGNOSTICS: Inspect Runtime Environment
                # -------------------------
                import sys
                import os
                from importlib.metadata import version, PackageNotFoundError
                logger.info("=== DIAGNOSTICS: Runtime Environment ===")
                logger.info(f"Python Version: {sys.version}")
                logger.info(f"CWD: {os.getcwd()}")
                
                packages_to_check = ["scikit-learn", "numpy", "pandas", "scipy", "cloudpickle", "xgboost", "lightgbm"]
                for pkg in packages_to_check:
                    try:
                        ver = version(pkg)
                        logger.info(f"Package {pkg}: {ver}")
                    except PackageNotFoundError:
                        logger.info(f"Package {pkg}: NOT INSTALLED")

                # -------------------------
                # DIAGNOSTICS: Inspect Downloaded Model
                # -------------------------
                logger.info("=== DIAGNOSTICS: Downloaded Model ===")
                logger.info(f"Temp Path: {temp_path}")
                logger.info(f"File Size: {os.path.getsize(temp_path) if os.path.exists(temp_path) else 'N/A'} bytes")
                logger.info(f"Original Filename: {model_upload.original_filename}")
                logger.info(f"File Extension: {os.path.splitext(model_upload.original_filename)[1] if model_upload.original_filename else 'None'}")
                temp_dir = os.path.dirname(temp_path)
                logger.info(f"Files in Temp Directory: {os.listdir(temp_dir)}")
                
                logger.info(
                    "Model deserialised successfully: model_upload_id=%s, type=%s, loaded_with=%s",
                    model_upload.id,
                    type(model).__name__,
                    loaded_lib
                )

            except StorageDownloadError as exc:
                raise ValueError(f"Model download failed: {exc}") from exc
            except ValueError as exc:
                raise
            except Exception as exc:
                raise ValueError(f"Failed to deserialise model: {exc}") from exc
            finally:
                storage.cleanup(temp_path)

            if not hasattr(model, "predict"):
                raise AttributeError(
                    "Uploaded model object has no 'predict' method"
                )

            # -------------------------
            # Get match details
            # -------------------------
            try:
                from app.models.match import MatchModel

                match = db.query(MatchModel).filter(
                    MatchModel.id == model_upload.match_id
                ).first()

                if not match:
                    raise ValueError("Match record not found")

            except Exception as exc:
                raise RuntimeError(f"Unable to fetch match data: {exc}") from exc

            # -------------------------
            # Execute AI model
            # -------------------------
            try:
                model_input = {
                    "home_team": match.home_team_name,
                    "away_team": match.away_team_name,
                }

                logger.info(
                    "Calling model.predict: execution_id=%s, match=%s vs %s",
                    self.execution_id,
                    match.home_team_name,
                    match.away_team_name,
                )

                # -------------------------
                # DIAGNOSTICS: Model State Before Prediction
                # -------------------------
                if hasattr(model, "__dict__"):
                    logger.info(f"=== DIAGNOSTICS: Model State Before ===\n{model.__dict__}")

                # -------------------------
                # DIAGNOSTICS: Exact Model Input
                # -------------------------
                logger.info(f"=== DIAGNOSTICS: Exact Model Input ===\n{model_input}")

                model_output = model.predict(model_input)

                # -------------------------
                # DIAGNOSTICS: Raw Model Output
                # -------------------------
                logger.info(f"=== DIAGNOSTICS: Raw Model Output ===\n{model_output}")

                # -------------------------
                # DIAGNOSTICS: Model State After Prediction
                # -------------------------
                if hasattr(model, "__dict__"):
                    logger.info(f"=== DIAGNOSTICS: Model State After ===\n{model.__dict__}")

            except Exception as exc:
                raise RuntimeError(f"Error during model execution: {exc}") from exc

            # -------------------------
            # Convert model output
            # -------------------------
            serializer = ModelSerializer()
            payload = serializer.serialize_output(
                model_output=model_output,
                team_id=model_upload.team_id,
                match_id=model_upload.match_id,
            )

            # -------------------------
            # Save prediction (upsert)
            # -------------------------
            pred_service = PredictionService(db)
            pred_service.save_prediction(payload)

            from app.models.prediction import PredictionModel

            pred_record = db.query(PredictionModel).filter(
                PredictionModel.team_id == str(model_upload.team_id),
                PredictionModel.match_id == str(model_upload.match_id),
            ).first()

            if pred_record:
                execution.prediction_id = pred_record.id
                logger.info(
                    "Prediction upserted: prediction_id=%s, execution_id=%s",
                    pred_record.id,
                    self.execution_id,
                )

            execution.status = "SUCCESS"
            execution.completed_at = datetime.now(timezone.utc)
            db.commit()

            logger.info(
                "Execution completed successfully: id=%s", self.execution_id
            )

        except Exception as exc:
            db.rollback()

            logger.exception(
                "Execution failed: id=%s, error=%s", self.execution_id, exc
            )

            execution = db.query(ModelExecutionModel).filter(
                ModelExecutionModel.id == self.execution_id
            ).first()

            if execution:
                execution.status = "FAILED"
                execution.error_message = str(exc)
                execution.completed_at = datetime.now(timezone.utc)
                db.commit()

        finally:
            db.close()

