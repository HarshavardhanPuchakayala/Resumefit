from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_user
from db import get_db
from models import Resume, User
from resume_schemas import ResumeData

router = APIRouter(prefix="/resume", tags=["resume"])


def _find_resume(db: Session, user_id: int) -> Resume | None:
    return db.scalar(select(Resume).where(Resume.user_id == user_id))


@router.get("", response_model=ResumeData)
def get_resume(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = _find_resume(db, current_user.id)
    if resume is None:
        return ResumeData()
    return ResumeData.model_validate(
        {"contact": resume.contact, "content": resume.content}
    )


@router.put("", response_model=ResumeData)
def save_resume(
    data: ResumeData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    contact = data.contact.model_dump()
    content = data.content.model_dump()

    resume = _find_resume(db, current_user.id)
    if resume is None:
        resume = Resume(user_id=current_user.id, contact=contact, content=content)
        db.add(resume)
    else:
        resume.contact = contact
        resume.content = content

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Resume was saved at the same time, try again")

    return data