"""
app/api/translate.py
---------------------
POST /api/translate — Translate report results JSON into target language.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json
import re
from rag_engine.translation_service import translate_report_data

router = APIRouter()

class TranslateRequest(BaseModel):
    data: dict
    target_lang: str

@router.post("/translate")
async def translate_report(req: TranslateRequest):
    """Translate the vital parts of the report data for the UI."""
    return translate_report_data(req.data, req.target_lang)
