"""
app/api/tts.py
--------------
POST /api/tts — Convert text to speech using gTTS.
Returns base64-encoded MP3 audio.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.tts_service import text_to_speech_b64

router = APIRouter()

LANG_MAP = {
    "English": "en",
    "Hindi":   "hi",
    "Telugu":  "te",
    "Tamil":   "ta",
    "Spanish": "es",
}


class TTSRequest(BaseModel):
    text: str
    language: str = "English"


@router.post("/tts")
async def tts(req: TTSRequest):
    """Convert text to speech. Returns base64 MP3."""
    lang_code = LANG_MAP.get(req.language, "en")
    try:
        audio_b64 = text_to_speech_b64(req.text, lang_code)
        return {"audio_base64": audio_b64, "format": "mp3", "language": req.language}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS error: {str(e)}")
