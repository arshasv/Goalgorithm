from app.database.session import SessionLocal
from app.models.scoring_config import ScoringConfigModel

def update_config():
    db = SessionLocal()
    try:
        config = db.query(ScoringConfigModel).filter(ScoringConfigModel.is_active.is_(True)).first()
        if config:
            config.winner_points_correct = 2.5
            config.scoreline_points_exact = 7.5
            config.scoreline_points_margin = 3.0
            config.probability_points_pass = 5.0
            config.player_points_exact = 2.5
            config.total_goals_points_exact = 0.0
            config.btts_points_correct = 2.5
            config.first_team_to_score_points_correct = 2.5
            config.clean_sheet_points_correct = 2.5
            config.max_base_score = 25.0
            db.commit()
            print("Config updated successfully")
        else:
            print("No active config found")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    update_config()
