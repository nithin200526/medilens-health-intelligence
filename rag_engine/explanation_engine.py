"""
explanation_engine.py
---------------------
Main orchestrator for the Grounded Medical Report Intelligence System.

Pipeline:
  1. Deterministic analytics   → counts, risk classification (no AI)
  2. Critical Alert Detection  → threshold-based emergency escalation (no AI)
  3. Confidence Scoring        → rule-based AI confidence metric (no AI)
  4. RAG retrieval             → grounded context from knowledge base (no AI)
  5. Prompt construction       → controlled master prompt with emergency flag
  6. LLM API call              → constrained explanation generation
  7. Safety filter             → blocks diagnosis-seeking queries

Supports:
  - Patient Mode  : plain-language explanation
  - Doctor Mode   : clinical structured summary
  - Multilingual  : English, Hindi, Telugu
  - Trend Mode    : comparative analysis between two reports
"""

from rag_engine.retriever import retrieve_context
from rag_engine.prompt_template import build_prompt, ModeType, LanguageType
from rag_engine.grok_client import call_grok

# ── Privacy Statement (UPGRADE 3) ───────────────────────────────────────────
PRIVACY_STATEMENT = (
    "\n🔒 PRIVACY NOTICE\n"
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
    "No patient data is stored or transmitted beyond this session.\n"
    "All processing occurs in-session. No data is retained after use.\n"
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
)

# ── Safety guardrail keywords ────────────────────────────────────────────────
_DIAGNOSIS_KEYWORDS = [
    "what disease", "do i have", "am i sick", "diagnose me",
    "what is wrong with me", "is it cancer", "should i take",
    "what medicine", "prescribe", "cure", "treatment for my",
]

_SAFE_REFUSAL_MESSAGE = (
    "\n⚠️  SAFETY NOTICE\n"
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
    "I cannot provide a medical diagnosis or prescribe medications.\n"
    "Please consult a qualified and licensed healthcare professional\n"
    "for any medical concerns.\n"
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
)

# ── Critical Alert Thresholds (UPGRADE 1) ───────────────────────────────────
_CRITICAL_THRESHOLDS = {
    "Hemoglobin"            : {"Low":  {"max": 8.0}},
    "LDL"                   : {"High": {"min": 190}},
    "HbA1c"                 : {"High": {"min": 9.0}},
    "Blood Glucose (Fasting)": {"High": {"min": 200}},
    "Creatinine"            : {"High": {"min": 3.0}},
    "Platelets"             : {"Low":  {"max": 50000}},
    "WBC"                   : {"Low":  {"max": 2000}},
    "TSH"                   : {"High": {"min": 10.0}, "Low": {"max": 0.1}},
}

_SEVERE_ABNORMAL_COUNT_THRESHOLD = 3  # ≥ 3 abnormal triggers critical


def _safety_check(user_query: str) -> bool:
    """Return True if the query appears to be seeking a diagnosis or prescription."""
    q = user_query.lower()
    return any(keyword in q for keyword in _DIAGNOSIS_KEYWORDS)


# ── UPGRADE 1: Critical Alert Detection ─────────────────────────────────────
def detect_critical_alert(tests: dict) -> dict:
    """
    Pure deterministic critical alert detection. Zero AI involved.

    Checks individual thresholds AND total severe abnormal count.

    Returns
    -------
    dict:
        {
            "emergency_flag"     : bool,
            "critical_tests"     : list[str],  # tests that individually triggered
            "trigger_reason"     : str,
            "alert_level"        : "NORMAL" | "ELEVATED" | "CRITICAL"
        }
    """
    critical_tests = []

    for test_name, data in tests.items():
        value  = data.get("value")
        status = data.get("status", "Normal")
        if value is None or status == "Normal":
            continue

        thresholds = _CRITICAL_THRESHOLDS.get(test_name, {}).get(status, {})
        if not thresholds:
            continue

        try:
            value = float(value)
        except (TypeError, ValueError):
            continue

        triggered = False
        if "min" in thresholds and value >= thresholds["min"]:
            triggered = True
        if "max" in thresholds and value <= thresholds["max"]:
            triggered = True

        if triggered:
            critical_tests.append(test_name)

    # Count ALL abnormal tests (not just threshold-crossing ones)
    total_abnormal = sum(
        1 for d in tests.values()
        if d.get("status") in ("High", "Low")
    )

    # Hierarchy: CRITICAL > HIGH > ELEVATED > NORMAL
    # CRITICAL  : individual threshold(s) breached
    # HIGH      : 3+ abnormal parameters, no threshold breach
    # ELEVATED  : 1-2 abnormal parameters
    # NORMAL    : no abnormal parameters
    emergency_flag = bool(critical_tests)   # only threshold breaches trigger emergency

    if critical_tests:
        alert_level = "CRITICAL"
        trigger_reason = f"Threshold exceeded: {', '.join(critical_tests)}"
    elif total_abnormal >= _SEVERE_ABNORMAL_COUNT_THRESHOLD:
        alert_level = "HIGH"
        trigger_reason = f"{total_abnormal} abnormal parameters detected (no individual threshold breached)"
    elif total_abnormal > 0:
        alert_level = "ELEVATED"
        trigger_reason = "Abnormal values present but within watchable range."
    else:
        alert_level = "NORMAL"
        trigger_reason = "All parameters within reference ranges."

    return {
        "emergency_flag"  : emergency_flag,
        "critical_tests"  : critical_tests,
        "trigger_reason"  : trigger_reason,
        "alert_level"     : alert_level,
    }


# ── UPGRADE 2: Confidence Scoring ───────────────────────────────────────────
def compute_confidence_score(tests: dict, analytics: dict) -> dict:
    """
    Compute a deterministic AI confidence score. Zero AI involved.

    Logic:
      - Base score: 100
      - Each abnormal parameter: -8 points
      - Each critical test (threshold breach): -5 bonus penalty
      - More tests = more context = slight boost

    Returns
    -------
    dict:
        {
            "score"       : int,    # 0–100
            "percentage"  : str,    # "82%"
            "explanation" : str,
        }
    """
    base    = 100
    deduct  = analytics.get("abnormal", 0) * 8

    alert   = detect_critical_alert(tests)
    deduct += len(alert.get("critical_tests", [])) * 5

    # More tests = slightly higher confidence (more data = better grounding)
    total = analytics.get("total", 0)
    boost = min(total * 2, 10)

    score = max(0, min(100, base - deduct + boost))

    explanation = (
        f"Confidence is based on deterministic medical rule matching and structured "
        f"knowledge retrieval. Score reduced by {deduct} points for {analytics.get('abnormal', 0)} "
        f"abnormal parameter(s). Grounding boost: +{boost} for {total} total parameters analyzed."
    )

    return {
        "score"      : score,
        "percentage" : f"{score}%",
        "explanation": explanation,
    }


# ── Core analytics ───────────────────────────────────────────────────────────
def compute_deterministic_analytics(tests: dict) -> dict:
    """
    Pure deterministic computation. No AI involved.

    Returns a summary dict with counts and classified test lists.
    """
    high_tests   = [k for k, v in tests.items() if v.get("status") == "High"]
    low_tests    = [k for k, v in tests.items() if v.get("status") == "Low"]
    normal_tests = [k for k, v in tests.items() if v.get("status") == "Normal"]

    return {
        "total"      : len(tests),
        "abnormal"   : len(high_tests) + len(low_tests),
        "high"       : len(high_tests),
        "low"        : len(low_tests),
        "normal"     : len(normal_tests),
        "high_tests" : high_tests,
        "low_tests"  : low_tests,
    }


# ── UPGRADE 4: Trend Comparison ─────────────────────────────────────────────
def compute_trend_comparison(current_tests: dict, previous_tests: dict) -> dict:
    """
    Deterministic trend comparison between two lab reports. Zero AI involved.

    Parameters
    ----------
    current_tests  : dict — latest report test results
    previous_tests : dict — older report test results (same format)

    Returns
    -------
    dict:
        {
            "trends" : list[dict],   # per-test comparison
            "summary": str,          # human-readable trend summary
        }
    """
    trends  = []
    summary_lines = []

    for test_name, curr_data in current_tests.items():
        if test_name not in previous_tests:
            continue

        curr_val = curr_data.get("value")
        prev_val = previous_tests[test_name].get("value")
        unit     = curr_data.get("unit", "")

        try:
            curr_val = float(curr_val)
            prev_val = float(prev_val)
        except (TypeError, ValueError):
            continue

        if prev_val == 0:
            change_pct = None
            direction  = "unchanged"
        else:
            change_pct = round(((curr_val - prev_val) / abs(prev_val)) * 100, 1)
            if change_pct > 0:
                direction = "increased"
            elif change_pct < 0:
                direction = "decreased"
            else:
                direction = "unchanged"

        curr_status = curr_data.get("status", "Normal")
        prev_status = previous_tests[test_name].get("status", "Normal")
        
        # Determine assessment based on status changes
        assessment = "Stable"
        if prev_status != "Normal" and curr_status == "Normal":
            assessment = "Improved"
        elif prev_status == "Normal" and curr_status != "Normal":
            assessment = "Worsened"
        elif curr_status == "High" and direction == "increased":
            assessment = "Worsened"
        elif curr_status == "High" and direction == "decreased":
            assessment = "Improved"
        elif curr_status == "Low" and direction == "decreased":
            assessment = "Worsened"
        elif curr_status == "Low" and direction == "increased":
            assessment = "Improved"

        trend_entry = {
            "test"          : test_name,
            "previous_value": prev_val,
            "current_value" : curr_val,
            "unit"          : unit,
            "change_pct"    : change_pct,
            "direction"     : direction,
            "current_status": curr_status,
            "previous_status": prev_status,
            "assessment"    : assessment,
        }
        trends.append(trend_entry)

        if change_pct is not None and change_pct != 0:
            sign = "+" if change_pct > 0 else ""
            summary_lines.append(
                f"  - {test_name}: {prev_val} → {curr_val} {unit} "
                f"({sign}{change_pct}% {direction}) [{assessment}]"
            )
        else:
            summary_lines.append(
                f"  - {test_name}: {curr_val} {unit} (no change) [{assessment}]"
            )

    summary = "\n".join(summary_lines) if summary_lines else "No comparable tests found between reports."

    return {"trends": trends, "summary": summary}


# ── Main orchestrator ────────────────────────────────────────────────────────
def generate_report_explanation(
    patient_age: int,
    patient_gender: str,
    tests: dict,
    overall_risk_level: str,
    mode: ModeType = "patient",
    language: LanguageType = "English",
    previous_tests: dict = None,
) -> dict:
    """
    Core function: produces a grounded medical report explanation.

    Parameters
    ----------
    patient_age        : int    — patient age in years
    patient_gender     : str    — e.g. "Male", "Female"
    tests              : dict   — structured test results
    overall_risk_level : str    — "Low" | "Moderate" | "High" | "Critical"
    mode               : str    — "patient" or "doctor"
    language           : str    — "English" | "Hindi" | "Telugu"
    previous_tests     : dict   — optional previous report for trend comparison

    Returns
    -------
    dict with keys:
        "analytics"       : dict  — deterministic analytics
        "alert"           : dict  — critical alert result
        "confidence"      : dict  — AI confidence score
        "trend"           : dict  — trend comparison (if previous_tests provided)
        "retrieved_context": str  — RAG-retrieved context
        "explanation"     : str   — LLM-generated explanation
        "privacy"         : str   — privacy statement
        "mode"            : str
        "language"        : str
    """
    # Step 1: Deterministic Analytics
    analytics = compute_deterministic_analytics(tests)

    # Step 2: Critical Alert Detection (UPGRADE 1)
    alert = detect_critical_alert(tests)

    # Step 3: Confidence Scoring (UPGRADE 2)
    confidence = compute_confidence_score(tests, analytics)

    # Step 4: Trend Comparison (UPGRADE 4, optional)
    trend = compute_trend_comparison(tests, previous_tests) if previous_tests else None

    # Step 5: RAG Retrieval
    retrieved_context = retrieve_context(tests)

    # Step 6: Build Controlled Prompt (emergency flag injected)
    # Use deterministic alert_level as the risk level so LLM language
    # is always consistent with our computed classification output.
    # effective_risk_level = alert["alert_level"]   # NORMAL | ELEVATED | HIGH | CRITICAL
    effective_risk_level = alert.get("alert_level", "NORMAL")
    prompt = build_prompt(
        patient_age=patient_age,
        patient_gender=patient_gender,
        tests=tests,
        overall_risk_level=effective_risk_level,
        retrieved_context=retrieved_context,
        mode=mode,
        language=language,
        emergency_flag=alert.get("emergency_flag", False),
        confidence_score=confidence.get("percentage", "0%"),
        trend_summary=trend.get("summary") if trend else None,
    )

    # Step 7: LLM API Call (constrained by prompt)
    explanation = call_grok(prompt)

    return {
        "analytics"        : analytics,
        "alert"            : alert,
        "confidence"       : confidence,
        "trend"            : trend,
        "retrieved_context": retrieved_context,
        "explanation"      : explanation,
        "privacy"          : PRIVACY_STATEMENT,
        "mode"             : mode,
        "language"         : language,
    }


# ── Safety query handler ─────────────────────────────────────────────────────
def handle_user_query(query: str) -> str:
    """
    Blocks diagnosis or prescription requests before reaching the LLM.
    Returns safe refusal message or empty string if safe.
    """
    if _safety_check(query):
        return _SAFE_REFUSAL_MESSAGE
    return ""
