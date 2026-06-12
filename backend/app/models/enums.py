import enum


class MatchStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    FROZEN = "FROZEN"
    COMPLETED = "COMPLETED"
    RESULT_ENTERED = "RESULT_ENTERED"
    SCORED = "SCORED"


class PredictionStatus(str, enum.Enum):
    PENDING_VALIDATION = "PENDING_VALIDATION"
    VALIDATED = "VALIDATED"
    INVALID = "INVALID"
    LATE = "LATE"


class Winner(str, enum.Enum):
    HOME = "home"
    AWAY = "away"
    DRAW = "draw"


class FirstGoalTeam(str, enum.Enum):
    HOME = "home"
    AWAY = "away"
    NONE = "none"


class Grade(str, enum.Enum):
    A = "A"
    B = "B"
    C = "C"


class UserRole(str, enum.Enum):
    TEAM_LEADER = "TEAM_LEADER"
    ORGANIZER = "ORGANIZER"
