import os
import sys

# Add backend to path so we can import app
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from app.database.connection import engine
from app.database.base import Base
from app.database.session import SessionLocal
import app.models  # Registers all models

def reset_db():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    
    print("Tables recreated successfully.")
    
    # Insert default organizer
    from app.models.user import UserModel
    from app.models.enums import UserRole
    from datetime import datetime, timezone
    
    db = SessionLocal()
    try:
        admin_user = UserModel(
            id="3e71ba6e-609c-4b7a-8c6c-a662eda07349",
            username="admin",
            email="admin@fifa-scoring.com",
            password_hash="$2b$12$uj59QvCA5KoTTrGOeqSqbO/NBcLL7LgUhvULE7LgPlEZ4y1Ddw9s.",
            role=UserRole.ORGANIZER,
            is_active=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(admin_user)
        
        # Initialize default configurations if required by routes
        from app.models.scoring_config import ScoringConfigModel
        from app.models.leaderboard_visibility import LeaderboardVisibilityModel
        from app.models.upload_window import UploadWindowModel
        import uuid
        
        # Default config
        config = ScoringConfigModel(
            id=uuid.UUID("00000000-0000-0000-0000-000000000000"),
            name="Default Config",
            version=1,
            is_active=True
        )
        db.add(config)
        
        # Default upload window
        window = UploadWindowModel(
            id=uuid.UUID("11111111-1111-1111-1111-111111111111"),
            is_enabled=False
        )
        db.add(window)
        
        # Default leaderboard visibility
        vis = LeaderboardVisibilityModel(
            id=uuid.UUID("22222222-2222-2222-2222-222222222222"),
            show_all_teams_leaderboard=True,
            show_phase_scores=True,
            show_rank=True,
            show_team_name=True,
            show_final_score=True,
            show_phase_1_score=True,
            show_technical_score=True,
            show_presentation_score=True
        )
        db.add(vis)
        
        db.commit()
        print("Default admin user and configs seeded successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_db()
