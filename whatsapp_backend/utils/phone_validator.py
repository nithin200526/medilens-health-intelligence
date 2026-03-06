"""
utils/phone_validator.py — Phone number validation utilities.
"""
import re
import logging

logger = logging.getLogger(__name__)

# Supported formats: +91XXXXXXXXXX, +1XXXXXXXXXX, etc.
# WhatsApp requires E.164 format with country code
E164_PATTERN = re.compile(r"^\+[1-9]\d{6,14}$")

# India-specific pattern (used for extra hints in error messages)
INDIA_PATTERN = re.compile(r"^\+91[6-9]\d{9}$")


def validate_phone_number(phone: str) -> tuple[bool, str]:
    """
    Validate a phone number string.

    Returns:
        (True, normalized_number) on success
        (False, error_message) on failure
    """
    if not phone:
        return False, "Phone number cannot be empty."

    # Strip spaces and dashes
    cleaned = phone.replace(" ", "").replace("-", "").strip()

    # Must start with +
    if not cleaned.startswith("+"):
        return False, (
            "Phone number must start with '+' followed by country code. "
            "Example: +91 98765 43210"
        )

    if not E164_PATTERN.match(cleaned):
        return False, (
            f"'{phone}' is not a valid E.164 phone number. "
            "Format: +[country code][number], e.g. +919876543210"
        )

    logger.debug("Phone number validated: %s", cleaned)
    return True, cleaned


def normalize_phone(phone: str) -> str:
    """Return normalized E.164 phone number. Strips spaces and dashes."""
    return phone.replace(" ", "").replace("-", "").strip()
