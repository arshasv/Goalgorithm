"""Seed the database with initial data and create default organizer account."""
import argparse
import sys
from datetime import datetime, timezone

from app.auth.auth_service import hash_password
from app.database.base import Base
from app.database.connection import engine
from app.database.session import SessionLocal
from app.models.enums import UserRole, MatchStatus
from app.models.match import MatchModel
from app.models.team import TeamModel
from app.models.user import UserModel
from app.utils.email_validator import validate_email_domain
from app.utils.team_name_utils import normalize_team_name


def seed(force: bool = False):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing_org = db.query(UserModel).filter(UserModel.role == UserRole.ORGANIZER).first()
        if existing_org and not force:
            print("Organizer already exists. Use --force to reseed.")
        else:
            if existing_org:
                db.delete(existing_org)
                db.flush()

            org_email = "admin@fifa-scoring.com"
            email_err = validate_email_domain(org_email)
            if email_err:
                print(f"Invalid organizer email domain: {org_email}", file=sys.stderr)
                sys.exit(1)

            org = UserModel(
                username="admin",
                email=org_email,
                password_hash=hash_password("admin123"),
                role=UserRole.ORGANIZER,
            )
            db.add(org)
            db.flush()
            print(f"Created organizer user: admin@fifa-scoring.com / admin123")

        teams_data = [
            {"name": "Team A", "code": "A"},
            {"name": "Team B", "code": "B"},
            {"name": "Team C", "code": "C"},
            {"name": "Team D", "code": "D"},
            {"name": "Team E", "code": "E"},
        ]
        for t in teams_data:
            existing = db.query(TeamModel).filter(TeamModel.code == t["code"]).first()
            if not existing:
                team = TeamModel(name=t["name"], code=t["code"])
                db.add(team)
                print(f"Created team: {t['name']} ({t['code']})")
            elif force:
                existing.name = t["name"]
                existing.name_normalized = normalize_team_name(t["name"])
                print(f"Updated team: {t['name']} ({t['code']})")

        existing_matches = db.query(MatchModel).count()
        if existing_matches == 0 or force:
            if force and existing_matches > 0:
                db.query(MatchModel).delete()
                db.flush()

            matches = [
                MatchModel(match_number=1, home_team_name="Brazil", away_team_name="Argentina",
                           scheduled_at=datetime(2026, 6, 15, 20, 0, 0, tzinfo=timezone.utc),
                           freeze_deadline=datetime(2026, 6, 14, 20, 0, 0, tzinfo=timezone.utc),
                           status=MatchStatus.SCHEDULED),
                MatchModel(match_number=2, home_team_name="Germany", away_team_name="France",
                           scheduled_at=datetime(2026, 6, 16, 18, 0, 0, tzinfo=timezone.utc),
                           freeze_deadline=datetime(2026, 6, 15, 18, 0, 0, tzinfo=timezone.utc),
                           status=MatchStatus.SCHEDULED),
                MatchModel(match_number=3, home_team_name="England", away_team_name="Portugal",
                           scheduled_at=datetime(2026, 6, 17, 21, 0, 0, tzinfo=timezone.utc),
                           freeze_deadline=datetime(2026, 6, 16, 21, 0, 0, tzinfo=timezone.utc),
                           status=MatchStatus.SCHEDULED),
            ]
            for m in matches:
                db.add(m)
            print(f"Created {len(matches)} matches")

        db.commit()
        print("\nSeed complete!")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}", file=sys.stderr)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="Force reseed")
    args = parser.parse_args()
    seed(force=args.force)
