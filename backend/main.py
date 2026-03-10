from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import llm_service
import preprocessor
from contextlib import asynccontextmanager
from database import init_db, get_session
from user_models import UserLogin, UserRegister
from db_models import User
from sqlmodel import select, Session, or_
import security_utils

# initialize the database
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# extract text (supports: .md, .pdf, .txt files)
async def extract_text(file: UploadFile = File(...)):
    content = await file.read()
    if file.filename.endswith(".txt") or file.filename.endswith(".md"):
        return content.decode("utf-8")
    elif file.filename.endswith(".pdf"):
        return preprocessor.process_pdf(content)
    else:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file format: {preprocessor.remove_f_type_prefix(file.content_type)}"
        )

# summarize endpoint
@app.post("/summarize")
async def summarize(file: UploadFile = File(...)):
    text = await extract_text(file)
    stream_gen = await llm_service.get_summary(text)
    return StreamingResponse(stream_gen, media_type="text/plain")


# gets the total tokens of inputted file
@app.post("/count_tokens")
async def count_tokens(file: UploadFile = File(...)):
    text = await extract_text(file)
    tokens = await llm_service.get_tokens(text)
    return {"total_tokens": tokens}


@app.post("/login")
async def login(user_data: UserLogin, session: Session = Depends(get_session)):
    statement = select(User).where(User.username == user_data.username)
    user = session.exec(statement).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not security_utils.verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid password")
    
    token = security_utils.create_access_token(data={"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}
    
    
@app.post("/register")
async def register(user_data: UserRegister, session: Session = Depends(get_session)):
    statement = select(User).where(or_(User.username == user_data.username, User.email == user_data.email))
    user_exists = session.exec(statement).first()
    
    if user_exists:
        raise HTTPException(status_code=400, detail="User already exists.")
    
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=security_utils.hash_password(user_data.password)
    )

    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    
    token = security_utils.create_access_token(data={"sub": new_user.username})
    return {"access_token": token, "token_type": "bearer"}
