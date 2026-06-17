import re

with open("backend/app/api/team_routes.py", "r") as f:
    content = f.read()

# Pattern to match the specific blocks:
#    if team.is_csv_managed:
#        raise HTTPException(...)

pattern = re.compile(
    r'\s*if team\.is_csv_managed:\s*raise HTTPException\(\s*status_code=400,\s*detail="[^"]+"\s*\)',
    re.MULTILINE
)

new_content = pattern.sub('', content)

with open("backend/app/api/team_routes.py", "w") as f:
    f.write(new_content)

print("Updated team_routes.py")
