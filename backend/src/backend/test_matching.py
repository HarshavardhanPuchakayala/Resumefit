from matching import extract_skills, match_resume

assert extract_skills("JavaScript and java") == {"JavaScript", "Java"}
assert extract_skills("PostgreSQL") == {"PostgreSQL"}
assert extract_skills("GitHub") == {"GitHub"}

jd = (
    "We need Python, FastAPI, PostgreSQL, Docker and Kubernetes. "
    "Experience with Node.js and CI/CD is a plus."
)
view = {
    "skills": [
        {"category": "Backend", "items": ["Python", "FastAPI", "Node.js", "PostgreSQL"]}
    ],
    "experience": [{"bullets": ["Built APIs with FastAPI and Python"]}],
}

result = match_resume(jd, view)
print(result)

assert result["score"] == 57
assert result["matched"] == ["FastAPI", "Node.js", "PostgreSQL", "Python"]
assert result["missing"] == ["CI/CD", "Docker", "Kubernetes"]
assert result["where_found"]["FastAPI"] == ["skills", "experience"]
assert len(result["suggestions"]) == 5

print("PASS: matching works")