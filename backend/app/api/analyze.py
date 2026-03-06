"""
app/api/analyze.py
------------------
POST /api/analyze — Full RAG + LLM pipeline.
POST /api/quick-analytics — Deterministic only (no LLM).
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from rag_engine.explanation_engine import (
    generate_report_explanation,
    compute_deterministic_analytics,
    detect_critical_alert,
    compute_confidence_score,
    compute_trend_comparison,
)

router = APIRouter()


class TestResult(BaseModel):
    value: float
    unit: str = ""
    status: str  # "High", "Low", "Normal"


class AnalyzeRequest(BaseModel):
    patient_age: int = Field(..., ge=1, le=120)
    patient_gender: str
    tests: dict[str, TestResult]
    overall_risk_level: str = "Moderate"
    mode: str = "patient"
    language: str = "English"
    previous_tests: Optional[dict[str, TestResult]] = None


@router.post("/analyze")
async def analyze(req: AnalyzeRequest):
    """Full pipeline: deterministic analytics + critical alert + RAG + LLM explanation."""
    try:
        tests_dict = {k: v.model_dump() for k, v in req.tests.items()}
        prev_dict  = (
            {k: v.model_dump() for k, v in req.previous_tests.items()}
            if req.previous_tests else None
        )
        result = generate_report_explanation(
            patient_age        = req.patient_age,
            patient_gender     = req.patient_gender,
            tests              = tests_dict,
            overall_risk_level = req.overall_risk_level,
            mode               = req.mode,
            language           = req.language,
            previous_tests     = prev_dict,
        )
        return {"success": True, **result}
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")


@router.post("/quick-analytics")
async def quick_analytics(req: AnalyzeRequest):
    """Instant deterministic analytics — no LLM call, no API cost."""
    tests_dict = {k: v.model_dump() for k, v in req.tests.items()}
    analytics  = compute_deterministic_analytics(tests_dict)
    alert      = detect_critical_alert(tests_dict)
    confidence = compute_confidence_score(tests_dict, analytics)
    trend = None
    if req.previous_tests:
        prev = {k: v.model_dump() for k, v in req.previous_tests.items()}
        trend = compute_trend_comparison(tests_dict, prev)
    return {"analytics": analytics, "alert": alert, "confidence": confidence, "trend": trend}
