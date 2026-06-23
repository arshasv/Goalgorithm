# Schema Design

## Entity Relationship Summary

```
Teams ──────────────────────────────────┐
  │                                     │
  ├── Predictions (one per match)        │
  │     └── PlayerPredictions            │
  │                                     │
  ├── Scores (one per match)             │
  │                                     │
  ├── TechnicalEvaluation (one total)    │
  │                                     │
  ├── PresentationEvaluation (one total) │
  │                                     │
  └── LeaderboardEntry (one total)       │
                                          │
Matches ─────────────────────────────────┘
  │
  ├── Predictions (one per team)
  ├── ActualResult (one total)
  │     └── PlayerActuals
  └── Scores (one per team)
```

## Table Details

### Teams
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | FK → Users (Nullable) |
| name | String | Team display name |
| name_normalized | String | Normalized team name (unique) |
| code | String | Short unique identifier |
| team_leader_name | String | Registered team leader name |
| registered_at | Datetime | Registration timestamp |
| is_active | Boolean | Active status |
| is_csv_managed | Boolean | True if roster was uploaded via CSV |

### Matches
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| match_number | Integer | 1–32 |
| home_team_name | String | Home country |
| away_team_name | String | Away country |
| scheduled_at | Datetime | Kickoff time |
| freeze_deadline | Datetime | Submission cutoff |
| status | Enum | SCHEDULED, FROZEN, COMPLETED, RESULT_ENTERED, SCORED |

### Predictions
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| team_id | UUID | FK → Teams |
| match_id | UUID | FK → Matches |
| submitted_at | Datetime | Submission timestamp |
| status | Enum | PENDING_VALIDATION, VALIDATED, INVALID, LATE |
| predicted_winner | Enum | home, away, draw |
| Various scoring fields | Float/Int | All prediction dimensions |
| raw_payload | JSON | Original submission for audit |

### PlayerPredictions
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| prediction_id | UUID | FK → Predictions |
| player_name, team_side, position | String/Enum | Player identity |
| goal_scoring_probability, predicted_goals, assist_probability | Float/Int | Prediction data |

### ActualResults
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| match_id | UUID | FK → Matches (unique) |
| actual_winner | Enum | home, away, draw |
| actual_home_goals, actual_away_goals | Integer | Scoreline |
| Various result fields | Float/Int/Boolean | Result details |

### PlayerActuals
| Field | Type | Description |
|---|---|---|
| actual_result_id | UUID | FK → ActualResults |
| player_name, team_side, position | String/Enum | Player identity |
| actual_goals, actual_assists | Integer | Performance |
| kept_clean_sheet | Boolean/null | Clean sheet status |

### Scores
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| team_id | UUID | FK → Teams |
| match_id | UUID | FK → Matches |
| winner_points, scoreline_points, probability_points, player_points | Integer | Dimension scores |
| base_score | Float | Sum (max 25) |
| match_rank | Integer | 1–5 |
| grade | Enum | A, B, C |
| multiplier | Integer | 1, 2, 3 |
| earned_points | Float | base_score × multiplier |

### CumulativePhaseScores
| Field | Type | Description |
|---|---|---|
| team_id | UUID | FK → Teams (unique) |
| total_earned_points | Float | Sum across matches |
| phase1_score | Float | Normalized /60 |
| phase2_score | Float | Committee score /20 |
| phase3_raw_total, phase3_rank, phase3_multiplier, phase3_earned, phase3_score | Various | Presentation breakdown |

### TechnicalEvaluation
| Field | Type | Description |
|---|---|---|
| team_id | UUID | FK → Teams (unique) |
| code_quality_score, api_robustness_score, teamwork_score, ai_explanation_score | Integer | 0–5 each |
| total_score | Integer | Sum (0–20) |

### PresentationEvaluation
| Field | Type | Description |
|---|---|---|
| team_id | UUID | FK → Teams (unique) |
| ai_explanation_score, qa_handling_score, delivery_score | Integer | Sub-scores |
| raw_total | Integer | Sum (0–50) |
| grade | Enum(A,B,C) | Relative rank grade |
| multiplier | Integer | Grade multiplier (3,2,1) |
| weighted_score | Float | raw_total × multiplier (max 150) |
| judge_count | Integer | Number of judges |
| judge_scores | JSON | Per-judge score breakdown |
| presentation_criteria_config | JSON | Active criteria definition |
| max_marks | Integer | Sum of criteria max scores |

### Leaderboard
| Field | Type | Description |
|---|---|---|
| team_id | UUID | FK → Teams (unique) |
| rank | Integer | Final position |
| phase1_score, phase2_score, phase3_score | Float | Phase scores |
| grand_total | Float | Sum /100 |
| is_final | Boolean | Published state |

### Users
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| username | String | Unique username |
| email | String | Unique corporate email |
| password_hash | String | Hashed password |
| role | String | Role badge: `admin` (Organizer) or `team_leader` |
| created_at, updated_at | Datetime | Audit timestamps |

### TeamMembers
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| team_id | UUID | FK → Teams |
| name | String | Member name |
| employee_id | String | Member employee ID |
| created_at | Datetime | Audit timestamp |

### ScoringConfigs
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| name | String | Config display name |
| is_active | Boolean | Only one config is active |
| version | Integer | Revision tracking |
| winner_points_correct | Integer | Points config (along with all other points) |

### UploadWindowConfig
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| is_enabled | Boolean | Master toggle |
| start_time, end_time | Datetime | Active bounds (UTC) |

### ModelSubmissions
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| team_id | UUID | FK → Teams |
| file_name, file_type, file_path | String | Uploaded file details |
| file_size | Integer | File size in bytes |
| is_active | Boolean | True for latest active upload |
| uploaded_at | Datetime | Upload timestamp |
