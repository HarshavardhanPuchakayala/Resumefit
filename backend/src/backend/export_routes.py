from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth import get_current_user
from db import get_db
from export import build_blocks, build_docx, build_pdf
from models import Resume, User

router = APIRouter(prefix="/export", tags=["export"])

MEDIA_TYPES = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


@router.get("/{fmt}")
def download_resume(
    fmt: Literal["pdf", "docx"],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = db.scalar(select(Resume).where(Resume.user_id == current_user.id))
    if resume is None:
        raise HTTPException(status_code=404, detail="Save your resume first")

    blocks = build_blocks(resume.contact, resume.content)
    data = build_pdf(blocks) if fmt == "pdf" else build_docx(blocks)

    return Response(
        content=data,
        media_type=MEDIA_TYPES[fmt],
        headers={"Content-Disposition": f'attachment; filename="resume.{fmt}"'},
    )