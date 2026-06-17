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
            UserModel.email == body.email.lower()
        )
        .first()
    ):
        raise HTTPException(
            status_code=409,
            detail="Email already registered",
        )


    user = UserModel(
        username=body.username,
        email=body.email.lower(),
        password_hash=hash_password(
            body.password
        ),
        role=UserRole.TEAM_LEADER,
        is_active=True,
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

    existing_team = db.query(TeamModel).filter(TeamModel.team_id == team_letter).first()
    if existing_team:
        if existing_team.user_id is not None:
            raise HTTPException(
                status_code=409,
                detail=f"Team '{team_letter}' already has a registered team leader."
            )
        existing_team.user_id = user.id
        existing_team.team_leader_name = body.team_leader_name
        team = existing_team
    else:
        team = TeamModel(
            team_id=team_letter,
            name=f"Team {team_letter}",
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

    print("LOGIN DEBUG email:", body.email)
    user = (
        db.query(UserModel)
        .filter(
            UserModel.email == body.email.lower()
        )
        .first()
    )

    print("LOGIN DEBUG user found:", user is not None)
    if user:
        print("LOGIN DEBUG user.id:", user.id)
        print("LOGIN DEBUG user.email:", user.email)
        print("LOGIN DEBUG user.role:", user.role)
        # user doesn't have is_active, but let's check it if it does
        print("LOGIN DEBUG stored hash exists:", bool(user.password_hash))
        
        password_verified = verify_password(body.password, user.password_hash)
        print("LOGIN DEBUG password ok:", password_verified)
    else:
        password_verified = False

    if (
        not user
        or not password_verified
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