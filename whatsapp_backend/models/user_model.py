"""
models/user_model.py — Pydantic models for request/response validation.
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from utils.phone_validator import validate_phone_number


class UpdatePhoneRequest(BaseModel):
    user_id: str = Field(..., min_length=1, description="Unique user identifier")
    phone_number: str = Field(..., description="Phone number in E.164 format (+91XXXXXXXXXX)")

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        ok, result = validate_phone_number(v)
        if not ok:
            raise ValueError(result)
        return result  # normalized number


class UpdatePhoneResponse(BaseModel):
    status: str
    message: str
    phone_number: Optional[str] = None


class AnalysisCompleteRequest(BaseModel):
    user_id: str = Field(..., min_length=1, description="Unique user identifier")
    report_pdf_url: str = Field(..., description="Publicly accessible URL to the PDF report")

    @field_validator("report_pdf_url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        if not v.startswith("http"):
            raise ValueError("report_pdf_url must be a valid HTTP/HTTPS URL")
        return v


class AnalysisCompleteResponse(BaseModel):
    status: str
    message: str


class UserRecord(BaseModel):
    """Internal DB record shape."""
    user_id: str
    phone_number: Optional[str] = None
    created_at: Optional[str] = None
