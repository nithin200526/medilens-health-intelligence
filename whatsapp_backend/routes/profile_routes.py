"""
routes/profile_routes.py — Endpoints for user profile management.

POST /api/profile/update-phone
    Validates phone number, saves to DB, and triggers WhatsApp greeting.
"""
import logging
from fastapi import APIRouter, HTTPException, status
from models.user_model import UpdatePhoneRequest, UpdatePhoneResponse
import database
from services.whatsapp_service import send_whatsapp_greeting

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/profile", tags=["Profile"])


@router.post(
    "/update-phone",
    response_model=UpdatePhoneResponse,
    status_code=status.HTTP_200_OK,
    summary="Save user phone number and send WhatsApp greeting",
)
async def update_phone(request: UpdatePhoneRequest) -> UpdatePhoneResponse:
    """
    Save the user's phone number and send a WhatsApp greeting.

    - Phone number is validated in the Pydantic model (E.164 format required).
    - Saves to the `whatsapp_users` table in PostgreSQL.
    - Fires a WhatsApp welcome message via the Cloud API.

    Returns 200 on success, 502 if WhatsApp delivery fails.
    """
    user_id = request.user_id
    phone = request.phone_number  # Already normalized by Pydantic validator

    logger.info("update_phone | user_id=%s phone=%s", user_id, phone)

    # 1 — Persist to database
    try:
        database.upsert_user_phone(user_id, phone)
    except Exception as db_err:
        logger.error("DB error for user_id=%s: %s", user_id, db_err)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database error: {db_err}",
        )

    # 2 — Send WhatsApp greeting (best-effort; DB save already succeeded)
    whatsapp_status = "✅ delivered"
    try:
        send_whatsapp_greeting(phone)
    except Exception as wa_err:
        # Log but don't fail the endpoint — phone was saved successfully
        logger.warning(
            "Phone saved for user_id=%s but WhatsApp greeting failed: %s",
            user_id,
            wa_err,
        )
        whatsapp_status = f"⚠️ greeting failed ({wa_err})"
        # Raise a 502 so the caller knows the message wasn't sent
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                f"Phone number saved, but WhatsApp greeting failed: {wa_err}. "
                "Check WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID."
            ),
        )

    logger.info(
        "update_phone complete | user_id=%s | whatsapp=%s",
        user_id,
        whatsapp_status,
    )
    return UpdatePhoneResponse(
        status="success",
        message="Phone number saved and greeting sent.",
        phone_number=phone,
    )
