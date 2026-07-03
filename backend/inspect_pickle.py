import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "app"))

from app.database.session import SessionLocal
from app.model_execution.models.model_upload import ModelUploadModel
from app.file_manager.services.storage_service import StorageService
import pickletools

def inspect_latest_upload():
    db = SessionLocal()
    upload = db.query(ModelUploadModel).order_by(ModelUploadModel.created_at.desc()).first()
    if not upload:
        print("No uploads found.")
        return
    
    print(f"Found upload: {upload.id} ({upload.original_filename})")
    
    storage = StorageService()
    temp_path = storage.download_with_retry(upload)
    
    print(f"Downloaded to {temp_path}. Inspecting pickle...")
    with open(temp_path, "rb") as f:
        pickle_data = f.read()
    
    # We just want to extract module names
    modules = set()
    for opcode, arg, pos in pickletools.genops(pickle_data):
        if opcode.name == "GLOBAL":
            module_name, class_name = arg.split(" ", 1)
            modules.add(module_name)
    
    print("Referenced modules:")
    for m in sorted(modules):
        print(f" - {m}")
        
    storage.cleanup(temp_path)

if __name__ == "__main__":
    inspect_latest_upload()
