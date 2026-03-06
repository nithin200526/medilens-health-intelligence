"""
app/api/upload.py  (v2 — dynamic LLM extraction + range analysis)
------------------------------------------------------------------
POST /api/upload — Full dynamic pipeline:
  1. Extract text from PDF
  2. LLM structures patient_info + panels
  3. Dynamic range analysis → highlight_map + risk

Returns structured_data suitable for both the dashboard and
the existing flat-tests analytics pipeline.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Optional

from app.services.pdf_parser       import parse_lab_pdf
from app.services.dynamic_analyzer import analyze_panels

router = APIRouter()


@router.post("/upload")
async def upload_reports(
    current_report:  UploadFile          = File(...),
    previous_report: Optional[UploadFile] = File(None),
):
    """
    Upload 1 or 2 PDF lab reports.
    Returns:
      - tests (flat dict for analytics pipeline)
      - structured_data (patient_info + panels)
      - dynamic_analysis (range analysis + highlight_map)
      - previous (same structure for prev report, or null)
      - parse_warnings
    """
    result = {
        "tests":            {},
        "structured_data":  {"patient_info": {}, "panels": []},
        "dynamic_analysis": {},
        "previous":         None,
        "parse_warnings":   [],
    }

    # ── Current Report ──────────────────────────────────────────────────────
    try:
        current_bytes = await current_report.read()
        tests_flat, structured, warnings = parse_lab_pdf(current_bytes)
        result["tests"]           = tests_flat
        result["structured_data"] = structured
        result["parse_warnings"].extend(warnings)

        # Dynamic range analysis (STEP 2)
        if structured.get("panels"):
            result["dynamic_analysis"] = analyze_panels(structured["panels"])

    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to process current report: {str(e)}")

    # ── Previous Report (optional) ──────────────────────────────────────────
    if previous_report:
        try:
            prev_bytes = await previous_report.read()
            prev_tests, prev_structured, prev_warnings = parse_lab_pdf(prev_bytes)
            result["previous"] = {
                "tests":           prev_tests,
                "structured_data": prev_structured,
            }
            result["parse_warnings"].extend([f"[Previous] {w}" for w in prev_warnings])
        except Exception as e:
            result["parse_warnings"].append(f"Could not process previous report: {e}")

    return result
