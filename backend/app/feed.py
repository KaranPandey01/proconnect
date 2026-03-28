from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.database import get_db
from app import models
from app.security import get_current_user
from app.cache import r
import json

router = APIRouter()


@router.get("/feed")
def get_feed(
    limit: int = 10,
    offset: int = 0,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        cache_key = f"feed:{current_user.id}:{limit}:{offset}"

        # ---------------- CACHE ----------------
        if r:
            cached = r.get(cache_key)
            if cached:
                return json.loads(cached)

        # ---------------- QUERY ----------------
        posts = (
            db.query(
                models.Post.id,
                models.Post.content,
                models.Post.user_id,
                models.User.email,
                func.count(models.Like.post_id).label("like_count"),
                func.max(
                    case(
                        (models.Like.user_id == current_user.id, 1),
                        else_=0
                    )
                ).label("is_liked"),
                models.Post.created_at
            )
            .join(models.User, models.Post.user_id == models.User.id)
            .outerjoin(models.Like, models.Like.post_id == models.Post.id)
            .group_by(
                models.Post.id,
                models.Post.content,
                models.Post.user_id,
                models.User.email,
                models.Post.created_at
            )
            .order_by(models.Post.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        # ---------------- FORMAT ----------------
        result = []
        for row in posts:
            result.append({
                "id": row.id,
                "content": row.content,
                "user_id": row.user_id,
                "user_name": row.email,
                "like_count": int(row.like_count or 0),
                "is_liked": bool(row.is_liked)
            })

        # ---------------- CACHE STORE ----------------
        if r:
            r.setex(cache_key, 10, json.dumps(result))

        return result

    except Exception as e:
        print("FEED ERROR:", e)
        raise HTTPException(status_code=500, detail="Error fetching feed")