import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class TeamMemberCreate(BaseModel):
    name: str = Field(
        ...,
        min_length=1,
        max_length=255
    )

    employee_id: str | None = None



class TeamMemberResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True
    )

    id: uuid.UUID
    team_id: uuid.UUID

    name: str
    employee_id: str | None = None

    created_at: datetime



class TeamUpdate(BaseModel):

    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=255
    )

    team_leader_name: str | None = None

    is_active: bool | None = None



class TeamResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True
    )

    id: uuid.UUID

    team_id: str

    name: str

    # returning for old frontend compatibility
    code: str

    team_leader_name: str | None = None

    registered_at: datetime

    is_active: bool

    is_csv_managed: bool = False

    members: list[TeamMemberResponse] = []