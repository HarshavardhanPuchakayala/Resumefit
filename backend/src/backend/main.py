import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

import ai_routes
import auth
import export_routes
import match_routes
import resume_routes
from db import engine
from models import Base

Base.metadata.create_all(engine)

app = FastAPI()

origins = [
    o.strip()
    for o in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(resume_routes.router)
app.include_router(match_routes.router)
app.include_router(ai_routes.router)
app.include_router(export_routes.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/health/db")
def health_db():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"db": "ok"}