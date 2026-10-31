from suggest import collect_bullets, validate_suggestions

bullets = [
    {"id": "exp-0-0", "section": "experience", "item": 0, "bullet": 0,
     "text": "Built APIs using Node.js and PostgreSQL for 3 clients"},
    {"id": "exp-0-1", "section": "experience", "item": 0, "bullet": 1,
     "text": "Wrote backend services"},
]


def run(bullet_id, new_text, allowed=frozenset({"Docker"})):
    raw = {"suggestions": [{"id": bullet_id, "new_text": new_text, "reason": "test"}]}
    return validate_suggestions(raw, bullets, set(allowed))


assert len(run("exp-0-0", "Built Node.js and PostgreSQL APIs for 3 clients")) == 1

ok = run("exp-0-1", "Deployed backend services with Docker")
assert len(ok) == 1 and ok[0]["added_skills"] == ["Docker"]

assert run("exp-0-1", "Ran Kubernetes clusters for backend services") == []
assert run("exp-0-1", "Wrote backend services serving 50 users") == []
assert run("exp-0-1", "Wrote backend services, email me at a@b.com") == []
assert run("exp-9-9", "Wrote backend services for clients") == []
assert validate_suggestions("garbage", bullets, set()) == []

view = {
    "experience": [{"bullets": ["Call [PHONE] now", "Built APIs"]}],
    "projects": [{"bullets": ["Made app"]}],
}
assert [b["id"] for b in collect_bullets(view)] == ["exp-0-1", "proj-0-0"]

print("PASS: every unsafe AI suggestion is rejected")