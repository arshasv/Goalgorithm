# FIFA Challenge Scoring System

Organizer-side backend for evaluating AI prediction teams in the FIFA AI Match Prediction Challenge.

> **Important:** This system does NOT build or train AI prediction models. It is the evaluation infrastructure that sits alongside the challenge and objectively measures how well each participating team's AI model performed.

---

## Processing Flow

```
Team Prediction JSON
        ↓
    Validation (Pydantic schemas)
        ↓
    Base Score  (/25)
        ↓
    Ranking + Multiplier (A/B/C grades)
        ↓
    Phase Scores  (AI Accuracy /60, Technical /20, Presentation /20)
        ↓
    Final Leaderboard  (/100)
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Python 3.12+, FastAPI |
| **Validation** | Pydantic v2 |
| **API Server** | Uvicorn |
| **Testing** | pytest, httpx (TestClient) |
| **Database** | PostgreSQL 15+ (planned), SQLAlchemy 2.0 async (planned) |

---

## What This System Does

This system receives prediction outputs submitted by participant teams, compares them against actual match results, computes scores, and generates a final leaderboard — all in an automated, rule-based, and reproducible manner.

### Core Responsibilities

| Responsibility | Description |
|---|---|
| **Receive Predictions** | Ingest structured JSON prediction files submitted by each team before match kickoff |
| **Validate Inputs** | Validate prediction JSON against a strict contract to ensure format compliance |
| **Ingest Actual Results** | Accept actual match result JSON after a match concludes |
| **Calculate Accuracy** | Compute each team's Base Accuracy Score for every match |
| **Apply Multipliers** | Rank teams per match and apply relative grade multipliers (A/B/C) |
| **Normalize Scores** | Normalize cumulative AI accuracy scores to a 60-mark scale |
| **Store Technical Scores** | Accept Phase 2 scores entered by the architecture committee |
| **Store Presentation Scores** | Accept Phase 3 peer-graded presentation scores and apply multipliers |
| **Generate Leaderboard** | Compute and publish the final master leaderboard across all three phases |

---

## The Three-Phase Evaluation Model

The final score for each team is out of **100 marks**, broken down as follows:

```
Phase 1: AI Prediction Accuracy          → 60 marks  (Formula-driven, automated)
Phase 2: Technical Implementation        → 20 marks  (Committee scored)
Phase 3: Cross-Team Peer Presentation    → 20 marks  (Peer graded + multiplier)
─────────────────────────────────────────────────────
Total                                    → 100 marks
```

---

## Input & Output Summary

### Inputs This System Accepts

1. **Team Prediction JSON** — Submitted by each team before every match (match winner, scoreline, probabilities, player predictions)
2. **Actual Match Result JSON** — Entered by organizers after each match concludes
3. **Technical Evaluation JSON** — Scores entered by the committee for Phase 2
4. **Presentation Evaluation JSON** — Raw peer scores for Phase 3

### Output This System Produces

- **Per-Match Scores** for each team
- **Cumulative Phase 1 Scores** (normalized to 60 marks)
- **Phase 2 Scores** (up to 20 marks)
- **Phase 3 Scores** (up to 20 marks with multiplier)
- **Final Master Leaderboard** (Grand Total out of 100)

---

## Who Uses This System

| Role | Usage |
|---|---|
| **Challenge Organizers** | Submit actual match results, trigger scoring, manage teams |
| **Architecture Committee** | Enter Phase 2 technical evaluation scores |
| **Peer Review Panel** | Submit Phase 3 presentation raw scores |
| **Participants (Read-only)** | View their scores and leaderboard position |

---

## Folder Structure

```
fifa-scoring-system/
 │
 ├── README.md                          ← You are here
 │
 ├── docs/
 │   ├── SCORING_REQUIREMENTS.md        ← What the system must evaluate
 │   ├── SYSTEM_WORKFLOW.md             ← End-to-end scoring pipeline
 │   ├── INPUT_OUTPUT_CONTRACTS.md      ← JSON structures for all I/O
 │   ├── SCORING_RULES.md               ← Formulas, multipliers, normalization
 │   ├── API_PLANNING.md                ← Planned future API endpoints
 │   ├── DATABASE_DESIGN.md             ← Planned data entities and relationships
 │   ├── FEATURES.md                    ← Functional feature descriptions
 │   ├── TECHNICAL_DOCUMENTATION.md     ← Technical specifications & constraints
 │   └── TEST_PLAN.md                   ← Testing strategy and test cases
 │
 └── backend/
     ├── BACKEND_ARCHITECTURE.md        ← Backend layers and design
     ├── requirements.txt               ← Python dependencies
     ├── app/
     │   ├── __init__.py
     │   ├── main.py                    ← FastAPI entry point
     │   ├── api/                       ← HTTP request/response layer
     │   │   ├── prediction_routes.py
     │   │   ├── result_routes.py
     │   │   ├── scoring_routes.py
     │   │   └── leaderboard_routes.py
     │   ├── schemas/                   ← Pydantic validation models
     │   │   ├── prediction_schema.py
     │   │   ├── actual_result_schema.py
     │   │   ├── technical_evaluation_schema.py
     │   │   └── presentation_schema.py
     │   ├── services/                  ← Business logic orchestration
     │   │   └── leaderboard_service.py
     │   ├── scoring_engine/            ← Pure mathematical calculations
     │   │   ├── base_score/            ← Winner, scoreline, probability, player
     │   │   ├── multiplier/            ← Ranking engine & grade calculator
     │   │   ├── normalization/         ← Phase 1 normalizer
     │   │   ├── technical_evaluation/  ← Phase 2 scoring
     │   │   └── presentation_evaluation/ ← Phase 3 scoring
     │   ├── models/                    ← SQLAlchemy ORM models (planned)
     │   ├── database/                  ← Database access layer (planned)
     │   └── utils/                     ← Reusable helpers
     └── tests/
         ├── fixtures/                  ← JSON test data files
         ├── test_api.py
         ├── test_schemas.py
         ├── test_base_score.py
         ├── test_multiplier.py
         ├── test_normalization.py
         ├── test_presentation_score.py
         ├── test_technical_score.py
         ├── test_leaderboard.py
         ├── test_full_competition_flow.py
         └── README.md
```

---

## Development Status

The core scoring engine, API routes, and test suite are implemented and passing. Database and authentication layers are planned for future phases.

---

## Key Design Principles

- **Automated Scoring** — Phase 1 scoring is fully formula-driven with no manual intervention
- **Immutable Predictions** — Once a match freeze deadline passes, no prediction updates are accepted
- **Reproducibility** — Every score computation must be traceable and re-runnable
- **Separation of Concerns** — Evaluation logic is entirely decoupled from participant model code
- **Strict Input Contracts** — Any prediction JSON that violates the schema results in a score of 0 for that match

---

## Setup

### Prerequisites

- Python 3.12+
- pip

### Install Dependencies

```bash
cd fifa-scoring-system/backend
pip install -r requirements.txt
```

### Run Tests

```bash
cd fifa-scoring-system/backend
python -m pytest
```

### Start API Server

```bash
cd fifa-scoring-system/backend
uvicorn app.main:app --reload
```

The API is available at `http://127.0.0.1:8000/api/v1/` with interactive docs at `http://127.0.0.1:8000/docs`.

---

## Related Documentation

- [Scoring Requirements](docs/SCORING_REQUIREMENTS.md)
- [System Workflow](docs/SYSTEM_WORKFLOW.md)
- [Input/Output Contracts](docs/INPUT_OUTPUT_CONTRACTS.md)
- [Scoring Rules](docs/SCORING_RULES.md)
- [API Planning](docs/API_PLANNING.md)
- [Database Design](docs/DATABASE_DESIGN.md)
- [Features](docs/FEATURES.md)
- [Technical Documentation](docs/TECHNICAL_DOCUMENTATION.md)
- [Test Plan](docs/TEST_PLAN.md)
- [Backend Architecture](backend/BACKEND_ARCHITECTURE.md)
