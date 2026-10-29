from fastapi import FastAPI
from sqlalchemy import text
import auth
from db import engine
from models import Base
import resume_routes
Base.metadata.create_all(engine)

app = FastAPI()
app.include_router(auth.router)
app.include_router(resume_routes.router)
@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/health/db")
def health_db():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"db": "ok"}