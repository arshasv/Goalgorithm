import requests

API_URL = "http://localhost:8000/api/v1"

# Organizer Login
login_data = {"email": "org@example.com", "password": "password123"}
r = requests.post(f"{API_URL}/auth/login", json=login_data)
if r.status_code != 200:
    print("Organizer login failed:", r.text)
else:
    org_token = r.json()["access_token"]
    print("Organizer Token:", org_token)

    # Get submitted models
    headers = {"Authorization": f"Bearer {org_token}"}
    r = requests.get(f"{API_URL}/model-evaluations/models", headers=headers)
    print("Models:", r.json())

# Team Leader Login
tl_login_data = {"email": "tl1@example.com", "password": "password123"}
r = requests.post(f"{API_URL}/auth/login", json=tl_login_data)
if r.status_code != 200:
    print("Team Leader login failed:", r.text)
else:
    tl_token = r.json()["access_token"]
    print("Team Leader Token:", tl_token)
    
    headers = {"Authorization": f"Bearer {tl_token}"}
    r = requests.get(f"{API_URL}/model-evaluations/analytics", headers=headers)
    print("TL Analytics Response:", r.status_code, r.text)

