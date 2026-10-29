from fastapi import FastAPI, HTTPException
from sqlalchemy import text

from db import engine

app = FastAPI()


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/health/db")
def health_check_db():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception:
        raise HTTPException(status_code=503, detail="Database unavailable")
    return {"db": "ok"}