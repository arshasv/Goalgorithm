import requests

API_URL = "http://localhost:8000/api/v1"

# Team Leader Login
tl_login_data = {"email": "tl1@example.com", "password": "password123"}
r = requests.post(f"{API_URL}/auth/login", json=tl_login_data)
if r.status_code == 200:
    tl_token = r.json()["access_token"]
    
    headers = {"Authorization": f"Bearer {tl_token}"}
    r = requests.get(f"{API_URL}/matches", headers=headers)
    print("Matches:", len(r.json()))
    
    r = requests.get(f"{API_URL}/predictions", headers=headers)
    print("Predictions:", len(r.json()))
else:
    print("Login failed")
