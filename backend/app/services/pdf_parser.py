"""
app/services/pdf_parser.py  (v2 — fully dynamic LLM-based extraction)
----------------------------------------------------------------------
STEP 1: Extract raw text from PDF using pdfplumber.
STEP 2: Pass text to Groq LLM with a structured extraction prompt.
        The LLM identifies ALL parameters dynamically — no hardcoded test list.
        Returns: { patient_info, panels }

Fallback: if PDF has no extractable text (scanned), returns empty with warning.
"""
import io
import json
import re
from typing import Tuple

import pdfplumber
from rag_engine.grok_client import call_grok


# ── STEP 1: Document Intelligence ────────────────────────────────────────────
def _extract_text(pdf_bytes: bytes) -> Tuple[str, list]:
    """Extract all text from PDF. Returns (full_text, warnings)."""
    warnings = []
    pages_text = []

    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            n_pages = len(pdf.pages)
            for i, page in enumerate(pdf.pages):
                text = page.extract_text()
                if text:
                    pages_text.append(f"[PAGE {i+1}]\n{text}")
                else:
                    warnings.append(f"Page {i+1} of {n_pages}: No extractable text (possibly scanned).")
    except Exception as e:
        return "", [f"PDF read error: {e}"]

    full_text = "\n\n".join(pages_text)
    if not full_text.strip():
        warnings.append(
            "No text could be extracted from this PDF. "
            "It may be a scanned image — text-based PDFs work best. "
            "Please enter your values manually."
        )
    return full_text, warnings


# ── STEP 2: Dynamic Extraction Prompt ────────────────────────────────────────
EXTRACTION_PROMPT = """You are a Medical Report Extraction Engine.

Analyze the following medical lab report text carefully.

TASK:
1. Extract Patient Information:
   - Full Name (or "Unknown" if not present)
   - Age (number only, or null)
   - Gender (or null)
   - Report Date (or null)
   - Lab Name (or null)
   - Referring Doctor (or null)

2. Extract ALL Test Panels (CBC, Lipid Profile, Thyroid, etc.)
   Group tests by logical panel if identifiable.

3. For EVERY test parameter:
   - parameter: exact name as written in report
   - value: measured value (string)
   - unit: unit of measurement (or null)
   - reference_range: exactly as written (or null if not provided)
   - lab_flag: "H", "L", "CRITICAL", "NORMAL", or null if not marked
   - comment: any lab comment for this test (or null)

4. Do NOT skip any parameter.
5. Preserve exact spelling.
6. If multiple pages, extract from all.

Return ONLY valid JSON in this exact format:
{
  "patient_info": {
    "name": "",
    "age": null,
    "gender": null,
    "report_date": null,
    "lab_name": null,
    "doctor": null
  },
  "panels": [
    {
      "panel_name": "Panel Name or General",
      "tests": [
        {
          "parameter": "",
          "value": "",
          "unit": null,
          "reference_range": null,
          "lab_flag": null,
          "comment": null
        }
      ]
    }
  ],
  "warnings": []
}

RAW REPORT TEXT:
---
{report_text}
---
"""


def _llm_extract(raw_text: str) -> Tuple[dict, list]:
    """Send raw PDF text to Groq for dynamic structured extraction."""
    if not raw_text.strip():
        return {"patient_info": {}, "panels": []}, ["No text to extract."]

    # Truncate to avoid token limits (keep first 6000 chars as it has most data)
    truncated = raw_text[:6000]
    if len(raw_text) > 6000:
        truncated += "\n[... report continues, truncated for extraction ...]"

    prompt = EXTRACTION_PROMPT.replace("{report_text}", truncated)

    try:
        raw_response = call_grok(prompt)
    except Exception as e:
        return {"patient_info": {}, "panels": []}, [f"LLM extraction failed: {e}"]

    # Parse JSON from response
    try:
        # Strip markdown code fences if present
        cleaned = re.sub(r"```(?:json)?", "", raw_response).replace("```", "").strip()
        data = json.loads(cleaned)
        warnings = data.get("warnings", [])
        return data, warnings
    except json.JSONDecodeError:
        # Try to find JSON block in response
        match = re.search(r"\{[\s\S]*\}", raw_response)
        if match:
            try:
                data = json.loads(match.group())
                return data, []
            except Exception:
                pass
        return {"patient_info": {}, "panels": []}, [
            "LLM returned non-JSON response. Try a different PDF or manual entry."
        ]


# ── STEP 3: Flatten panels into tests dict (for backward compatibility) ───────
def _flatten_to_tests(panels: list) -> dict:
    """
    Convert panel structure → flat { "TestName": {value, unit, status} }
    for compatibility with existing analytics / explanation pipeline.
    """
    tests = {}
    for panel in panels:
        for t in panel.get("tests", []):
            name  = t.get("parameter", "").strip()
            value = t.get("value", "")
            unit  = t.get("unit") or ""
            flag  = (t.get("lab_flag") or "").upper().strip()

            # Convert numeric value
            try:
                num_val = float(re.sub(r"[^\d.\-]", "", value))
            except Exception:
                continue  # skip non-numeric

            # Map lab flag → status
            if flag in ("H", "HIGH", "CRITICAL"):
                status = "High"
            elif flag in ("L", "LOW"):
                status = "Low"
            else:
                # Try to infer from reference range
                ref = t.get("reference_range")
                status = _infer_status(num_val, ref)

            if name:
                tests[name] = {"value": num_val, "unit": unit, "status": status}

    return tests


def _infer_status(value: float, ref: str | None) -> str:
    """Infer Normal/High/Low from reference range string like '4.0-11.0' or '<200'."""
    if not ref:
        return "Normal"
    try:
        # Range: "4.0 - 11.0" or "4.0-11.0"
        m = re.match(r"(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)", str(ref))
        if m:
            lo, hi = float(m.group(1)), float(m.group(2))
            if value < lo:   return "Low"
            if value > hi:   return "High"
            return "Normal"
        # Less than: "<200"
        m = re.match(r"<\s*(\d+\.?\d*)", str(ref))
        if m and value >= float(m.group(1)): return "High"
        # Greater than: ">3.5"
        m = re.match(r">\s*(\d+\.?\d*)", str(ref))
        if m and value <= float(m.group(1)): return "Low"
    except Exception:
        pass
    return "Normal"


# ── Public API ────────────────────────────────────────────────────────────────
def parse_lab_pdf(pdf_bytes: bytes) -> Tuple[dict, dict, list]:
    """
    Full dynamic PDF parsing pipeline.

    Returns
    -------
    (tests_flat, structured_data, warnings)

    tests_flat    : { "TestName": {value, unit, status} }  — for analytics pipeline
    structured_data: { patient_info, panels }              — for display & chat
    warnings      : list of strings
    """
    # Step 1: Extract text
    raw_text, text_warnings = _extract_text(pdf_bytes)

    if not raw_text.strip():
        return {}, {"patient_info": {}, "panels": []}, text_warnings

    # Step 2: LLM dynamic extraction
    structured, llm_warnings = _llm_extract(raw_text)

    all_warnings = text_warnings + llm_warnings

    # Step 3: Flatten for analytics pipeline
    panels    = structured.get("panels", [])
    tests_flat = _flatten_to_tests(panels)

    if not tests_flat:
        all_warnings.append(
            "Could not extract numeric values from the report. Please enter values manually."
        )

    return tests_flat, structured, all_warnings
