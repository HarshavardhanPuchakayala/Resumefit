import json

from backend.privacy import PrivacyError, build_ai_view

contact = {
    "full_name": "Anil Varma",
    "phone": "+91 98765 43210",
    "email": "anil.varma@example.com",
    "linkedin": "linkedin.com/in/anilvarma",
    "github": "github.com/anilvarma",
    "portfolio": "anilvarma.dev",
}

content = {
    "headline": "Full Stack Developer",
    "summary": "Anil Varma, reach me at anil.varma@example.com or 9876543210.",
    "skills": [{"category": "Backend", "items": ["Node.js", "ASP.NET", "FastAPI"]}],
    "experience": [
        {
            "role": "Software Engineer",
            "company": "ABC Tech",
            "start_date": "2019",
            "end_date": "2023",
            "bullets": [
                "Built APIs, call +91 98765 43210 for the demo",
                "Portfolio at anilvarma.dev and code at github.com/anilvarma/shop",
                "Cut report time by 40 percent",
            ],
        }
    ],
}

ai_view = build_ai_view(contact, content)
text = json.dumps(ai_view, indent=2)
print(text)

for secret in ["Anil", "Varma", "98765", "43210", "example.com", "anilvarma"]:
    assert secret.lower() not in text.lower(), f"LEAK: {secret}"

for keep in ["Node.js", "ASP.NET", "FastAPI", "2019", "2023", "40 percent"]:
    assert keep in text, f"DAMAGED: {keep}"

print("\nPASS: nothing personal in the AI text, keywords intact")

try:
    build_ai_view(contact, {"summary": "ok"} | {"headline": "x"})
    print("PASS: clean input allowed")
except PrivacyError:
    print("FAIL: clean input was blocked")