"""
grok_client.py
--------------
LLM API client for the Medical Report Intelligence System.

Currently configured for Groq (groq.com) — free tier, OpenAI-compatible.
To switch to xAI Grok: change _BASE_URL and set GROK_API_KEY (xai-...) from console.x.ai.

Key Configuration:
  - Provider   : Groq (https://api.groq.com/openai/v1)
  - Model      : llama-3.3-70b-versatile (free, high quality)
  - Temperature: 0.2 (near-deterministic for medical safety)
  - Max Tokens : 1500 (controlled output length)

The client is intentionally minimal to keep it testable and swappable.
"""

import os
import time
import openai
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# ── Configuration ────────────────────────────────────────────────────────────
# Reads GROQ_API_KEY (Groq) or falls back to GROK_API_KEY (xAI Grok)
_GROK_API_KEY  = os.getenv("GROQ_API_KEY") or os.getenv("GROK_API_KEY", "")
_GROK_BASE_URL = "https://api.groq.com/openai/v1"
_PRIMARY_MODEL = os.getenv("GROK_MODEL", "llama-3.3-70b-versatile")
_FALLBACK_MODEL = "llama-3.1-8b-instant"
_TEMPERATURE   = float(os.getenv("GROK_TEMPERATURE", "0.2"))
_MAX_TOKENS    = int(os.getenv("GROK_MAX_TOKENS", "8000")) 

# Groq is fully OpenAI-compatible — same SDK, different base URL
_client = OpenAI(api_key=_GROK_API_KEY, base_url=_GROK_BASE_URL)


def call_grok(prompt: str, model: str = None) -> str:
    """
    Send a prompt to the LLM API and return the text response.
    Includes automatic fallback to 8b-instant if 70b is rate limited.
    """
    if not _GROK_API_KEY:
        raise RuntimeError("No API key found. Set GROQ_API_KEY in your .env file.")

    target_model = model or _PRIMARY_MODEL
    print(f"[DEBUG] call_grok: Target model is {target_model}")

    try:
        response = _client.chat.completions.create(
            model=target_model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a safe, grounded medical report explanation assistant. "
                        "You strictly follow the rules provided in the user prompt. "
                        "You never diagnose, never prescribe, and never invent medical facts."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            temperature=_TEMPERATURE,
            max_tokens=_MAX_TOKENS,
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        error_str = str(e)
        status_code = getattr(e, 'status_code', None)
        
        # Check if this is a 429 or Token Limit error
        if status_code == 429 or "429" in error_str or "rate limit" in error_str.lower():
            if target_model == _PRIMARY_MODEL:
                print(f"[FALLBACK] Rate limit hit on {target_model}. Retrying with {_FALLBACK_MODEL}...")
                time.sleep(1)
                return call_grok(prompt, model=_FALLBACK_MODEL)
            else:
                print(f"[ERROR] Rate limit hit on fallback model: {error_str}")
        
        print(f"[ERROR] API Call Failed inside call_grok: {error_str}")
        raise e
