from pydantic import BaseModel, EmailStr
from typing import Optional

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


class Chunk(BaseModel):
    content: str
    chunk_index: int
    metadata: Optional[str] = None


class DocumentFile(BaseModel):
    filename: str
    file_type: str
    content: str
    chunks: list[Chunk]
    

    