"""
config.py — Loads all environment variables using python-dotenv.
"""
import os
from dotenv import load_dotenv

load_dotenv()

WHATSAPP_ACCESS_TOKEN: str = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
WHATSAPP_PHONE_NUMBER_ID: str = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
WHATSAPP_API_URL: str = os.getenv("WHATSAPP_API_URL", "https://graph.facebook.com/v19.0")
DATABASE_URL: str = os.getenv("DATABASE_URL", "")
MEDILENS_APP_URL: str = os.getenv("MEDILENS_APP_URL", "https://medilens.ai")

# Validate at startup
def validate_config() -> None:
    missing = []
    if not WHATSAPP_ACCESS_TOKEN:
        missing.append("WHATSAPP_ACCESS_TOKEN")
    if not WHATSAPP_PHONE_NUMBER_ID:
        missing.append("WHATSAPP_PHONE_NUMBER_ID")
    if not DATABASE_URL:
        missing.append("DATABASE_URL")
    if missing:
        raise EnvironmentError(
            f"Missing required environment variables: {', '.join(missing)}\n"
            "Please fill them in whatsapp_backend/.env"
        )
