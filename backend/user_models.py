from pydantic import BaseModel, EmailStr

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    tier: str = "standard"


class UserLogin(BaseModel):
    username: str
    password: str


class SearchRequest(BaseModel):
    document_id: int
    query: str
    mode: str = "standard"