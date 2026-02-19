from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import llm_service
import preprocessor

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.post("/summarize")
async def summarize(file: UploadFile = File(...)):
    content = await file.read()

    if file.filename.endswith(".txt") or file.filename.endswith(".md"):
        text = content.decode("utf-8")
        summarized_text = await llm_service.get_llm_response(text) 
        return {"message": summarized_text}
    
    elif file.filename.endswith(".pdf"):
        pdf_text = preprocessor.process_pdf(content)
        summarized_text = await llm_service.get_llm_response(pdf_text) 
        return {"message": summarized_text}
    
    else:
        return {"message": f"Unsupported file format: {preprocessor.remove_f_type_prefix(file.content_type)}"}
