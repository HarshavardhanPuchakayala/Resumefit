from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth import get_current_user
from db import get_db
from matching import match_resume
from models import Resume, User
from privacy import PrivacyError, build_ai_view

router = APIRouter(prefix="/match", tags=["match"])


class MatchRequest(BaseModel):
    job_description: str = Field(min_length=30, max_length=8000)


def _ai_view_for(user: User, db: Session) -> dict:
    resume = db.scalar(select(Resume).where(Resume.user_id == user.id))
    if resume is None:
        raise HTTPException(status_code=404, detail="Save your resume first")
    try:
        return build_ai_view(resume.contact, resume.content)
    except PrivacyError as error:
        raise HTTPException(status_code=422, detail=str(error))


@router.get("/ai-preview")
def ai_preview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return {"ai_view": _ai_view_for(current_user, db)}


@router.post("")
def match(
    data: MatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ai_view = _ai_view_for(current_user, db)
    return match_resume(data.job_description, ai_view)