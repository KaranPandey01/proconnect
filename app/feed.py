from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import List
from app.database import get_db
from app import models
from app.security import get_current_user
from app.cache import r
import json

router = APIRouter(prefix="/feed")


# ---------------- FEED ----------------
@router.get("/")
def get_feed(
    limit: int = 10,
    offset: int = 0,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        cache_key = f"feed:{current_user.id}:{limit}:{offset}"

        # -------- CACHE --------
        if r:
            cached = r.get(cache_key)
            if cached:
                return json.loads(cached)

        # -------- QUERY --------
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
                models.User.email
            )
            .order_by(models.Post.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        # -------- FORMAT --------
        result = [
            {
                "id": post.id,
                "content": post.content,
                "user_id": post.user_id,
                "user_name": post.email,
                "like_count": int(post.like_count or 0),
                "is_liked": bool(post.is_liked),
                "created_at": str(post.created_at)
            }
            for post in posts
        ]

        # -------- CACHE STORE --------
        if r:
            r.setex(cache_key, 10, json.dumps(result))

        return result

    except Exception as e:
        print("FEED ERROR:", e)
        raise HTTPException(status_code=500, detail="Error fetching feed")


# ---------------- USER POSTS (FIXES YOUR 404) ----------------
@router.get("/posts/user/{user_id}")
def get_user_posts(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    try:
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
            .filter(models.Post.user_id == user_id)
            .group_by(
                models.Post.id,
                models.User.email
            )
            .order_by(models.Post.created_at.desc())
            .all()
        )

        return [
            {
                "id": post.id,
                "content": post.content,
                "user_id": post.user_id,
                "user_name": post.email,
                "like_count": int(post.like_count or 0),
                "is_liked": bool(post.is_liked),
                "created_at": str(post.created_at)
            }
            for post in posts
        ]

    except Exception as e:
        print("USER POSTS ERROR:", e)
        raise HTTPException(status_code=500, detail="Error fetching user posts")