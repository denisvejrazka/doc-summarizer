from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import llm_service
import preprocessor
from contextlib import asynccontextmanager
from database import init_db, get_session
from models import UserLogin, UserRegister, SearchRequest
from db_models import User, Document, DocumentChunk
from sqlmodel import select, Session, or_
import security_utils
from datetime import datetime, timezone

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

async def get_document_file(file: UploadFile):
    content = await file.read()
    try:
        return preprocessor.process_file(file.filename, content)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format: {preprocessor.remove_f_type_prefix(file.content_type)}"
        )

# summarize endpoint
@app.post("/summarize")
async def summarize(file: UploadFile = File(...), current_user: User = Depends(security_utils.get_current_user)):
    doc_file = await get_document_file(file)
    text = doc_file.content
    tokens = await llm_service.get_tokens(text)

    if current_user.tier == "standard" and tokens > 15000:
        raise HTTPException(status_code=403, 
                            detail=f"Your document reached the maximum allowed token limit of the standard tier. ({tokens})")

    stream_gen = await llm_service.get_summary(text)
    return StreamingResponse(stream_gen, media_type="text/plain")


# gets the total tokens of inputted file
@app.post("/count_tokens")
async def count_tokens(file: UploadFile = File(...)):
    doc_file = await get_document_file(file)
    tokens = await llm_service.get_tokens(doc_file.content)
    return {"total_tokens": tokens}


@app.post("/upload")
async def upload_document(file: UploadFile = File(...),
                          session: Session = Depends(get_session),
                          current_user: User = Depends(security_utils.get_current_user)):
    doc_file = await get_document_file(file)
    tokens = await llm_service.get_tokens(doc_file.content)

    if current_user.tier == "standard" and tokens > 15000:
        raise HTTPException(status_code=403,
                            detail=f"Your document reached the maximum allowed token limit of the standard tier. ({tokens})")

    chunks = []
    for chunk in doc_file.chunks:
        embedding = await llm_service.embed(chunk.content, "RETRIEVAL_DOCUMENT")
        chunks.append(DocumentChunk(
            content=chunk.content,
            embedding=embedding,
            chunk_metadata=chunk.metadata
        ))

    doc = Document(
        filename=doc_file.filename,
        file_type=doc_file.file_type,
        user_id=current_user.id,
        upload_date=datetime.now(timezone.utc),
        tokens=tokens,
        chunks=chunks,
        content=doc_file.content,
    )

    session.add(doc)
    session.commit()
    session.refresh(doc)

    return {"document_id": doc.id}


@app.post("/login")
async def login(user_data: UserLogin, session: Session = Depends(get_session)):
    statement = select(User).where(User.username == user_data.username)
    user = session.exec(statement).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not security_utils.verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid password")
    
    token = security_utils.create_access_token(data={"sub": user.username, "tier": user.tier})
    return {"access_token": token, "token_type": "bearer", "tier": user.tier}
    
    
@app.post("/register")
async def register(user_data: UserRegister, session: Session = Depends(get_session)):
    statement = select(User).where(or_(User.username == user_data.username, User.email == user_data.email))
    user_exists = session.exec(statement).first()
    
    if user_exists:
        raise HTTPException(status_code=400, detail="User already exists.")
    
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=security_utils.hash_password(user_data.password),
        tier=user_data.tier
    )

    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    
    token = security_utils.create_access_token(data={"sub": new_user.username, "tier": new_user.tier})
    return {"access_token": token, "token_type": "bearer", "tier": new_user.tier}


@app.post("/search")
async def search(search_req: SearchRequest, current_user: User = Depends(security_utils.get_current_user), session: Session = Depends(get_session)):
    statement = select(Document).where(Document.id == search_req.document_id)
    doc = session.exec(statement).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied to this document")
    
    if search_req.mode == "standard":
        stream_gen = await llm_service.standard_search(search_req.query, doc.content)
        return StreamingResponse(stream_gen, media_type="text/plain")
    else:
        pass