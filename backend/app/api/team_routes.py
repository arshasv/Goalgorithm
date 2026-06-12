from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.api.deps import (
    get_current_team,
    get_current_user,
)

from app.database.session import get_db

from app.models.enums import UserRole
from app.models.team import TeamModel
from app.models.team_member import TeamMemberModel
from app.models.user import UserModel

from app.schemas.team_schema import (
    TeamMemberCreate,
    TeamUpdate,
    TeamResponse,
)


router = APIRouter(
    prefix="/teams",
    tags=["teams"]
)


@router.get("/my-team")
def get_my_team(
    team: TeamModel = Depends(get_current_team),
    db: Session = Depends(get_db),
):

    members = (
        db.query(TeamMemberModel)
        .filter(
            TeamMemberModel.team_id == team.id
        )
        .all()
    )


    return {
        "id": str(team.id),
        "name": team.name,
        "code": team.name,
        "team_leader_name": team.team_leader_name,
        "registered_at": team.registered_at.isoformat(),
        "is_active": team.is_active,
        "is_csv_managed": team.is_csv_managed,
        "members": members,
    }



@router.put("/my-team")
def update_my_team(
    body: TeamUpdate,
    team: TeamModel = Depends(get_current_team),
    db: Session = Depends(get_db),
):

    if body.name:

        team.name = body.name

        # code follows name
        team.code = body.name


    if body.team_leader_name:

        team.team_leader_name = body.team_leader_name


    if body.is_active is not None:

        team.is_active = body.is_active


    db.commit()
    db.refresh(team)


    return {
        "message": "Team updated",
        "team_id": str(team.id),
    }



@router.post("/my-team/members", status_code=201)
def add_member(
    body: TeamMemberCreate,
    team: TeamModel = Depends(get_current_team),
    db: Session = Depends(get_db),
):

    if team.is_csv_managed:
        raise HTTPException(
            status_code=400,
            detail="Manual member addition is locked for this team as its members are managed via CSV."
        )

    member = TeamMemberModel(
        team_id=team.id,
        name=body.name,
        employee_id=body.employee_id,
    )

    db.add(member)
    db.commit()
    db.refresh(member)

    return member



@router.get("", response_model=list[TeamResponse])
def list_teams(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    if current_user.role == UserRole.ORGANIZER:
        return db.query(TeamModel).all()


    return (
        db.query(TeamModel)
        .filter(
            TeamModel.user_id == current_user.id
        )
        .all()
    )



@router.put("/{team_id}")
def update_team(
    team_id: str,
    body: TeamUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    team = (
        db.query(TeamModel)
        .filter(
            TeamModel.id == team_id
        )
        .first()
    )


    if not team:
        raise HTTPException(
            status_code=404,
            detail="Team not found"
        )


    if body.name:
        team.name = body.name
        team.code = body.name


    if body.team_leader_name:
        team.team_leader_name = body.team_leader_name


    if body.is_active is not None:
        team.is_active = body.is_active


    db.commit()


    return {
        "message": "Team updated",
        "team_id": team_id,
    }


@router.delete("/my-team/members/{member_id}")
def remove_member(
    member_id: str,
    team: TeamModel = Depends(get_current_team),
    db: Session = Depends(get_db),
):
    if team.is_csv_managed:
        raise HTTPException(
            status_code=400,
            detail="Manual member removal is locked for this team as its members are managed via CSV."
        )

    import uuid
    try:
        member_uuid = uuid.UUID(member_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid member ID format")

    member = (
        db.query(TeamMemberModel)
        .filter(
            TeamMemberModel.team_id == team.id,
            TeamMemberModel.id == member_uuid
        )
        .first()
    )
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    db.delete(member)
    db.commit()

    return {"message": "Member removed"}


GROUP_TO_TEAM = {
    'A': 'Team A',
    'B': 'Team B',
    'C': 'Team C',
    'D': 'Team D',
    'E': 'Team E',
}

def _map_group_to_team(group_value: str) -> str | None:
    if not group_value:
        return None
    group_letter = str(group_value).strip().upper()
    return GROUP_TO_TEAM.get(group_letter)


@router.post("/upload-members-csv")
def upload_members_csv(
    file: UploadFile = File(...),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(status_code=403, detail="Only organizers can upload files.")

    import csv
    import io

    filename = file.filename.lower()
    data_rows = []
    headers = []

    if filename.endswith(".csv"):
        try:
            content = file.file.read().decode("utf-8")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid file encoding: {str(e)}")

        reader = csv.DictReader(io.StringIO(content))
        if not reader.fieldnames:
            raise HTTPException(status_code=400, detail="CSV is empty or invalid.")

        headers = [h.strip().lower().replace(" ", "_") for h in reader.fieldnames]
        reader.fieldnames = headers
        for row in reader:
            data_rows.append({k: (v or "").strip() for k, v in row.items()})

    elif filename.endswith(".xlsx"):
        import openpyxl
        try:
            file_bytes = file.file.read()
            wb = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)
            sheet = wb.active
            rows = list(sheet.iter_rows(values_only=True))
            if not rows:
                raise HTTPException(status_code=400, detail="Excel file is empty.")
            
            header_row_idx = 0
            while header_row_idx < len(rows) and all(v is None for v in rows[header_row_idx]):
                header_row_idx += 1
            if header_row_idx >= len(rows):
                raise HTTPException(status_code=400, detail="Excel file is empty.")
            
            headers = [str(h).strip().lower().replace(" ", "_") if h is not None else "" for h in rows[header_row_idx]]
            
            for r in rows[header_row_idx + 1:]:
                if all(v is None or str(v).strip() == "" for v in r):
                    continue
                row_dict = {}
                for col_idx, h in enumerate(headers):
                    if h:
                        val = r[col_idx]
                        row_dict[h] = str(val).strip() if val is not None else ""
                data_rows.append(row_dict)
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=400, detail=f"Failed to parse XLSX file: {str(e)}")

    elif filename.endswith(".xls"):
        import xlrd
        try:
            file_bytes = file.file.read()
            wb = xlrd.open_workbook(file_contents=file_bytes)
            sheet = wb.sheet_by_index(0)
            if sheet.nrows == 0:
                raise HTTPException(status_code=400, detail="Excel file is empty.")
            
            header_row_idx = 0
            while header_row_idx < sheet.nrows:
                row_vals = [sheet.cell_value(header_row_idx, col) for col in range(sheet.ncols)]
                if not all(v == "" or v is None for v in row_vals):
                    break
                header_row_idx += 1
            if header_row_idx >= sheet.nrows:
                raise HTTPException(status_code=400, detail="Excel file is empty.")
            
            headers = [str(sheet.cell_value(header_row_idx, col)).strip().lower().replace(" ", "_") for col in range(sheet.ncols)]
            
            for row_idx in range(header_row_idx + 1, sheet.nrows):
                row_vals = [sheet.cell_value(row_idx, col) for col in range(sheet.ncols)]
                if all(v == "" or v is None for v in row_vals):
                    continue
                row_dict = {}
                for col_idx, h in enumerate(headers):
                    if h:
                        val = row_vals[col_idx]
                        if isinstance(val, float) and val.is_integer():
                            val = int(val)
                        row_dict[h] = str(val).strip() if val is not None else ""
                data_rows.append(row_dict)
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=400, detail=f"Failed to parse XLS file: {str(e)}")
    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload a .csv, .xls, or .xlsx file."
        )

    group_col = next((h for h in headers if h == "group"), None)
    name_col = next((h for h in headers if h == "name" or "member" in h), None)

    if not group_col or not name_col:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file must contain at least Group and Name columns."
        )

    db_teams_to_update = {}
    new_members = []

    for row in data_rows:
        group_value = (row.get(group_col) or "").strip()
        member_name = (row.get(name_col) or "").strip()
        if not group_value or not member_name:
            continue

        team_name = _map_group_to_team(group_value)
        if not team_name:
            continue

        if team_name not in db_teams_to_update:
            team = db.query(TeamModel).filter(TeamModel.name == team_name).first()
            if team:
                if not team.is_csv_managed:
                    existing_count = db.query(TeamMemberModel).filter(TeamMemberModel.team_id == team.id).count()
                    if existing_count > 0:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Team '{team_name}' already contains manually added members. A team can only use CSV-managed or manual members, not both."
                        )
                team.is_csv_managed = True
            else:
                team = TeamModel(
                    name=team_name,
                    code=team_name,
                    is_csv_managed=True
                )
                db.add(team)
                db.flush()
            db_teams_to_update[team_name] = team

        team = db_teams_to_update[team_name]

        employee_id = (row.get("employeeid") or row.get("employee_id") or "").strip()

        member = TeamMemberModel(
            team_id=team.id,
            name=member_name,
            employee_id=employee_id if employee_id else None
        )
        new_members.append(member)

    for team in db_teams_to_update.values():
        db.query(TeamMemberModel).filter(TeamMemberModel.team_id == team.id).delete()

    db.add_all(new_members)
    db.commit()

    return {
        "message": f"Successfully imported members CSV/Excel file. Updated {len(db_teams_to_update)} teams with {len(new_members)} members."
    }