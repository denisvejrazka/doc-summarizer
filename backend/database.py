from sqlmodel import create_engine, Session, SQLModel
from sqlalchemy import text

DATABASE_URL = "postgresql://denisvejrazka@localhost:5432/summarizer"
engine = create_engine(DATABASE_URL, echo=False)

def init_db():
    with Session(engine) as session:
        session.exec(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        session.commit()

    SQLModel.metadata.create_all(engine) # creates the table from models.py

def get_session():
    with Session(engine) as session:
        yield session