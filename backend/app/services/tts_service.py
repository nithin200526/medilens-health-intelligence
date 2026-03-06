"""
app/services/tts_service.py
---------------------------
Text-to-Speech using gTTS (free, no API key).
Returns base64-encoded MP3.
"""
import io
import base64
from gtts import gTTS


def text_to_speech_b64(text: str, lang_code: str = "en") -> str:
    """
    Convert text to speech and return as base64-encoded MP3 string.

    Parameters
    ----------
    text      : str — the text to speak
    lang_code : str — BCP-47 language code (e.g. "en", "hi", "te")

    Returns
    -------
    str — base64-encoded MP3 audio
    """
    # Truncate very long text to avoid timeout
    if len(text) > 3000:
        text = text[:3000] + "... Please refer to the full written report for more details."

    tts = gTTS(text=text, lang=lang_code, slow=False)
    buffer = io.BytesIO()
    tts.write_to_fp(buffer)
    buffer.seek(0)
    audio_bytes = buffer.read()
    return base64.b64encode(audio_bytes).decode("utf-8")
