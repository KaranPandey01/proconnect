from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, case
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, get_db
from app import models, schemas
from app.security import hash_password, verify_password, create_access_token
from app.deps import get_current_user
from app.cache import r
from app.feed import router as feed_router
from app.routes.comments import router as comments_router

print("DEPLOY CHECK - COMMENTS SHOULD WORK")
print(" DEPLOY CHECK V2 — IF YOU SEE THIS, CODE IS UPDATED ")

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
app.include_router(comments_router)

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

    new_user = models.User(
        email=user.email,
        hashed_password=hash_password(user.password)
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
    user = db.query(models.User).filter(
        models.User.email == form_data.username
    ).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token(data={"sub": user.email})

    return {
        "access_token": token,
        "token_type": "bearer"
    }

# ---------------- ME ----------------
@app.get("/me")
def get_me(current_user=Depends(get_current_user)):
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

    # 🔥 clear ALL feed cache (important fix)
    if r:
        for key in r.scan_iter("feed:*"):
            r.delete(key)

    return new_post

# ---------------- LIKE ----------------
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
        action = "Unliked"
    else:
        db.add(models.Like(user_id=current_user.id, post_id=post_id))
        action = "Liked"

    db.commit()

    # 🔥 clear cache
    if r:
        for key in r.scan_iter("feed:*"):
            r.delete(key)

    return {"message": action}

# ---------------- PROFILE POSTS ----------------
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
            models.Post.created_at
        )
        .join(models.User, models.Post.user_id == models.User.id)
        .outerjoin(models.Like, models.Like.post_id == models.Post.id)
        .filter(models.Post.user_id == user_id)
        .group_by(
            models.Post.id,
            models.Post.content,
            models.Post.user_id,
            models.User.email,
            models.Post.created_at
        )
        .order_by(models.Post.created_at.desc())
        .all()
    )

    return [
        {
            "id": p[0],
            "content": p[1],
            "user_id": p[2],
            "user_name": p[3],
            "like_count": int(p[4] or 0),
            "is_liked": bool(p[5]),
        }
        for p in posts
    ]

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

    return {"message": "Followed"}

# ---------------- SEARCH USERS ----------------
@app.get("/search/users")
def search_users(query: str, db: Session = Depends(get_db)):
    users = db.query(models.User).filter(
        models.User.email.ilike(f"%{query}%")
    ).limit(10).all()

    return [{"id": u.id, "email": u.email} for u in users]