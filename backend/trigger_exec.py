import sys
import os

sys.path.append(os.path.dirname(__file__))

from app.database.session import SessionLocal
from app.model_execution.models.model_execution import ModelExecutionModel
from app.model_execution.services.model_executor import ModelExecutor

def run():
    db = SessionLocal()
    latest = db.query(ModelExecutionModel).order_by(ModelExecutionModel.id.desc()).first()
    if not latest:
        print("No execution records found.")
        return
    print(f"Triggering execution for {latest.id}")
    executor = ModelExecutor(latest.id)
    executor.execute_in_background()
    print("Done")

if __name__ == "__main__":
    run()
