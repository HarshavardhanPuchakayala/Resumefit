import re

SKILLS = {
    "Python": ["python"],
    "Java": ["java"],
    "JavaScript": ["javascript", "es6"],
    "TypeScript": ["typescript"],
    "C++": ["c++"],
    "C#": ["c#"],
    ".NET": [".net", "dotnet", "asp.net"],
    "React": ["react", "react.js", "reactjs"],
    "Next.js": ["next.js", "nextjs"],
    "Node.js": ["node.js", "nodejs", "node"],
    "Express": ["express.js", "expressjs"],
    "FastAPI": ["fastapi"],
    "Django": ["django"],
    "Flask": ["flask"],
    "Spring Boot": ["spring boot", "springboot", "spring"],
    "HTML": ["html", "html5"],
    "CSS": ["css", "css3"],
    "Tailwind CSS": ["tailwind", "tailwindcss"],
    "Redux": ["redux", "redux toolkit"],
    "Responsive Design": ["responsive"],
    "REST APIs": ["restful", "rest api", "rest apis", "restful api", "restful apis"],
    "GraphQL": ["graphql"],
    "WebSockets": ["websocket", "websockets"],
    "SQL": ["sql"],
    "PostgreSQL": ["postgresql", "postgres"],
    "MySQL": ["mysql"],
    "MongoDB": ["mongodb", "mongo"],
    "Redis": ["redis"],
    "Kafka": ["kafka"],
    "RabbitMQ": ["rabbitmq"],
    "Docker": ["docker", "containerization"],
    "Kubernetes": ["kubernetes", "k8s"],
    "AWS": ["aws", "amazon web services"],
    "Azure": ["azure"],
    "GCP": ["gcp", "google cloud"],
    "Git": ["git"],
    "GitHub": ["github"],
    "CI/CD": ["ci/cd", "cicd"],
    "Linux": ["linux"],
    "Agile": ["agile", "scrum"],
    "Microservices": ["microservice", "microservices"],
    "Testing": ["testing", "unit testing", "jest", "pytest", "junit"],
    "Postman": ["postman"],
    "JWT": ["jwt", "json web token", "json web tokens"],
    "OAuth": ["oauth", "oauth2"],
    "LLM": ["llm", "llms", "large language model", "large language models"],
    "LangChain": ["langchain"],
    "LangGraph": ["langgraph"],
    "RAG": ["rag", "retrieval augmented generation", "retrieval-augmented generation"],
    "Prompt Engineering": ["prompt engineering"],
    "Vector Databases": ["vector database", "vector databases", "pinecone", "chroma", "pgvector"],
    "MCP": ["mcp", "model context protocol"],
    "Machine Learning": ["machine learning", "ml"],
    "Pandas": ["pandas"],
    "NumPy": ["numpy"],
    "PyTorch": ["pytorch"],
    "TensorFlow": ["tensorflow"],
    "scikit-learn": ["scikit-learn", "sklearn"],
    "ERP": ["erp"],
    "ERPNext": ["erpnext"],
    "SAP": ["sap"],
    "Data Migration": ["data migration", "etl"],
}


def _compile(aliases):
    ordered = sorted(aliases, key=len, reverse=True)
    body = "|".join(re.escape(a) for a in ordered)
    return re.compile(rf"(?<![A-Za-z0-9+#])(?:{body})(?![A-Za-z0-9+#])", re.IGNORECASE)


PATTERNS = {name: _compile(aliases) for name, aliases in SKILLS.items()}

PROOF_SECTIONS = {"experience", "projects"}


def extract_skills(text: str) -> set[str]:
    return {name for name, pattern in PATTERNS.items() if pattern.search(text)}


def _flatten(value) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        return "\n".join(_flatten(item) for item in value)
    if isinstance(value, dict):
        return "\n".join(_flatten(item) for item in value.values())
    return ""


def match_resume(job_description: str, ai_view: dict) -> dict:
    jd_skills = extract_skills(job_description)
    found_by_section = {
        section: extract_skills(_flatten(value)) for section, value in ai_view.items()
    }
    resume_skills = set().union(*found_by_section.values())

    matched = sorted(jd_skills & resume_skills)
    missing = sorted(jd_skills - resume_skills)
    score = round(100 * len(matched) / len(jd_skills)) if jd_skills else 0

    where_found = {
        skill: [sec for sec, found in found_by_section.items() if skill in found]
        for skill in matched
    }

    suggestions = []
    for skill in matched:
        if not PROOF_SECTIONS & set(where_found[skill]):
            suggestions.append(
                f"{skill} is only in your skills or summary. Add a bullet in Experience "
                f"or Projects showing how you used it."
            )
    for skill in missing:
        suggestions.append(
            f"{skill} is in the job description but not in your resume. "
            f"Learn it first, and add it only if you really know it."
        )

    note = "" if jd_skills else "No known skills were found in this job description."

    return {
        "score": score,
        "matched": matched,
        "missing": missing,
        "where_found": where_found,
        "suggestions": suggestions,
        "note": note,
    }