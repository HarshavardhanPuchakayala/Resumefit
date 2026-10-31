import copy
import time
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth import get_current_user
from db import get_db
from llm import LLMError, complete_json
from match_routes import _ai_view_for as load_ai_view
from matching import match_resume
from models import Resume, User
from privacy import scrub_text
from suggest import build_prompt, collect_bullets, validate_suggestions

router = APIRouter(prefix="/ai", tags=["ai"])

CALL_LIMIT = 10
WINDOW_SECONDS = 3600
_calls: dict[int, list[float]] = {}


def _check_rate_limit(user_id: int) -> None:
    now = time.time()
    recent = [t for t in _calls.get(user_id, []) if now - t < WINDOW_SECONDS]
    if len(recent) >= CALL_LIMIT:
        raise HTTPException(status_code=429, detail="AI limit reached (10 per hour). Try again later.")
    recent.append(now)
    _calls[user_id] = recent


class SuggestRequest(BaseModel):
    job_description: str = Field(min_length=30, max_length=8000)
    preview_only: bool = False


class ApplyRequest(BaseModel):
    section: Literal["experience", "projects"]
    item_index: int = Field(ge=0, le=50)
    bullet_index: int = Field(ge=0, le=50)
    expected_original: str = Field(max_length=400)
    new_text: str = Field(min_length=10, max_length=400)


@router.post("/suggest")
def suggest(
    data: SuggestRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ai_view = load_ai_view(current_user, db)
    job_description = scrub_text(data.job_description, {})

    result = match_resume(job_description, ai_view)
    bullets = collect_bullets(ai_view)
    if not bullets:
        raise HTTPException(
            status_code=422,
            detail="Add bullets to Experience or Projects first. Bullets with personal details are skipped.",
        )

    prompt = build_prompt(job_description, bullets, result["matched"])
    if data.preview_only:
        return {"prompt_sent_to_ai": prompt}

    _check_rate_limit(current_user.id)
    try:
        raw, provider = complete_json(prompt)
    except LLMError as error:
        raise HTTPException(status_code=503, detail=str(error))

    suggestions = validate_suggestions(raw, bullets, set(result["matched"]))
    return {"provider": provider, "match": result, "suggestions": suggestions}


@router.post("/apply")
def apply_suggestion(
    data: ApplyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = db.scalar(select(Resume).where(Resume.user_id == current_user.id))
    if resume is None:
        raise HTTPException(status_code=404, detail="Save your resume first")

    content = copy.deepcopy(resume.content)
    try:
        bullets = content[data.section][data.item_index]["bullets"]
        current = bullets[data.bullet_index]
    except (KeyError, IndexError, TypeError):
        raise HTTPException(status_code=404, detail="That bullet no longer exists")

    if current != data.expected_original:
        raise HTTPException(status_code=409, detail="This bullet changed since the suggestion. Run it again.")

    bullets[data.bullet_index] = " ".join(data.new_text.split())
    resume.content = content
    db.commit()
    return {"status": "applied"}