from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.deps import get_current_user

router = APIRouter(prefix="/comments", tags=["comments"])


@router.post("/")
def create_comment(
    post_id: int,
    content: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    comment = models.Comment(
        content=content,
        user_id=user.id,
        post_id=post_id
    )

    db.add(comment)
    db.commit()
    db.refresh(comment)

    return comment


@router.get("/{post_id}")
def get_comments(post_id: int, db: Session = Depends(get_db)):
    comments = db.query(models.Comment).filter(
        models.Comment.post_id == post_id
    ).all()

    return comments