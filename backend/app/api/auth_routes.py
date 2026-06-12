import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user

from app.auth.auth_service import (
    create_access_token,
    hash_password,
    verify_password,
)

from app.database.session import get_db

from app.utils.email_validator import validate_email_domain

from app.models.enums import UserRole
from app.models.team import TeamModel
from app.models.user import UserModel

from app.schemas.auth_schema import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    UserResponse,
    UserInfo,
)


logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post(
    "/register",
    status_code=201,
    response_model=RegisterResponse,
)
def register(
    body: RegisterRequest,
    db: Session = Depends(get_db),
):

    email_err = validate_email_domain(
        body.email
    )

    if email_err:
        raise HTTPException(
            status_code=422,
            detail=email_err,
        )


    if (
        db.query(UserModel)
        .filter(
            UserModel.username == body.username
        )
        .first()
    ):
        raise HTTPException(
            status_code=409,
            detail="Username already taken",
        )


    if (
        db.query(UserModel)
        .filter(
            UserModel.email == body.email
        )
        .first()
    ):
        raise HTTPException(
            status_code=409,
            detail="Email already registered",
        )


    user = UserModel(
        username=body.username,
        email=body.email,
        password_hash=hash_password(
            body.password
        ),
        role=UserRole.TEAM_LEADER,
    )


    db.add(user)
    db.flush()


    team_val = body.team_name.strip().upper()
    import re
    team_letter = re.sub(r'^TEAM[\s_]*', '', team_val)
    if team_letter not in ["A", "B", "C", "D", "E"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid team. Only Teams A, B, C, D, E are allowed."
        )

    target_team_name = f"Team {team_letter}"

    existing_team = db.query(TeamModel).filter(TeamModel.name == target_team_name).first()
    if existing_team:
        if existing_team.user_id is not None:
            raise HTTPException(
                status_code=409,
                detail=f"Team '{target_team_name}' already has a registered team leader."
            )
        existing_team.user_id = user.id
        existing_team.team_leader_name = body.team_leader_name
        team = existing_team
    else:
        team = TeamModel(
            name=target_team_name,
            code=team_letter,
            team_leader_name=body.team_leader_name,
            user_id=user.id,
        )
        db.add(team)

    db.commit()

    db.refresh(user)
    db.refresh(team)


    token = create_access_token(
        data={
            "sub": str(user.id),
            "role": user.role,
        }
    )


    return RegisterResponse(
        access_token=token,
        token_type="bearer",

        user=UserInfo(
            id=str(user.id),
            username=user.username,
            email=user.email,
            role=user.role,

            team_id=str(team.id),
            team_name=team.name,
        ),
    )



@router.post(
    "/login",
    response_model=LoginResponse,
)
def login(
    body: LoginRequest,
    db: Session = Depends(get_db),
):

    user = (
        db.query(UserModel)
        .filter(
            UserModel.email == body.email
        )
        .first()
    )


    if (
        not user
        or not verify_password(
            body.password,
            user.password_hash
        )
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )


    token = create_access_token(
        data={
            "sub": str(user.id),
            "role": user.role,
        }
    )


    team = (
        db.query(TeamModel)
        .filter(
            TeamModel.user_id == user.id
        )
        .first()
    )


    return LoginResponse(
        access_token=token,
        token_type="bearer",

        user=UserInfo(
            id=str(user.id),
            username=user.username,
            email=user.email,
            role=user.role,

            team_id=str(team.id)
            if team
            else None,

            team_name=team.name
            if team
            else None,
        ),
    )



@router.get(
    "/me",
    response_model=UserResponse,
)
def read_users_me(
    current_user: UserModel = Depends(
        get_current_user
    ),
):

    response = UserResponse(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        created_at=current_user.created_at.isoformat(),
    )


    if current_user.team:

        response.team_id = str(
            current_user.team.id
        )

        response.team_name = (
            current_user.team.name
        )


    return response



@router.get(
    "/profile",
    response_model=UserResponse,
)
def read_profile(
    current_user: UserModel = Depends(
        get_current_user
    ),
):

    return read_users_me(
        current_user=current_user
    )