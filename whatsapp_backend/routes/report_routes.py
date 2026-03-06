"""
routes/report_routes.py — Endpoints for report delivery via WhatsApp.

POST /api/report/analysis-complete
    Fetches the user's phone number from DB and sends the PDF via WhatsApp.
"""
import logging
from fastapi import APIRouter, HTTPException, status
from models.user_model import AnalysisCompleteRequest, AnalysisCompleteResponse
import database
from services.whatsapp_service import send_whatsapp_report, send_analysis_ready_message

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/report", tags=["Report"])


@router.post(
    "/analysis-complete",
    response_model=AnalysisCompleteResponse,
    status_code=status.HTTP_200_OK,
    summary="Send the completed analysis PDF to the user's WhatsApp",
)
async def analysis_complete(request: AnalysisCompleteRequest) -> AnalysisCompleteResponse:
    """
    Triggered after a lab report analysis is complete.

    Steps:
    1. Fetch the user's saved phone number from the database.
    2. Send an "analysis ready" text notification.
    3. Send the PDF report document.

    Returns 404 if the user has no saved phone number.
    Returns 502 if WhatsApp delivery fails.
    """
    user_id = request.user_id
    pdf_url = request.report_pdf_url

    logger.info("analysis_complete | user_id=%s | pdf_url=%s", user_id, pdf_url)

    # 1 — Fetch phone number from database
    try:
        phone = database.get_user_phone(user_id)
    except Exception as db_err:
        logger.error("DB error fetching phone for user_id=%s: %s", user_id, db_err)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database error: {db_err}",
        )

    if not phone:
        logger.warning("No phone number found for user_id=%s", user_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"No phone number registered for user_id '{user_id}'. "
                "Ask the user to save a phone number in Profile settings first."
            ),
        )

    # 2 — Send "analysis ready" text first (so it appears above the PDF)
    try:
        send_analysis_ready_message(phone)
    except Exception as wa_err:
        logger.warning(
            "Analysis-ready text failed for user_id=%s, continuing to send PDF: %s",
            user_id,
            wa_err,
        )
        # Non-fatal — continue to send the PDF

    # 3 — Send the PDF report document
    try:
        send_whatsapp_report(phone, pdf_url)
    except Exception as wa_err:
        logger.error(
            "PDF report delivery failed for user_id=%s | phone=%s: %s",
            user_id,
            phone,
            wa_err,
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to send PDF report via WhatsApp: {wa_err}",
        )

    logger.info("Report sent successfully to %s for user_id=%s", phone, user_id)
    return AnalysisCompleteResponse(
        status="sent",
        message="Report sent to WhatsApp.",
    )
