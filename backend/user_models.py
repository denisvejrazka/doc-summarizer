from pydantic import BaseModel, EmailStr

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    tier: str = "standard"


class UserLogin(BaseModel):
    username: str
    password: str