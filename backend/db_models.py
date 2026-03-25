from pgvector.sqlalchemy import Vector
from sqlmodel import SQLModel, Field, Relationship, Column
from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy import Text


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    username: str = Field(unique=True, index=True)
    hashed_password: str
    tier: str = Field(default="standard")
    documents: List["Document"] = Relationship(back_populates="user")


class Document(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    filename: str
    file_type: str
    upload_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    user_id: int = Field(foreign_key="user.id")
    user: User = Relationship(back_populates="documents")
    tokens: int
    content: str = Field(sa_column=Column(Text))
    chunks: List["DocumentChunk"] = Relationship(back_populates="document",
                                                 sa_relationship_kwargs={"cascade": "all, delete-orphan"})


class DocumentChunk(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    content: str 
    chunk_metadata: Optional[str] = Field(default=None)
    embedding: List[float] = Field(sa_column=Column(Vector(768))) 
    document_id: int = Field(foreign_key="document.id")
    document: Document = Relationship(back_populates="chunks")