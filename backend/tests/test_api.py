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
        assert resp.status_code == 201

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
        assert resp.status_code == 201
        assert resp.json()["name"] == "Player One"

    def test_list_teams_as_organizer(self, client, organizer_headers, team_a):
        resp = client.get("/api/v1/teams", headers=organizer_headers)
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_remove_member(self, client, team_leader_headers):
        # first add a member
        resp = client.post("/api/v1/teams/my-team/members", json={
            "name": "To Be Removed",
            "employee_id": "TBR001",
        }, headers=team_leader_headers)
        assert resp.status_code == 201
        member_id = resp.json()["id"]

        # delete the member
        del_resp = client.delete(f"/api/v1/teams/my-team/members/{member_id}", headers=team_leader_headers)
        assert del_resp.status_code == 200
        assert del_resp.json()["message"] == "Member removed"

    def test_csv_upload_and_locks(self, client, organizer_headers, team_leader_headers, team_a):
        # 1. Test CSV upload with new and existing teams
        csv_data = (
            "SL No,EmployeeID,Name,Seniority,Gender,Football Knowledge,Group\n"
            "1,EMP001,CSV Player 1,Senior,M,Football,A\n"
            "2,EMP002,CSV Player 2,Senior,M,Football,B\n"
        )
        files = {"file": ("members.csv", csv_data, "text/csv")}
        resp = client.post("/api/v1/teams/upload-members-csv", files=files, headers=organizer_headers)
        assert resp.status_code == 200
        assert "Successfully imported members CSV" in resp.json()["message"]

        # 2. Verify Team A has is_csv_managed = True
        team_resp = client.get("/api/v1/teams/my-team", headers=team_leader_headers)
        assert team_resp.status_code == 200
        team_body = team_resp.json()
        assert team_body["is_csv_managed"] is True
        assert len(team_body["members"]) >= 1
        assert team_body["members"][0]["name"] == "CSV Player 1"
        member_id = team_body["members"][0]["id"]

        # 3. Test that manual member addition is locked
        add_resp = client.post("/api/v1/teams/my-team/members", json={
            "name": "Blocked Player",
            "employee_id": "EMP999",
        }, headers=team_leader_headers)
        assert add_resp.status_code == 400
        assert "Manual member addition is locked" in add_resp.json()["detail"]

        # 4. Test that manual member removal is locked
        del_resp = client.delete(f"/api/v1/teams/my-team/members/{member_id}", headers=team_leader_headers)
        assert del_resp.status_code == 400
        assert "Manual member removal is locked" in del_resp.json()["detail"]

        # 5. Test that uploading CSV to a team with manual members fails
        reg_resp = client.post("/api/v1/auth/register", json={
            "username": "user_manual_test",
            "email": "manualtest@gmail.com",
            "password": "password123",
            "team_name": "D",
            "team_leader_name": "Manual Leader",
        })
        assert reg_resp.status_code == 201
        headers = {"Authorization": f"Bearer {reg_resp.json()['access_token']}"}

        # Add member manually
        client.post("/api/v1/teams/my-team/members", json={
            "name": "Manual Player",
            "employee_id": "MAN001",
        }, headers=headers)

        # Upload CSV targeting "Team D" (D group) - this team already has manual members
        csv_data_fail = (
            "SL No,EmployeeID,Name,Seniority,Gender,Football Knowledge,Group\n"
            "1,MAN002,CSV Player,Junior,F,Football,D\n"
        )
        files_fail = {"file": ("members_fail.csv", csv_data_fail, "text/csv")}
        resp_fail = client.post("/api/v1/teams/upload-members-csv", files=files_fail, headers=organizer_headers)
        assert resp_fail.status_code == 400
        assert "already contains manually added members" in resp_fail.json()["detail"]

    def test_xlsx_upload(self, client, organizer_headers, team_leader_headers, team_a):
        import openpyxl
        import io
        
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.append(["SL No", "EmployeeID", "Name", "Seniority", "Gender", "Football Knowledge", "Group"])
        ws.append([1, "EMP001", "Excel Player 1", "Senior", "M", "Football", "A"])
        
        file_stream = io.BytesIO()
        wb.save(file_stream)
        file_stream.seek(0)
        
        files = {"file": ("members.xlsx", file_stream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        resp = client.post("/api/v1/teams/upload-members-csv", files=files, headers=organizer_headers)
        assert resp.status_code == 200
        assert "Successfully imported members CSV" in resp.json()["message"]
        
        team_resp = client.get("/api/v1/teams/my-team", headers=team_leader_headers)
        assert team_resp.status_code == 200
        team_body = team_resp.json()
        assert team_body["is_csv_managed"] is True
        assert len(team_body["members"]) == 1
        assert team_body["members"][0]["name"] == "Excel Player 1"
        assert team_body["members"][0]["employee_id"] == "EMP001"

