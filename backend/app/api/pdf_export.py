"""
app/api/pdf_export.py
---------------------
POST /api/generate-pdf — Generate a formatted PDF health report.
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import io
import json

from app.services.pdf_generator import generate_health_pdf, DEFAULT_LABELS
from rag_engine.translation_service import translate_report_data

router = APIRouter()


class PDFRequest(BaseModel):
    patient_info: dict
    tests: dict
    analytics: dict
    alert: dict
    confidence: dict
    trend: Optional[dict] = None
    card_explanations: list = []
    dynamic_analysis: dict = {}
    language: str = "English"
    mode: str = "patient"


@router.post("/generate-pdf")
async def generate_pdf(req: PDFRequest):
    """Generate and return a multilingual downloadable PDF health report."""
    try:
        payload = req.model_dump()
        target_lang = payload.get("language", "English")
        
        # 1. Inject default labels if not present so they get translated
        if "labels" not in payload or not payload["labels"]:
            payload["labels"] = DEFAULT_LABELS.copy()

        # 2. Translate the entire payload using the unified service
        translated_payload = translate_report_data(payload, target_lang)
        
        # 3. Use the translated labels (which now definitely contain all keys)
        labels = translated_payload.get("labels", DEFAULT_LABELS.copy())
        
        # 4. Generate PDF with the fully translated data
        pdf_bytes = generate_health_pdf(translated_payload, labels=labels)
        
        # URL safe filename
        safe_lang = "".join(c for c in target_lang if c.isalnum())
        filename = f"MediLens_Health_Report_{safe_lang}.pdf"
        
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"PDF generation error: {str(e)}")
