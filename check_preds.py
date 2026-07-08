import requests

login_url = "http://192.168.21.155:8002/api/v1/auth/login"
resp = requests.post(login_url, json={"email": "arshas@opentrends.net", "password": "admin123"})
print("Login status:", resp.status_code)
if resp.status_code == 200:
    token = resp.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    preds_resp = requests.get("http://192.168.21.155:8002/api/v1/predictions", headers=headers)
    print("Predictions count:", len(preds_resp.json()))
    print("Predictions data:", preds_resp.json())
else:
    print(resp.text)
