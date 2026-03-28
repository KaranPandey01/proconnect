from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, case
from jose import JWTError, jwt
from fastapi.middleware.cors import CORSMiddleware
from app.deps import get_current_user

from .database import engine, get_db
from . import models, schemas
from .security import (
    hash_password,
    verify_password,
    create_access_token,
    SECRET_KEY,
    ALGORITHM
)
from .cache import r
from app.feed import router as feed_router
from app.routes import comments  

# ---------------- INIT ----------------
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# ---------------- ROUTERS ----------------
app.include_router(feed_router)
app.include_router(comments.router)  


# ---------------- ROOT ----------------
@app.get("/")
def root():
    return {"message": "Server running"}


# ---------------- SIGNUP ----------------
@app.post("/signup")
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = hash_password(user.password)

    new_user = models.User(
        email=user.email,
        hashed_password=hashed_pw
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User created successfully"}


# ---------------- LOGIN ----------------
@app.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    db_user = db.query(models.User).filter(
        models.User.email == form_data.username
    ).first()

    if not db_user or not verify_password(form_data.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    access_token = create_access_token(
        data={"sub": db_user.email}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }



# ---------------- ME ----------------
@app.get("/me")
def read_users_me(current_user=Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email
    }


# ---------------- CREATE POST ----------------
@app.post("/posts")
def create_post(
    post: schemas.PostCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_post = models.Post(
        content=post.content,
        user_id=current_user.id
    )

    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    #  invalidate feed cache
    if r:
        for key in r.scan_iter("feed:*"):
            r.delete(key)

    return new_post


# ---------------- FOLLOW ----------------
@app.post("/follow/{user_id}")
def follow_user(
    user_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    follow = models.Follow(
        follower_id=current_user.id,
        following_id=user_id
    )

    try:
        db.add(follow)
        db.commit()
    except IntegrityError:
        db.rollback()

    if r:
        for key in r.scan_iter("feed:*"):
            r.delete(key)

    return {"message": "Followed successfully"}


# ---------------- UNFOLLOW ----------------
@app.delete("/follow/{user_id}")
def unfollow_user(
    user_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(models.Follow).filter(
        models.Follow.follower_id == current_user.id,
        models.Follow.following_id == user_id
    ).delete()

    db.commit()

    if r:
        for key in r.scan_iter("feed:*"):
            r.delete(key)

    return {"message": "Unfollowed successfully"}


# ---------------- LIKE (TOGGLE) ----------------
@app.post("/like/{post_id}")
def toggle_like(
    post_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = db.query(models.Like).filter(
        models.Like.user_id == current_user.id,
        models.Like.post_id == post_id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        action = "Unliked"
    else:
        like = models.Like(user_id=current_user.id, post_id=post_id)
        db.add(like)
        db.commit()
        action = "Liked"

    if r:
        for key in r.scan_iter("feed:*"):
            r.delete(key)

    return {"message": action}


# ---------------- FOLLOWERS COUNT ----------------
@app.get("/followers/count/{user_id}")
def get_followers_count(user_id: int, db: Session = Depends(get_db)):
    count = db.query(models.Follow).filter(
        models.Follow.following_id == user_id
    ).count()

    return {"followers": count}


# ---------------- USER POSTS (PROFILE) ----------------
@app.get("/users/{user_id}/posts")
def get_user_posts(
    user_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
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
        )
        .join(models.User, models.Post.user_id == models.User.id)
        .outerjoin(models.Like, models.Like.post_id == models.Post.id)
        .filter(models.Post.user_id == user_id)
        .group_by(models.Post.id, models.User.email)
        .order_by(models.Post.id.desc())
        .all()
    )

    return [
        {
            "id": p[0],
            "content": p[1],
            "user_id": p[2],
            "user_name": p[3],
            "like_count": p[4] or 0,
            "is_liked": bool(p[5]),
        }
        for p in posts
    ]


# ---------------- SEARCH USERS ----------------
@app.get("/search/users")
def search_users(query: str, db: Session = Depends(get_db)):
    users = db.query(models.User).filter(
        models.User.email.ilike(f"%{query}%")
    ).limit(10).all()

    return [
        {
            "id": u.id,
            "email": u.email
        }
        for u in users
    ]