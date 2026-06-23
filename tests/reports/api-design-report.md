Score: 78/100
Status: WARNING
Critical Issues:
- Missing pagination parameters (e.g. limit and offset) on listing endpoints for teams and matches.
- Custom non-standard return formats on member actions (e.g. DELETE returns text JSON details instead of standard HTTP response states).

Recommendations:
- Enforce offset/limit pagination on list endpoints.
- Refactor endpoints to return REST-compliant status codes (like 204 No Content for deletion).
