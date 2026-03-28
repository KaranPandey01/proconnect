from pydantic import BaseModel, EmailStr, Field
from pydantic import BaseModel

class CommentCreate(BaseModel):
    content: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)
class UserLogin(BaseModel):
    email: EmailStr
    password: str
class PostCreate(BaseModel):
    content: str