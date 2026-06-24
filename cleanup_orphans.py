import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import models
import app.database.session as session_module
from app.models.prediction import PredictionModel
from app.models.score import ScoreModel
from app.models.match import MatchModel

def main():
    engine = session_module.engine
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Find all match IDs that exist
        match_ids = [str(m[0]) for m in db.query(MatchModel.id).all()]
        
        # Find orphan predictions
        orphan_preds = db.query(PredictionModel).filter(
            ~PredictionModel.match_id.in_(match_ids)
        ).all()
        
        orphan_scores = db.query(ScoreModel).filter(
            ~ScoreModel.match_id.in_(match_ids)
        ).all()
        
        print(f"Found {len(orphan_preds)} orphan predictions.")
        print(f"Found {len(orphan_scores)} orphan scores.")
        
        # Delete them
        if orphan_scores:
            db.query(ScoreModel).filter(
                ~ScoreModel.match_id.in_(match_ids)
            ).delete(synchronize_session=False)
            print(f"Deleted {len(orphan_scores)} orphan scores.")
            
        if orphan_preds:
            db.query(PredictionModel).filter(
                ~PredictionModel.match_id.in_(match_ids)
            ).delete(synchronize_session=False)
            print(f"Deleted {len(orphan_preds)} orphan predictions.")
            
        db.commit()
        print("Cleanup successful.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
