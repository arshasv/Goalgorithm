"""Match management routes — organizer CRUD + CSV/Excel upload."""
from __future__ import annotations

import csv
import io
import uuid
from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.api.deps import get_current_organizer, get_current_user
from app.database.session import get_db
from app.models.enums import MatchStatus, UserRole
from app.models.match import MatchModel
from app.models.user import UserModel
from app.schemas.match_schema import MatchCreate, MatchUpdate, MatchResponse

router = APIRouter(prefix="/matches", tags=["matches"])


def _serialize(m: MatchModel) -> dict:
    ext_sync = m.external_sync_status
    if hasattr(ext_sync, "value"):
        ext_sync = ext_sync.value
    return {
        "id": str(m.id),
        "match_number": m.match_number,
        "home_team_name": m.home_team_name,
        "away_team_name": m.away_team_name,
        "scheduled_at": m.scheduled_at.isoformat(),
        "freeze_deadline": m.freeze_deadline.isoformat(),
        "round": m.round,
        "status": m.status.value if hasattr(m.status, "value") else str(m.status),
        "created_at": m.created_at.isoformat(),
        "external_api_id": m.external_api_id,
        "competition_name": m.competition_name,
        "external_sync_status": ext_sync,
    }


# ── List all matches (any authenticated user) ──────────────────────────────

@router.get("")
def list_matches(
    db: Session = Depends(get_db),
    _user: UserModel = Depends(get_current_user),
):
    matches = db.query(MatchModel).order_by(MatchModel.match_number).all()
    return [_serialize(m) for m in matches]


# ── Create a single match (organizer only) ─────────────────────────────────

@router.post("", status_code=201)
def create_match(
    payload: MatchCreate,
    db: Session = Depends(get_db),
    _organizer: UserModel = Depends(get_current_organizer),
):
    # auto-compute freeze_deadline if not supplied (1 hour before kickoff)
    freeze = payload.freeze_deadline or (payload.scheduled_at - timedelta(hours=1))

    match = MatchModel(
        match_number=payload.match_number,
        home_team_name=payload.home_team_name,
        away_team_name=payload.away_team_name,
        scheduled_at=payload.scheduled_at,
        freeze_deadline=freeze,
        round=payload.round,
        status=MatchStatus.SCHEDULED,
    )
    db.add(match)
    db.commit()
    db.refresh(match)
    return _serialize(match)


# ── Update a match (organizer only) ───────────────────────────────────────

@router.put("/{match_id}")
def update_match(
    match_id: uuid.UUID,
    payload: MatchUpdate,
    db: Session = Depends(get_db),
    _organizer: UserModel = Depends(get_current_organizer),
):
    match = db.query(MatchModel).filter(MatchModel.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if payload.home_team_name is not None:
        match.home_team_name = payload.home_team_name.strip()
    if payload.away_team_name is not None:
        match.away_team_name = payload.away_team_name.strip()
    if payload.scheduled_at is not None:
        match.scheduled_at = payload.scheduled_at
    if payload.freeze_deadline is not None:
        match.freeze_deadline = payload.freeze_deadline
    if payload.round is not None:
        match.round = payload.round

    db.commit()
    db.refresh(match)
    return _serialize(match)


# ── Delete a match (organizer only) ───────────────────────────────────────

@router.delete("/{match_id}", status_code=204)
def delete_match(
    match_id: uuid.UUID,
    db: Session = Depends(get_db),
    _organizer: UserModel = Depends(get_current_organizer),
):
    match = db.query(MatchModel).filter(MatchModel.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    db.delete(match)
    db.commit()


# ── CSV upload (organizer only) ────────────────────────────────────────────
# Expected columns: match_number, home_team, away_team, kickoff_date, round
# Example row:  1,Argentina,Brazil,2026-06-17T18:00:00,Group Stage

@router.post("/upload-csv", status_code=201)
def upload_match_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _organizer: UserModel = Depends(get_current_organizer),
):
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in ("csv",):
        raise HTTPException(status_code=400, detail="Only .csv files are supported for upload")

    content = file.file.read().decode("utf-8-sig")  # strip BOM if present
    reader = csv.DictReader(io.StringIO(content))

    # normalise header names
    REQUIRED = {"match_number", "home_team", "away_team", "kickoff_date"}
    if reader.fieldnames:
        normalised = [f.strip().lower() for f in reader.fieldnames]
    else:
        raise HTTPException(status_code=400, detail="CSV has no headers")

    missing = REQUIRED - set(normalised)
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"CSV missing required columns: {', '.join(sorted(missing))}",
        )

    created: List[dict] = []
    errors: List[str] = []

    for i, raw_row in enumerate(reader, start=2):
        row = {k.strip().lower(): v.strip() for k, v in raw_row.items()}
        try:
            match_number = int(row["match_number"])
            home = row["home_team"]
            away = row["away_team"]
            kickoff_str = row["kickoff_date"]
            round_val = row.get("round", "").strip() or None

            if not home or not away:
                errors.append(f"Row {i}: home/away team name is empty")
                continue

            # parse kickoff — try ISO first, then date-only
            kickoff: datetime
            for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M", "%Y-%m-%d"):
                try:
                    kickoff = datetime.strptime(kickoff_str, fmt).replace(tzinfo=timezone.utc)
                    break
                except ValueError:
                    continue
            else:
                errors.append(f"Row {i}: cannot parse kickoff_date '{kickoff_str}'")
                continue

            freeze = kickoff - timedelta(hours=1)
            match = MatchModel(
                match_number=match_number,
                home_team_name=home,
                away_team_name=away,
                scheduled_at=kickoff,
                freeze_deadline=freeze,
                round=round_val,
                status=MatchStatus.SCHEDULED,
            )
            db.add(match)
            db.flush()
            created.append(_serialize(match))

        except Exception as exc:
            errors.append(f"Row {i}: {exc}")

    db.commit()
    return {
        "created": len(created),
        "errors": errors,
        "matches": created,
    }
