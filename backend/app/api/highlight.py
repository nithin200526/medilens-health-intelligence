"""
app/api/highlight.py
--------------------
POST /api/highlight — Return colour-coded highlight map for all test results.

Output shape:
{
  "normal":   [{ "test": ..., "value": ..., "unit": ..., "highlight_color": "green" }],
  "borderline":[...],
  "high":     [{ ..., "highlight_color": "yellow", "reason": "..." }],
  "low":      [{ ..., "highlight_color": "blue",   "reason": "..." }],
  "critical": [{ ..., "highlight_color": "red",    "reason": "..." }]
}
"""
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

# Per-test critical thresholds (same as explanation_engine.py)
CRITICAL_THRESHOLDS = {
    "Hemoglobin":              {"max": 8.0,  "label": "Below 8 g/dL is critical low"},
    "LDL":                     {"min": 190,  "label": "Above 190 mg/dL is critically high"},
    "HbA1c":                   {"min": 9.0,  "label": "Above 9% indicates poor glycemic control"},
    "Blood Glucose (Fasting)": {"min": 300,  "label": "Above 300 mg/dL requires urgent care"},
    "Creatinine":              {"min": 3.0,  "label": "Above 3.0 suggests severe kidney stress"},
    "Platelets":               {"max": 50,   "label": "Below 50k/µL is critically low"},
    "WBC":                     {"min": 30000,"label": "Above 30k may indicate severe infection"},
    "TSH":                     {"min": 10.0, "label": "Above 10 mIU/L is critically high"},
}

BORDERLINE_TESTS = {"LDL", "Blood Glucose (Fasting)", "HbA1c"}  # can be expanded


class HighlightRequest(BaseModel):
    tests: dict  # { "TestName": { value, unit, status } }


@router.post("/highlight")
async def highlight(req: HighlightRequest):
    result = {"normal": [], "borderline": [], "high": [], "low": [], "critical": []}

    for name, d in req.tests.items():
        value  = d.get("value", 0)
        unit   = d.get("unit", "")
        status = d.get("status", "Normal")

        # Check critical thresholds first
        thresholds = CRITICAL_THRESHOLDS.get(name, {})
        is_critical = False
        crit_reason = ""
        if "min" in thresholds and float(value) >= thresholds["min"]:
            is_critical = True; crit_reason = thresholds["label"]
        if "max" in thresholds and float(value) <= thresholds["max"]:
            is_critical = True; crit_reason = thresholds["label"]

        entry = {"test": name, "value": f"{value} {unit}".strip(), "unit": unit}

        if is_critical:
            result["critical"].append({**entry, "highlight_color": "red",    "reason": crit_reason, "status": "CRITICAL"})
        elif status == "High":
            reason = f"{name} is above the normal reference range."
            if name in BORDERLINE_TESTS and float(value) < (CRITICAL_THRESHOLDS.get(name, {}).get("min", 9999) * 0.9):
                result["borderline"].append({**entry, "highlight_color": "orange", "reason": f"{name} is borderline high — monitor closely.", "status": "BORDERLINE"})
            else:
                result["high"].append({**entry, "highlight_color": "yellow", "reason": reason, "status": "HIGH"})
        elif status == "Low":
            result["low"].append({**entry, "highlight_color": "blue",   "reason": f"{name} is below the normal reference range.", "status": "LOW"})
        else:
            result["normal"].append({**entry, "highlight_color": "green", "reason": "Within reference range.", "status": "NORMAL"})

    return result
