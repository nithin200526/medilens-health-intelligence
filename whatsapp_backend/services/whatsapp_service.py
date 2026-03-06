"""
services/whatsapp_service.py — WhatsApp Cloud API integration (Meta).

Implements:
    send_whatsapp_greeting()       — Welcome message on phone registration
    send_whatsapp_report()         — PDF report delivery
    send_analysis_ready_message()  — Companion text notification
"""
import logging
import requests
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
)
from config import WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_API_URL, MEDILENS_APP_URL

logger = logging.getLogger(__name__)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_api_url() -> str:
    """Build the WhatsApp messages endpoint URL."""
    return f"{WHATSAPP_API_URL}/{WHATSAPP_PHONE_NUMBER_ID}/messages"


def _headers() -> dict:
    """Auth headers for every WhatsApp API call."""
    return {
        "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }


def _handle_response(response: requests.Response, context: str) -> dict:
    """
    Parse and log WhatsApp API response.
    Raises ValueError on API-level errors (e.g. invalid token, bad number).
    """
    try:
        data = response.json()
    except Exception:
        data = {"raw": response.text}

    if response.status_code == 200:
        msg_id = data.get("messages", [{}])[0].get("id", "unknown")
        logger.info("[%s] ✅ Message sent | ID: %s", context, msg_id)
        return {"success": True, "message_id": msg_id, "raw": data}

    # API returned an error body
    error = data.get("error", {})
    error_msg = error.get("message", response.text)
    error_code = error.get("code", response.status_code)
    logger.error("[%s] ❌ WhatsApp API error %s: %s", context, error_code, error_msg)
    raise ValueError(f"WhatsApp API error {error_code}: {error_msg}")


# ── Retry decorator — up to 3 attempts with exponential back-off ──────────────

@retry(
    retry=retry_if_exception_type(requests.exceptions.RequestException),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    before_sleep=before_sleep_log(logger, logging.WARNING),
    reraise=True,
)
def _post_to_whatsapp(payload: dict, context: str) -> dict:
    """Make POST request to WhatsApp Cloud API with automatic retry."""
    url = _get_api_url()
    logger.debug("[%s] POST %s — payload: %s", context, url, payload)
    response = requests.post(url, headers=_headers(), json=payload, timeout=15)
    return _handle_response(response, context)


# ── Public Service Functions ──────────────────────────────────────────────────

def send_whatsapp_greeting(phone_number: str) -> dict:
    """
    Send a welcome greeting to a new user after they register their phone number.

    Args:
        phone_number: E.164 format (+91XXXXXXXXXX)

    Returns:
        dict with success status and WhatsApp message ID.
    """
    logger.info("Sending greeting to %s", phone_number)

    payload = {
        "messaging_product": "whatsapp",
        "to": phone_number,
        "type": "text",
        "text": {
            "body": (
                "Hello 👋 Welcome to *MediLens AI*.\n\n"
                "You can now upload your lab report and get instant, personalised health insights.\n\n"
                f"📤 Upload here: {MEDILENS_APP_URL}/upload\n\n"
                "_Your privacy is our priority. Reports are encrypted and visible only to you._"
            )
        },
    }

    try:
        result = _post_to_whatsapp(payload, context="GREETING")
        logger.info("Greeting delivered to %s | msg_id=%s", phone_number, result.get("message_id"))
        return result
    except Exception as exc:
        logger.error("Failed to send greeting to %s: %s", phone_number, exc)
        raise


def send_whatsapp_report(phone_number: str, pdf_url: str) -> dict:
    """
    Send the generated PDF analysis report to the user's WhatsApp.

    Args:
        phone_number: E.164 format
        pdf_url: Publicly accessible URL to the PDF file

    Returns:
        dict with success status and WhatsApp message ID.
    """
    logger.info("Sending PDF report to %s | url=%s", phone_number, pdf_url)

    payload = {
        "messaging_product": "whatsapp",
        "to": phone_number,
        "type": "document",
        "document": {
            "link": pdf_url,
            "caption": (
                "📊 *Your MediLens Health Analysis Report is Ready.*\n\n"
                "Please review the attached report for your personalised health insights.\n\n"
                "⚠️ _This report is for informational purposes. Please consult a doctor for medical advice._"
            ),
            "filename": "MediLens_Health_Report.pdf",
        },
    }

    try:
        result = _post_to_whatsapp(payload, context="REPORT_PDF")
        logger.info("Report delivered to %s | msg_id=%s", phone_number, result.get("message_id"))
        return result
    except Exception as exc:
        logger.error("Failed to send report to %s: %s", phone_number, exc)
        raise


def send_analysis_ready_message(phone_number: str) -> dict:
    """
    (Optional) Send a short text notification that the analysis is complete.
    Typically sent before the PDF so the user knows to expect it.

    Args:
        phone_number: E.164 format

    Returns:
        dict with success status and WhatsApp message ID.
    """
    logger.info("Sending analysis-ready notification to %s", phone_number)

    payload = {
        "messaging_product": "whatsapp",
        "to": phone_number,
        "type": "text",
        "text": {
            "body": (
                "✅ *Analysis Complete!*\n\n"
                "Your MediLens report analysis is complete.\n"
                "Your detailed report has been sent here — please check the document above.\n\n"
                f"🔗 View online: {MEDILENS_APP_URL}/dashboard/results"
            )
        },
    }

    try:
        result = _post_to_whatsapp(payload, context="ANALYSIS_READY")
        logger.info("Analysis-ready notification sent to %s", phone_number)
        return result
    except Exception as exc:
        logger.error("Failed to send analysis-ready to %s: %s", phone_number, exc)
        raise
