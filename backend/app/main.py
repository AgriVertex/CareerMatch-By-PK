from io import BytesIO
import fitz
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .analyzer import analyze, extract_skills

app = FastAPI(
    title="CareerMatch AI API",
    version="1.0.0",
    description="Starter API for resume analysis and job matching."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MatchRequest(BaseModel):
    resume_text: str
    job_description: str

def extract_pdf_text(data: bytes) -> str:
    try:
        document = fitz.open(stream=data, filetype="pdf")
        text = "\n".join(page.get_text() for page in document)
        document.close()
        return text.strip()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not read PDF: {exc}")

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "CareerMatch AI"}

@app.post("/api/resume/upload")
async def upload_resume(file: UploadFile = File(...)):
    is_pdf = (file.content_type and "pdf" in file.content_type.lower()) or (
        file.filename and file.filename.lower().endswith(".pdf")
    )
    if not is_pdf:
        raise HTTPException(status_code=400, detail="Please upload a PDF resume.")
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Resume must be smaller than 5 MB.")

    text = extract_pdf_text(data)
    if len(text) < 30:
        raise HTTPException(
            status_code=400,
            detail="Very little text was extracted. Use a text-based PDF rather than a scanned image."
        )

    skills = extract_skills(text)
    return {
        "filename": file.filename,
        "text": text,
        "skills": skills,
        "character_count": len(text),
    }

@app.post("/api/match")
def match_job(request: MatchRequest):
    if len(request.resume_text.strip()) < 30:
        raise HTTPException(status_code=400, detail="Resume text is too short.")
    if len(request.job_description.strip()) < 30:
        raise HTTPException(status_code=400, detail="Job description is too short.")
    return analyze(request.resume_text, request.job_description)
