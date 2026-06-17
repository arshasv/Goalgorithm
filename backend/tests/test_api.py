from pathlib import Path

from app.models.match import MatchModel
from app.models.team import TeamModel


FIXTURES = Path(__file__).parent / "fixtures"


def _load(name: str) -> dict:
    import json
    return json.loads((FIXTURES / name).read_text())


def _patch_payload(payload: dict, team_id: str | None = None, match_id: str | None = None) -> dict:
    result = payload.copy()
    if team_id:
        result["team_id"] = team_id
    if match_id:
        result["match_id"] = match_id
    return result


class TestAuthAPI:
    def test_register(self, client, db_session):
        resp = client.post("/api/v1/auth/register", json={
            "username": "newleader",
            "email": "newleader@gmail.com",
            "password": "password123",
            "team_name": "B",
            "team_leader_name": "John Doe",
        })
        assert resp.status_code == 201
        body = resp.json()
        assert "access_token" in body
        assert body["user"]["username"] == "newleader"
        assert body["user"]["role"] == "TEAM_LEADER"

    def test_register_duplicate_username(self, client, db_session, team_a, team_leader):
        resp = client.post("/api/v1/auth/register", json={
            "username": "teamleader",
            "email": "other@opentrends.com",
            "password": "password123",
            "team_name": "B",
            "team_leader_name": "Other",
        })
        assert resp.status_code == 409

    def test_register_team_already_taken(self, client, db_session, team_a, team_leader):
        resp = client.post("/api/v1/auth/register", json={
            "username": "newuser",
            "email": "newuser@gmail.com",
            "password": "password123",
            "team_name": "A",
            "team_leader_name": "Other",
        })
        assert resp.status_code == 409

    def test_register_invalid_email_domain(self, client, db_session):
        resp = client.post("/api/v1/auth/register", json={
            "username": "hacker",
            "email": "hacker@yahoo.com",
            "password": "password123",
            "team_name": "B",
            "team_leader_name": "Hacker",
        })
        assert resp.status_code == 422
        assert "not allowed" in resp.json()["detail"].lower()

    def test_register_allowed_domains(self, client, db_session):
        domains = ["gmail.com", "opentrends.com", "opentrends.net", "fifa-scoring.com"]
        teams = ["B", "C", "D", "E"]
        for i, domain in enumerate(domains):
            prefix = domain.split('.')[0]
            resp = client.post("/api/v1/auth/register", json={
                "username": f"user_{prefix}_{i}",
                "email": f"test@{domain}",
                "password": "password123",
                "team_name": teams[i],
                "team_leader_name": f"Leader {domain}",
            })
            assert resp.status_code == 201, f"Failed for {domain}: {resp.json()}"

    def test_register_blocked_domains(self, client, db_session):
        resp = client.post("/api/v1/auth/register", json={
            "username": "blocked_user",
            "email": "user@yahoo.com",
            "password": "password123",
            "team_name": "B",
            "team_leader_name": "Blocked",
        })
        assert resp.status_code == 422

    def test_add_member_invalid_email(self, client, db_session, team_a, team_leader_headers):
        resp = client.post("/api/v1/teams/my-team/members", json={
            "name": "Player One",
            "employee_id": "EMP001",
        }, headers=team_leader_headers)
        assert resp.status_code == 403

    def test_login(self, client, team_leader):
        resp = client.post("/api/v1/auth/login", json={
            "email": "leader@gmail.com",
            "password": "password123",
        })
        assert resp.status_code == 200
        body = resp.json()
        assert "access_token" in body
        assert body["user"]["username"] == "teamleader"

    def test_login_invalid(self, client):
        resp = client.post("/api/v1/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "wrong",
        })
        assert resp.status_code == 401

    def test_me(self, client, team_leader_headers):
        resp = client.get("/api/v1/auth/me", headers=team_leader_headers)
        assert resp.status_code == 200
        assert resp.json()["username"] == "teamleader"


class TestPredictionAPI:
    def test_valid_prediction_returns_accepted(self, client, team_a, team_leader_headers, sample_match):
        payload = _load("valid_prediction.json")
        payload = _patch_payload(payload, team_id=str(team_a.id), match_id=str(sample_match.id))
        resp = client.post("/api/v1/predictions", json=payload, headers=team_leader_headers)
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "accepted"

    def test_invalid_prediction_returns_422(self, client, team_leader_headers, sample_match):
        payload = _load("invalid_prediction.json")
        resp = client.post("/api/v1/predictions", json=payload, headers=team_leader_headers)
        assert resp.status_code == 422

    def test_prediction_needs_auth(self, client, sample_match):
        payload = _load("valid_prediction.json")
        resp = client.post("/api/v1/predictions", json=payload)
        assert resp.status_code in (401, 403)


class TestActualResultAPI:
    def test_valid_actual_result_returns_accepted(self, client, organizer_headers, sample_match):
        payload = _load("actual_result.json")
        payload = _patch_payload(payload, match_id=str(sample_match.id))
        resp = client.post("/api/v1/actual-results", json=payload, headers=organizer_headers)
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "accepted"

    def test_invalid_winner_returns_422(self, client, organizer_headers, sample_match):
        payload = _load("actual_result.json")
        payload["actual_winner"] = "invalid"
        resp = client.post("/api/v1/actual-results", json=payload, headers=organizer_headers)
        assert resp.status_code == 422

    def test_actual_result_needs_organizer(self, client, team_leader_headers, sample_match):
        payload = _load("actual_result.json")
        resp = client.post("/api/v1/actual-results", json=payload, headers=team_leader_headers)
        assert resp.status_code == 403


class TestMatchScoreAPI:
    def test_calculate_match_score_returns_breakdown(self, client, organizer_headers, team_a, sample_match):
        pred = _load("valid_prediction.json")
        actual = _load("actual_result.json")
        pred = _patch_payload(pred, team_id=str(team_a.id), match_id=str(sample_match.id))
        actual = _patch_payload(actual, match_id=str(sample_match.id))
        resp = client.post(
            "/api/v1/calculate-match-score",
            json={"prediction": pred, "actual_result": actual},
            headers=organizer_headers,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "base_score" in body
        assert "breakdown" in body

    def test_calculate_match_score_needs_organizer(self, client, team_leader_headers):
        resp = client.post(
            "/api/v1/calculate-match-score",
            json={"prediction": {}, "actual_result": {}},
            headers=team_leader_headers,
        )
        assert resp.status_code == 403


class TestTechnicalScoreAPI:
    def test_technical_score_returns_200(self, client, organizer_headers, team_a):
        evals = _load("technical_scores.json")
        payload = [e for e in evals if e["team_id"] == "Team A"][0]
        resp = client.post("/api/v1/technical-score", json=payload, headers=organizer_headers)
        assert resp.status_code == 200
        body = resp.json()
        assert "technical_score" in body

    def test_technical_score_needs_organizer(self, client, team_leader_headers):
        resp = client.post("/api/v1/technical-score", json={}, headers=team_leader_headers)
        assert resp.status_code == 403


class TestPresentationScoreAPI:
    def test_presentation_score_returns_200(self, client, organizer_headers, team_a):
        payload = _load("presentation_scores.json")
        resp = client.post("/api/v1/presentation-score", json=payload, headers=organizer_headers)
        assert resp.status_code == 200
        body = resp.json()
        assert isinstance(body, list)

    def test_presentation_score_needs_organizer(self, client, team_leader_headers):
        resp = client.post("/api/v1/presentation-score", json=[], headers=team_leader_headers)
        assert resp.status_code == 403


class TestLeaderboardAPI:
    def test_leaderboard_needs_organizer(self, client, team_leader_headers):
        resp = client.post("/api/v1/leaderboard/calculate", json=[], headers=team_leader_headers)
        assert resp.status_code == 403

    def test_leaderboard_returns_ranked(self, client, organizer_headers):
        payload = [
            {"team_id": "Team A", "phase1_score": 55, "technical_score": 18, "presentation_score": 17},
            {"team_id": "Team B", "phase1_score": 40, "technical_score": 15, "presentation_score": 14},
        ]
        resp = client.post("/api/v1/leaderboard/calculate", json=payload, headers=organizer_headers)
        assert resp.status_code == 200
        body = resp.json()
        assert len(body) == 2
        assert body[0]["team_id"] == "Team A"
        assert body[0]["rank"] == 1
        assert body[0]["final_score"] == 90

    def test_get_leaderboard_public(self, client, organizer_headers, db_session):
        payload = [
            {"team_id": "Team A", "phase1_score": 55, "technical_score": 18, "presentation_score": 17},
        ]
        client.post("/api/v1/leaderboard/calculate", json=payload, headers=organizer_headers)
        resp = client.get("/api/v1/leaderboard")
        assert resp.status_code == 200
        body = resp.json()
        assert len(body) >= 1


class TestTeamAPI:
    def test_get_my_team(self, client, team_leader_headers, team_a):
        resp = client.get("/api/v1/teams/my-team", headers=team_leader_headers)
        assert resp.status_code == 200
        body = resp.json()
        assert body["name"] == "Team A"

    def test_my_team_needs_auth(self, client):
        resp = client.get("/api/v1/teams/my-team")
        assert resp.status_code in (401, 403)

    def test_add_member(self, client, team_leader_headers):
        resp = client.post("/api/v1/teams/my-team/members", json={
            "name": "Player One",
            "employee_id": "EMP001",
        }, headers=team_leader_headers)
        assert resp.status_code == 403

    def test_list_teams_as_organizer(self, client, organizer_headers, team_a):
        resp = client.get("/api/v1/teams", headers=organizer_headers)
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_remove_member(self, client, team_leader_headers):
        del_resp = client.delete("/api/v1/teams/my-team/members/c3b0ac48-1111-2222-3333-444455556666", headers=team_leader_headers)
        assert del_resp.status_code == 403

    def test_organizer_manage_members(self, client, organizer_headers, team_a):
        # Organizer adds member
        add_resp = client.post(f"/api/v1/teams/{team_a.id}/members", json={
            "name": "Organizer Added",
            "employee_id": "ORG001"
        }, headers=organizer_headers)
        assert add_resp.status_code == 201
        member_id = add_resp.json()["id"]

        # Organizer updates member
        update_resp = client.put(f"/api/v1/teams/{team_a.id}/members/{member_id}", json={
            "name": "Organizer Updated",
            "employee_id": "ORG002"
        }, headers=organizer_headers)
        assert update_resp.status_code == 200

        # Organizer deletes member
        del_resp = client.delete(f"/api/v1/teams/{team_a.id}/members/{member_id}", headers=organizer_headers)
        assert del_resp.status_code == 200

    def test_csv_upload_teams(self, client, organizer_headers, db_session):
        # Test CSV upload with new and existing teams
        csv_data = (
            "team_code,team_name,team_leader\n"
            "A,Alpha Team,Alice\n"
            "B,Beta Team,Bob\n"
        )
        files = {"file": ("teams.csv", csv_data, "text/csv")}
        resp = client.post("/api/v1/teams/upload-csv", files=files, headers=organizer_headers)
        assert resp.status_code == 200
        body = resp.json()
        assert "Created 2 teams" in body["message"]
        assert "updated 0 teams" in body["message"]

        # Upload again — should update
        csv_data2 = (
            "team_code,team_name,team_leader\n"
            "A,Alpha Updated,Alice Smith\n"
            "C,Charlie Team,Charlie\n"
        )
        files2 = {"file": ("teams2.csv", csv_data2, "text/csv")}
        resp2 = client.post("/api/v1/teams/upload-csv", files=files2, headers=organizer_headers)
        assert resp2.status_code == 200
        body2 = resp2.json()
        assert "Created 1 teams" in body2["message"]
        assert "updated 1 teams" in body2["message"]

        # Verify Team A was updated
        teams_resp = client.get("/api/v1/teams", headers=organizer_headers)
        assert teams_resp.status_code == 200
        teams = teams_resp.json()
        team_a = next(t for t in teams if t["team_code"] == "A")
        assert team_a["team_name"] == "Alpha Updated"
        assert team_a["team_leader"] == "Alice Smith"

    def test_xlsx_upload_teams(self, client, organizer_headers):
        import openpyxl
        import io
        
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.append(["team_code", "team_name", "team_leader"])
        ws.append(["A", "Excel Team", "Excel Leader"])
        
        file_stream = io.BytesIO()
        wb.save(file_stream)
        file_stream.seek(0)
        
        files = {"file": ("teams.xlsx", file_stream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        resp = client.post("/api/v1/teams/upload-csv", files=files, headers=organizer_headers)
        assert resp.status_code == 200
        body = resp.json()
        assert "Created 1 teams" in body["message"]

    def test_upload_members_csv(self, client, organizer_headers):
        csv_data = "group,name,employee_id\nA,Alice,E001\nA,Bob,E002\n"
        files = {"file": ("members.csv", csv_data, "text/csv")}
        resp = client.post("/api/v1/teams/upload-members-csv", files=files, headers=organizer_headers)
        assert resp.status_code == 200
        body = resp.json()
        assert "Successfully imported members" in body["message"]

    def test_upload_teams_forbidden_for_team_leader(self, client, team_leader_headers):
        csv_data = "team_code,team_name,team_leader\nA,TL Team,TL Leader\n"
        files = {"file": ("teams.csv", csv_data, "text/csv")}
        resp = client.post("/api/v1/teams/upload-csv", files=files, headers=team_leader_headers)
        assert resp.status_code == 403
        resp_mem = client.post("/api/v1/teams/upload-members-csv", files=files, headers=team_leader_headers)
        assert resp_mem.status_code == 403


