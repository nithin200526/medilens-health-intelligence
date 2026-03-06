
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
"""
main.py — MediLens Backend Entry Point
"""
from dotenv import load_dotenv
import os
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.api import upload, analyze, tts, pdf_export, chat, highlight, report, translate

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(
    title="MediLens API",
    description="Grounded Medical Report Intelligence — PDF parsing, RAG analysis, TTS, PDF export, Interactive Q&A.",
    version="1.1.0",
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"DEBUG: Incoming request: {request.method} {request.url}")
    response = await call_next(request)
    print(f"DEBUG: Response status: {response.status_code}")
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router,     prefix="/api", tags=["Upload"])
app.include_router(analyze.router,    prefix="/api", tags=["Analyze"])
app.include_router(tts.router,        prefix="/api", tags=["TTS"])
app.include_router(pdf_export.router, prefix="/api", tags=["PDF Export"])
app.include_router(chat.router,       prefix="/api", tags=["Chat Q&A"])
app.include_router(highlight.router,  prefix="/api", tags=["Highlight"])
app.include_router(report.router,     prefix="/api", tags=["Report Analysis"])
app.include_router(translate.router,  prefix="/api", tags=["Translation"])



@app.get("/health")
async def health():
    return {"status": "ok", "system": "MediLens v1.0"}


if __name__ == "__main__":
    # Watch both the local app and the shared engine for changes
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8001, 
        reload=True,
        reload_dirs=["app", "../rag_engine"]
    )
