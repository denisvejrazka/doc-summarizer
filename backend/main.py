from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import llm_service
import preprocessor

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"]
)

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


@app.post("/summarize")
async def summarize(file: UploadFile = File(...)):
    text = await extract_text(file)
    stream_gen = await llm_service.get_summary(text)
    return StreamingResponse(stream_gen, media_type="text/plain")


@app.post("/count_tokens")
async def count_tokens(file: UploadFile = File(...)):
    text = await extract_text(file)
    tokens = await llm_service.get_tokens(text)
    return {"total_tokens": tokens}
