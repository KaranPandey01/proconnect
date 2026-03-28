from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, case
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

        # ---------------- CACHE CHECK ----------------
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
        models.Post.created_at,

        #  RANK SCORE
        (
            func.count(models.Like.post_id) /
            (func.extract('epoch', func.now() - models.Post.created_at) / 3600 + 2)
        ).label("score")
    )
    .join(models.User, models.Post.user_id == models.User.id)
    .outerjoin(models.Like, models.Like.post_id == models.Post.id)
    .group_by(
        models.Post.id,
        models.User.email,
        models.Post.created_at
    )
    .order_by(desc("score"))  #  MAIN CHANGE
    .offset(offset)
    .limit(limit)
    .all()
)

        # ---------------- RESPONSE ----------------
        result = []
        for row in posts:
            result.append({
                "id": row[0],
                "content": row[1],
                "user_id": row[2],
                "user_name": row[3],
                "like_count": int(row[4]) if row[4] else 0,
                "is_liked": bool(row[5])
            })

        # ---------------- CACHE STORE ----------------
        if r:
            r.setex(cache_key, 10, json.dumps(result))

        return result

    except Exception as e:
        print("FEED ERROR:", e)
        raise HTTPException(status_code=500, detail="Error fetching feed")