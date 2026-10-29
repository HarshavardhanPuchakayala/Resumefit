from fastapi import FastAPI
from sqlalchemy import text
import auth
from db import engine
from models import Base

Base.metadata.create_all(engine)

app = FastAPI()
app.include_router(auth.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/health/db")
def health_db():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"db": "ok"}