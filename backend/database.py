from sqlmodel import create_engine, Session, SQLModel
from sqlalchemy import text
from dotenv import load_dotenv
import os

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is missing! Check your .env file!")

engine = create_engine(DATABASE_URL, echo=False)

def init_db():
    with Session(engine) as session:
        session.exec(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        session.commit()

    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session