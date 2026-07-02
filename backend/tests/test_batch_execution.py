import uuid
from datetime import datetime, timezone, timedelta
import pickle
import time
from io import BytesIO
import pytest
from app.models.enums import BatchExecutionStatus, BatchJobStatus
from app.model_execution.models.model_upload import ModelUploadModel
from app.models.team import TeamModel
from app.repositories.batch_execution_repository import BatchExecutionRepository


class TestBatchExecutionAPI:
    def test_discover_latest_models_rules(self, client, organizer_headers, db_session, team_a, sample_match):
        # 1. Create a second team that is inactive
        team_inactive = TeamModel(
            team_id="B",
            name="Team B Inactive",
            code="B",
            team_leader_name="Leader B",
            is_active=False,
        )
        db_session.add(team_inactive)
        db_session.commit()

        # 2. Verify response is empty since no models uploaded yet
        resp = client.post("/api/v1/batch-executions", json={}, headers=organizer_headers)
        assert resp.status_code == 200
        assert resp.json() == []

        # 3. Upload model 1 (older) for Team A
        upload1 = ModelUploadModel(
            team_id=team_a.id,
            match_id=sample_match.id,
            original_filename="model_older.pkl",
            stored_file_path="/tmp/model_older.pkl",
            status="IDLE",
            created_at=datetime.now(timezone.utc) - timedelta(hours=2),
        )
        db_session.add(upload1)

        # 4. Upload model 2 (latest) for Team A
        upload2 = ModelUploadModel(
            team_id=team_a.id,
            match_id=sample_match.id,
            original_filename="model_latest.pkl",
            stored_file_path="/tmp/model_latest.pkl",
            status="IDLE",
            created_at=datetime.now(timezone.utc),
        )
        db_session.add(upload2)

        # 5. Upload model for inactive Team B
        upload_inactive = ModelUploadModel(
            team_id=team_inactive.id,
            match_id=sample_match.id,
            original_filename="model_inactive.pkl",
            stored_file_path="/tmp/model_inactive.pkl",
            status="IDLE",
            created_at=datetime.now(timezone.utc),
        )
        db_session.add(upload_inactive)
        db_session.commit()

        # 6. Request batch execution (model discovery)
        resp = client.post("/api/v1/batch-executions", json={}, headers=organizer_headers)
        assert resp.status_code == 200
        body = resp.json()

        # We should only have 1 team's model discovered (Team A)
        # Because Team B is inactive, and other teams have no uploaded models.
        assert len(body) == 1
        discovered = body[0]
        assert discovered["team"]["id"] == str(team_a.id)
        assert discovered["team"]["name"] == "Team A"
        assert discovered["latest_model"]["id"] == str(upload2.id)
        assert discovered["latest_model"]["original_filename"] == "model_latest.pkl"

    def test_list_batches(self, client, organizer_headers, db_session, organizer):
        # Create a batch in DB directly using repository to test listing
        repo = BatchExecutionRepository(db_session)
        batch = repo.create_batch(created_by=organizer.id)

        list_resp = client.get("/api/v1/batch-executions", headers=organizer_headers)
        assert list_resp.status_code == 200
        body = list_resp.json()
        assert "batches" in body
        assert body["total"] >= 1
        batch_ids = [b["id"] for b in body["batches"]]
        assert str(batch.id) in batch_ids

    def test_get_batch(self, client, organizer_headers, db_session, organizer):
        # Create a batch in DB directly
        repo = BatchExecutionRepository(db_session)
        batch = repo.create_batch(created_by=organizer.id)

        get_resp = client.get(f"/api/v1/batch-executions/{batch.id}", headers=organizer_headers)
        assert get_resp.status_code == 200
        body = get_resp.json()
        assert body["id"] == str(batch.id)

    def test_get_nonexistent_batch(self, client, organizer_headers):
        random_uuid = str(uuid.uuid4())
        get_resp = client.get(f"/api/v1/batch-executions/{random_uuid}", headers=organizer_headers)
        assert get_resp.status_code == 404
        assert get_resp.json()["detail"] == "Batch not found"

    def test_add_job(self, client, organizer_headers, db_session, organizer, team_a, sample_match):
        # Create a batch in DB directly
        repo = BatchExecutionRepository(db_session)
        batch = repo.create_batch(created_by=organizer.id)

        team_id = str(team_a.id)
        match_id = str(sample_match.id)

        add_job_resp = client.post(
            f"/api/v1/batch-executions/{batch.id}/jobs?team_id={team_id}&match_id={match_id}",
            json={},
            headers=organizer_headers,
        )
        assert add_job_resp.status_code == 200
        job_body = add_job_resp.json()
        assert job_body["batch_id"] == str(batch.id)
        assert job_body["team_id"] == team_id
        assert job_body["match_id"] == match_id
        assert job_body["status"] == "PENDING"

        # Verify that the batch job counts updated
        get_resp = client.get(f"/api/v1/batch-executions/{batch.id}", headers=organizer_headers)
        batch_body = get_resp.json()
        assert batch_body["total_jobs"] == 1
        assert batch_body["pending_jobs"] == 1
        assert len(batch_body["jobs"]) == 1
        assert batch_body["jobs"][0]["id"] == job_body["id"]

    def test_forbidden_for_team_leader(self, client, team_leader_headers):
        resp = client.post("/api/v1/batch-executions", json={}, headers=team_leader_headers)
        assert resp.status_code == 403

        resp_list = client.get("/api/v1/batch-executions", headers=team_leader_headers)
        assert resp_list.status_code == 403


class DummyModelSuccess:
    def predict(self, model_input=None):
        return {
            "predicted_winner": "home",
            "score": {"teamA": 2, "teamB": 1},
            "confidence": 95
        }


class DummyModelFailure:
    def predict(self, model_input=None):
        raise ValueError("Simulated crash")


class TestBatchQueueProcessor:
    def test_execute_batch_success(self, client, organizer_headers, db_session, organizer, team_a, sample_match):
        # 1. Upload valid model
        model = DummyModelSuccess()
        model_bytes = pickle.dumps(model)
        upload_resp = client.post(
            "/api/v1/model-execution/upload",
            headers=organizer_headers,
            data={"match_id": str(sample_match.id), "team_id": str(team_a.id)},
            files={"file": ("model.pkl", BytesIO(model_bytes), "application/octet-stream")}
        )
        model_upload_id = upload_resp.json()["model_id"]

        # 2. Create batch and job
        repo = BatchExecutionRepository(db_session)
        batch = repo.create_batch(created_by=organizer.id)
        job = repo.add_job(
            batch_id=batch.id,
            team_id=team_a.id,
            match_id=sample_match.id,
            model_upload_id=uuid.UUID(model_upload_id)
        )

        # 3. Execute
        exec_resp = client.post(
            f"/api/v1/batch-executions/{batch.id}/execute",
            headers=organizer_headers
        )
        assert exec_resp.status_code == 200
        assert exec_resp.json()["status"] == "PENDING"

        # 4. Wait for background processor
        time.sleep(0.5)

        # 5. Verify batch and job statuses
        get_resp = client.get(f"/api/v1/batch-executions/{batch.id}", headers=organizer_headers)
        body = get_resp.json()
        assert body["overall_status"] == "COMPLETED"
        assert body["total_jobs"] == 1
        assert body["completed_jobs"] == 1
        assert body["failed_jobs"] == 0
        assert body["pending_jobs"] == 0
        assert body["jobs"][0]["status"] == "COMPLETED"

    def test_execute_batch_failure(self, client, organizer_headers, db_session, organizer, team_a, sample_match):
        # 1. Upload failing model
        model = DummyModelFailure()
        model_bytes = pickle.dumps(model)
        upload_resp = client.post(
            "/api/v1/model-execution/upload",
            headers=organizer_headers,
            data={"match_id": str(sample_match.id), "team_id": str(team_a.id)},
            files={"file": ("model.pkl", BytesIO(model_bytes), "application/octet-stream")}
        )
        model_upload_id = upload_resp.json()["model_id"]

        # 2. Create batch and job
        repo = BatchExecutionRepository(db_session)
        batch = repo.create_batch(created_by=organizer.id)
        job = repo.add_job(
            batch_id=batch.id,
            team_id=team_a.id,
            match_id=sample_match.id,
            model_upload_id=uuid.UUID(model_upload_id)
        )

        # 3. Execute
        exec_resp = client.post(
            f"/api/v1/batch-executions/{batch.id}/execute",
            headers=organizer_headers
        )
        assert exec_resp.status_code == 200

        # 4. Wait for background processor
        time.sleep(0.5)

        # 5. Verify batch failed status
        get_resp = client.get(f"/api/v1/batch-executions/{batch.id}", headers=organizer_headers)
        body = get_resp.json()
        assert body["overall_status"] == "FAILED"
        assert body["total_jobs"] == 1
        assert body["completed_jobs"] == 0
        assert body["failed_jobs"] == 1
        assert body["pending_jobs"] == 0
        assert body["jobs"][0]["status"] == "FAILED"
        assert "Simulated crash" in body["jobs"][0]["error_message"]

    def test_execute_batch_partial_failure(self, client, organizer_headers, db_session, organizer, team_a, sample_match):
        # Create team_b
        team_b = TeamModel(
            team_id="C",
            name="Team C",
            code="C",
            team_leader_name="Leader C",
        )
        db_session.add(team_b)
        db_session.commit()

        # 1. Upload valid model for team_a
        model_a = DummyModelSuccess()
        model_bytes_a = pickle.dumps(model_a)
        upload_resp_a = client.post(
            "/api/v1/model-execution/upload",
            headers=organizer_headers,
            data={"match_id": str(sample_match.id), "team_id": str(team_a.id)},
            files={"file": ("model_a.pkl", BytesIO(model_bytes_a), "application/octet-stream")}
        )
        model_upload_id_a = upload_resp_a.json()["model_id"]

        # 2. Upload failing model for team_b
        model_b = DummyModelFailure()
        model_bytes_b = pickle.dumps(model_b)
        upload_resp_b = client.post(
            "/api/v1/model-execution/upload",
            headers=organizer_headers,
            data={"match_id": str(sample_match.id), "team_id": str(team_b.id)},
            files={"file": ("model_b.pkl", BytesIO(model_bytes_b), "application/octet-stream")}
        )
        model_upload_id_b = upload_resp_b.json()["model_id"]

        # 3. Create batch and two jobs
        repo = BatchExecutionRepository(db_session)
        batch = repo.create_batch(created_by=organizer.id)
        repo.add_job(
            batch_id=batch.id,
            team_id=team_a.id,
            match_id=sample_match.id,
            model_upload_id=uuid.UUID(model_upload_id_a)
        )
        repo.add_job(
            batch_id=batch.id,
            team_id=team_b.id,
            match_id=sample_match.id,
            model_upload_id=uuid.UUID(model_upload_id_b)
        )

        # 4. Execute
        exec_resp = client.post(
            f"/api/v1/batch-executions/{batch.id}/execute",
            headers=organizer_headers
        )
        assert exec_resp.status_code == 200

        # 5. Wait for background processor
        time.sleep(0.5)

        # 6. Verify batch was processed:
        # - overall_status should be COMPLETED since at least one job succeeded (or because it processed all of them without quitting the batch)
        # - total_jobs = 2, completed_jobs = 1, failed_jobs = 1, pending_jobs = 0
        get_resp = client.get(f"/api/v1/batch-executions/{batch.id}", headers=organizer_headers)
        body = get_resp.json()
        assert body["overall_status"] == "COMPLETED"
        assert body["total_jobs"] == 2
        assert body["completed_jobs"] == 1
        assert body["failed_jobs"] == 1
        assert body["pending_jobs"] == 0

    def test_get_batch_progress(self, client, organizer_headers, db_session, organizer, team_a, sample_match):
        # Create team_b
        team_b = TeamModel(
            team_id="D",
            name="Team D",
            code="D",
            team_leader_name="Leader D",
        )
        db_session.add(team_b)
        db_session.commit()

        # 1. Upload valid model for team_a
        model_a = DummyModelSuccess()
        model_bytes_a = pickle.dumps(model_a)
        upload_resp_a = client.post(
            "/api/v1/model-execution/upload",
            headers=organizer_headers,
            data={"match_id": str(sample_match.id), "team_id": str(team_a.id)},
            files={"file": ("model_a.pkl", BytesIO(model_bytes_a), "application/octet-stream")}
        )
        model_upload_id_a = upload_resp_a.json()["model_id"]

        # 2. Upload failing model for team_b
        model_b = DummyModelFailure()
        model_bytes_b = pickle.dumps(model_b)
        upload_resp_b = client.post(
            "/api/v1/model-execution/upload",
            headers=organizer_headers,
            data={"match_id": str(sample_match.id), "team_id": str(team_b.id)},
            files={"file": ("model_b.pkl", BytesIO(model_bytes_b), "application/octet-stream")}
        )
        model_upload_id_b = upload_resp_b.json()["model_id"]

        # 3. Create batch and jobs
        repo = BatchExecutionRepository(db_session)
        batch = repo.create_batch(created_by=organizer.id)
        repo.add_job(
            batch_id=batch.id,
            team_id=team_a.id,
            match_id=sample_match.id,
            model_upload_id=uuid.UUID(model_upload_id_a)
        )
        repo.add_job(
            batch_id=batch.id,
            team_id=team_b.id,
            match_id=sample_match.id,
            model_upload_id=uuid.UUID(model_upload_id_b)
        )

        # 4. Execute
        client.post(f"/api/v1/batch-executions/{batch.id}/execute", headers=organizer_headers)
        time.sleep(0.5)

        # 5. Fetch progress
        progress_resp = client.get(f"/api/v1/batch-executions/{batch.id}/progress", headers=organizer_headers)
        assert progress_resp.status_code == 200
        progress_body = progress_resp.json()

        # 6. Verify progress metrics
        assert progress_body["batch_summary"]["id"] == str(batch.id)
        assert progress_body["progress_percent"] == 100.0
        assert progress_body["estimated_remaining_jobs"] == 0
        assert len(progress_body["completed_jobs"]) == 1
        assert len(progress_body["failed_jobs"]) == 1
        assert len(progress_body["pending_jobs"]) == 0
        assert progress_body["current_running_job"] is None

        # Verify job details structure
        completed_job = progress_body["completed_jobs"][0]
        assert completed_job["team"]["name"] == "Team A"
        assert completed_job["match"]["home_team_name"] == sample_match.home_team_name
        assert completed_job["model"]["original_filename"] == "model_a.pkl"
        assert completed_job["status"] == "COMPLETED"
        assert completed_job["started_at"] is not None
        assert completed_job["completed_at"] is not None
        assert completed_job["error_message"] is None

        failed_job = progress_body["failed_jobs"][0]
        assert failed_job["team"]["name"] == "Team D"
        assert failed_job["match"]["home_team_name"] == sample_match.home_team_name
        assert failed_job["model"]["original_filename"] == "model_b.pkl"
        assert failed_job["status"] == "FAILED"
        assert failed_job["error_message"] is not None


    def test_cancel_batch(self, client, organizer_headers, db_session, organizer):
        repo = BatchExecutionRepository(db_session)
        batch = repo.create_batch(created_by=organizer.id)
        cancel_resp = client.post(f"/api/v1/batch-executions/{batch.id}/cancel", headers=organizer_headers)
        assert cancel_resp.status_code == 200
        assert cancel_resp.json()["status"] == "CANCELLED"


    def test_retry_batch(self, client, organizer_headers, db_session, organizer, team_a, sample_match):
        model = DummyModelFailure()
        model_bytes = pickle.dumps(model)
        upload_resp = client.post(
            "/api/v1/model-execution/upload",
            headers=organizer_headers,
            data={"match_id": str(sample_match.id), "team_id": str(team_a.id)},
            files={"file": ("model.pkl", BytesIO(model_bytes), "application/octet-stream")}
        )
        model_upload_id = upload_resp.json()["model_id"]

        repo = BatchExecutionRepository(db_session)
        batch = repo.create_batch(created_by=organizer.id)
        job = repo.add_job(
            batch_id=batch.id,
            team_id=team_a.id,
            match_id=sample_match.id,
            model_upload_id=uuid.UUID(model_upload_id)
        )
        
        client.post(f"/api/v1/batch-executions/{batch.id}/execute", headers=organizer_headers)
        time.sleep(0.5)
        
        db_session.refresh(batch)
        db_session.refresh(job)
        assert batch.overall_status == "FAILED"
        assert job.status == "FAILED"

        retry_resp = client.post(f"/api/v1/batch-executions/{batch.id}/retry", headers=organizer_headers)
        assert retry_resp.status_code == 200
        assert retry_resp.json()["status"] == "PENDING"


    def test_retry_job(self, client, organizer_headers, db_session, organizer, team_a, sample_match):
        model = DummyModelFailure()
        model_bytes = pickle.dumps(model)
        upload_resp = client.post(
            "/api/v1/model-execution/upload",
            headers=organizer_headers,
            data={"match_id": str(sample_match.id), "team_id": str(team_a.id)},
            files={"file": ("model.pkl", BytesIO(model_bytes), "application/octet-stream")}
        )
        model_upload_id = upload_resp.json()["model_id"]

        repo = BatchExecutionRepository(db_session)
        batch = repo.create_batch(created_by=organizer.id)
        job = repo.add_job(
            batch_id=batch.id,
            team_id=team_a.id,
            match_id=sample_match.id,
            model_upload_id=uuid.UUID(model_upload_id)
        )
        
        client.post(f"/api/v1/batch-executions/{batch.id}/execute", headers=organizer_headers)
        time.sleep(0.5)
        
        db_session.refresh(batch)
        db_session.refresh(job)
        assert batch.overall_status == "FAILED"
        assert job.status == "FAILED"

        retry_resp = client.post(f"/api/v1/batch-executions/jobs/{job.id}/retry", headers=organizer_headers)
        assert retry_resp.status_code == 200
        assert retry_resp.json()["status"] == "PENDING"


    def test_duplicate_execution_prevention(self, client, organizer_headers, db_session, organizer):
        repo = BatchExecutionRepository(db_session)
        batch = repo.create_batch(created_by=organizer.id)
        batch.overall_status = "RUNNING"
        db_session.commit()

        exec_resp = client.post(f"/api/v1/batch-executions/{batch.id}/execute", headers=organizer_headers)
        assert exec_resp.status_code == 400
        assert "already running" in exec_resp.json()["detail"]

