import uuid
from io import BytesIO

def test_upload_non_pkl_rejected(client, db_session, team_leader_headers, sample_match):
    file_content = b"fake model content"
    response = client.post(
        "/api/v1/model-execution/upload",
        headers=team_leader_headers,
        data={"match_id": str(sample_match.id)},
        files={"file": ("model.txt", BytesIO(file_content), "text/plain")}
    )
    assert response.status_code == 400
    assert "Only .pkl files are allowed" in response.json()["detail"]

def test_upload_pkl_success(client, db_session, team_leader_headers, sample_match):
    file_content = b"fake pkl content"
    response = client.post(
        "/api/v1/model-execution/upload",
        headers=team_leader_headers,
        data={"match_id": str(sample_match.id)},
        files={"file": ("model.pkl", BytesIO(file_content), "application/octet-stream")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "model_id" in data
    assert data["status"] == "IDLE"

    # Now get status
    status_resp = client.get(
        f"/api/v1/model-execution/{data['model_id']}/status",
        headers=team_leader_headers
    )
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] == "IDLE"
    assert status_data["error_message"] is None
