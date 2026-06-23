import requests
import io
import json

base_url = "http://localhost:8000/api/v1"

# 1. Login as organizer
login_data = {
    "username": "organizer@example.com",
    "password": "password123"
}
resp = requests.post(f"{base_url}/auth/login", data=login_data)
token = resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Get rounds
rounds = requests.get(f"{base_url}/presentation-rounds", headers=headers).json()
if not rounds:
    # create one
    requests.post(f"{base_url}/presentation-rounds", json={"name": "Round 1"}, headers=headers)
    rounds = requests.get(f"{base_url}/presentation-rounds", headers=headers).json()
round_id = rounds[0]["id"]

# 3. Create a judge if not exists
judges = requests.get(f"{base_url}/judges", headers=headers).json()
if not judges:
    requests.post(f"{base_url}/judges", json={"name": "Judge 1", "employee_id": "J001"}, headers=headers)

# 4. Upload CSV
csv_content = """Team Name,Judge Name,Problem Understanding,Feature Engineering,Team Work,Presentation Quality,Q&A
Team A,Judge 1,8,12,8,8,4
"""

files = {"file": ("test.csv", io.StringIO(csv_content), "text/csv")}
data = {"round_id": round_id}
upload_resp = requests.post(f"{base_url}/presentation-score/upload-csv", headers=headers, files=files, data=data)
print("Upload response:", upload_resp.json())

# 5. Check Leaderboard
lb_resp = requests.get(f"{base_url}/leaderboard", headers=headers)
print("Leaderboard:")
print(json.dumps(lb_resp.json(), indent=2))
