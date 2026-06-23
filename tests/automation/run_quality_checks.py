#!/usr/bin/env python3
import subprocess
import sys
import os
import json

def run_command(cmd, shell=False):
    try:
        res = subprocess.run(cmd, shell=shell, capture_output=True, text=True, check=False)
        return res.returncode, res.stdout, res.stderr
    except Exception as e:
        return -1, "", str(e)

def is_in_container():
    return os.path.exists("/app") and os.path.exists("/usr/local/bin/python")

def main():
    print("==================================================")
    print("FIFA AI Challenge Scoring System QA Automation Engine")
    print("==================================================")

    in_docker = is_in_container()
    container_name = "fifa-scoring-system-fifa-scoring-api-1"

    # Define checks to run
    checks = {
        "ruff": ["ruff", "check", "."],
        "black": ["black", "--check", "."],
        "mypy": ["mypy", "."],
        "bandit": ["bandit", "-r", "."],
        "pip_audit": ["pip-audit"],
        "pytest": ["pytest"],
        "pytest_cov": ["pytest", "--cov=app"]
    }

    # If running on host, run them inside docker container
    if not in_docker:
        print("[Host Mode] Executing quality analysis tools via Docker container...")
        for name, cmd in checks.items():
            checks[name] = ["docker", "exec", "-i", container_name, "env", "PYTHONPATH=."] + cmd
    else:
        print("[Container Mode] Executing quality tools directly in container context...")
        # Ensure PYTHONPATH is set
        os.environ["PYTHONPATH"] = "."

    # Execute and print results
    results = {}
    for name, cmd in checks.items():
        print(f"Running {name} check: {' '.join(cmd)}")
        code, stdout, stderr = run_command(cmd)
        results[name] = {
            "code": code,
            "stdout": stdout,
            "stderr": stderr
        }
        status = "PASSED" if code == 0 else "FAILED"
        print(f"--> {name} check: {status}")

    # Generate custom database validation report
    print("Running database model validation...")
    db_cmd = ["python", "-c", "from app.database.session import SessionLocal; from sqlalchemy import text; db = SessionLocal(); print(db.execute(text('select 1')).scalar())"]
    if not in_docker:
        db_cmd = ["docker", "exec", "-i", container_name] + db_cmd
    db_code, db_out, db_err = run_command(db_cmd)
    results["db_connection"] = {
        "code": db_code,
        "stdout": db_out,
        "stderr": db_err
    }

    # Generate custom API route validation report
    print("Running API router validation...")
    api_cmd = ["python", "-c", "from app.main import app; print([r.path for r in app.routes])"]
    if not in_docker:
        api_cmd = ["docker", "exec", "-i", container_name] + api_cmd
    api_code, api_out, api_err = run_command(api_cmd)
    results["api_routes"] = {
        "code": api_code,
        "stdout": api_out,
        "stderr": api_err
    }

    # Save results to a json file in reports
    reports_dir = "/home/user/Desktop/FIFA_scoring/fifa-scoring-system/tests/reports"
    os.makedirs(reports_dir, exist_ok=True)
    with open(os.path.join(reports_dir, "raw_automation_results.json"), "w") as f:
        json.dump(results, f, indent=2)

    print(f"Automation execution complete. Results saved to {reports_dir}/raw_automation_results.json")

if __name__ == "__main__":
    main()
