from pydantic import BaseModel, Field

class PlayerPrediction(BaseModel):
    player_name: str = Field(..., min_length=1)

try:
    PlayerPrediction(player_name=None)
except Exception as e:
    print(repr(e))

try:
    PlayerPrediction(**{})
except Exception as e:
    print(repr(e))
