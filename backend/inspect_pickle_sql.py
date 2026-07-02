import sys
import os
import pickle
import psycopg2

sys.path.append(os.path.join(os.path.dirname(__file__), "app"))

from app.file_manager.storage import LocalStorageBackend
from app.config import settings

def inspect_latest_upload():
    conn = psycopg2.connect(
        host="postgres",
        port=5432,
        dbname="fifa_scoring_db",
        user="fifa_user",
        password="change_me"
    )
    cur = conn.cursor()
    cur.execute("SELECT id, stored_file_path, original_filename FROM model_uploads ORDER BY created_at DESC LIMIT 1;")
    row = cur.fetchone()
    if not row:
        print("No uploads found.")
        return
    
    upload_id, stored_path, orig_name = row
    print(f"Found upload: {upload_id} ({orig_name})")
    
    local = LocalStorageBackend()
    data = local.get(stored_path)
    
    import tempfile
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pkl") as f:
        f.write(data)
        temp_path = f.name
        
    print(f"Downloaded to {temp_path}. Loading model...")
    import joblib
    try:
        model = joblib.load(temp_path)
    except Exception as e:
        print(f"Joblib failed: {e}")
        with open(temp_path, "rb") as f:
            model = pickle.load(f)
            
    print(f"Model type: {type(model)}")
    print(f"Model module: {model.__module__}")
    
    # Try to inspect predict method
    if hasattr(model, "predict"):
        import inspect
        try:
            source = inspect.getsource(model.predict)
            print("--- predict source ---")
            print(source)
            print("----------------------")
        except Exception as e:
            print(f"Could not get source for predict: {e}")
            
    os.remove(temp_path)

if __name__ == "__main__":
    inspect_latest_upload()
