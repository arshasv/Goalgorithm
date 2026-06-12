from fastapi import APIRouter

from app.api.prediction_routes import router as prediction_router
from app.api.result_routes import router as result_router
from app.api.scoring_routes import router as scoring_router
from app.api.leaderboard_routes import router as leaderboard_router
from app.api.auth_routes import router as auth_router
from app.api.team_routes import router as team_router

router = APIRouter()

router.include_router(prediction_router)
router.include_router(result_router)
router.include_router(scoring_router)
router.include_router(leaderboard_router)
router.include_router(auth_router)
router.include_router(team_router)
