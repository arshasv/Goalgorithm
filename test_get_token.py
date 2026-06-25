from app.services.auth_service import AuthService
from app.database.session import SessionLocal
from app.models.user import UserModel

db = SessionLocal()
user = db.query(UserModel).filter(UserModel.role == "ORGANIZER").first()
print(AuthService(db).create_access_token({"sub": str(user.id), "role": str(user.role.value)}))
