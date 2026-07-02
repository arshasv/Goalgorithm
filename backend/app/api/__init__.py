from fastapi import APIRouter

from app.api.prediction_routes import router as prediction_router
from app.api.result_routes import router as result_router
from app.api.scoring_routes import router as scoring_router
from app.api.leaderboard_routes import router as leaderboard_router
from app.api.auth_routes import router as auth_router
from app.api.team_routes import router as team_router
from app.api.scores_routes import router as scores_router
from app.api.scoring_config_routes import router as scoring_config_router
from app.api.model_submission_routes import team_model_router, admin_model_router
from app.api.upload_window_routes import router as upload_window_router
from app.api.match_routes import router as match_router
from app.api.external_matches_routes import router as external_matches_router
from app.api.leaderboard_settings_routes import router as leaderboard_settings_router
from app.api.admin_auth_routes import router as admin_auth_router
from app.api.analytics_routes import router as analytics_router
from app.api.model_evaluation_routes import router as model_evaluation_router
from app.api.report_routes import router as report_router
from app.api.batch_execution_routes import router as batch_execution_router
from app.file_manager.routers.drive import router as drive_router

router = APIRouter()

router = APIRouter()

# Authentication
router.include_router(auth_router)
router.include_router(admin_auth_router)

# Teams
router.include_router(team_router)

# Matches
router.include_router(match_router)
router.include_router(external_matches_router)

# Predictions
router.include_router(prediction_router)

# Results
router.include_router(result_router)

# Scores
router.include_router(scores_router)
router.include_router(scoring_router)

# Leaderboard
router.include_router(leaderboard_router)
router.include_router(leaderboard_settings_router)

# Analytics
router.include_router(analytics_router)

# Reports
router.include_router(report_router)

# Scoring Config
router.include_router(scoring_config_router)

# Upload Window
router.include_router(upload_window_router)

# Model Submission
router.include_router(team_model_router)
router.include_router(admin_model_router)

# Model Evaluation
router.include_router(model_evaluation_router)

# Batch Execution
router.include_router(batch_execution_router)

# Google Drive
router.include_router(drive_router)