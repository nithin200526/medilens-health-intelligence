"""
app/services/report_processor.py
---------------------------------
Core processing service: PDF or Image → full structured analysis.

Pipeline:
  1. Extract text (PDF: pdfplumber) OR send to Groq Vision (image)
  2. LLM extracts patient_info + panels (dynamic, no hardcoding)
  3. Dynamic range analysis
  4. Per-test card explanations from LLM (structured JSON, NOT paragraphs)
  5. Return everything the dashboard needs
"""
import io, base64, json, re, datetime
from app.services.dynamic_analyzer import analyze_panels
from rag_engine.langchain_chain import _invoke_with_fallback

def _debug_log(msg: str):
    with open("extraction_debug.log", "a", encoding="utf-8") as f:
        f.write(f"[{datetime.datetime.now()}] {msg}\n")

# ── Step 1: Text extraction ───────────────────────────────────────────────────

def _extract_pdf_text(pdf_bytes: bytes) -> str:
    import pdfplumber
    pages = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if text:
                pages.append(f"[PAGE {i+1}]\n{text}")
    return "\n\n".join(pages)


def _extract_image_text(image_bytes: bytes, content_type: str = "image/jpeg") -> str:
    """Send image to Groq Vision model for OCR + initial extraction."""
    b64 = base64.b64encode(image_bytes).decode("utf-8")

    from openai import OpenAI
    from dotenv import load_dotenv
    import os
    load_dotenv()

    client = OpenAI(
        api_key=os.getenv("GROQ_API_KEY"),
        base_url="https://api.groq.com/openai/v1",
    )

    response = client.chat.completions.create(
        model="llama-3.2-11b-vision-preview",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "This is a medical lab report image. "
                            "Please extract ALL text from this image exactly as written. "
                            "Include patient name, age, gender, date, lab name, "
                            "all test parameter names, values, units, reference ranges, "
                            "and any flags (H/L/Normal). "
                            "Preserve the exact format and spelling. "
                            "Output only the raw extracted text, no commentary."
                        ),
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{content_type or 'image/jpeg'};base64,{b64}"},
                    },
                ],
            }
        ],
        temperature=0.1,
        max_tokens=4096,
    )
    return response.choices[0].message.content or ""


# ── Step 2: Dynamic structured extraction ────────────────────────────────────

def _llm_extract(text: str) -> dict:
    from rag_engine.langchain_chain import extraction_chain
    truncated = text[:6000]
    
    try:
        raw = _invoke_with_fallback(extraction_chain, {"raw_text": truncated})
        _debug_log(f"LLM Raw Output: {raw}")
        cleaned = re.sub(r"```(?:json)?", "", raw).replace("```", "").strip()
        result = json.loads(cleaned)
        _debug_log(f"Parsed Panels Count: {len(result.get('panels', []))}")
        return result
    except Exception as e:
        _debug_log(f"Extraction Error: {str(e)}")
        try:
            m = re.search(r"\{[\s\S]*\}", raw if 'raw' in locals() else "")
            if m: return json.loads(m.group())
        except: pass
        return {"patient_info": {}, "panels": []}


# ── Step 3: Per-test card explanations ───────────────────────────────────────

def _llm_card_explanations(detailed_analysis: list, risk: str, domain_clusters: dict) -> list:
    from rag_engine.langchain_chain import explanation_chain
    tests_for_prompt = []
    for d in detailed_analysis:
        if d["status"] in ("NON-NUMERIC", "REFERENCE NOT PROVIDED"):
            continue
        tests_for_prompt.append({
            "parameter":       d["parameter"],
            "value":           f"{d['value']} {d.get('unit','') or ''}".strip(),
            "status":          d["status"],
            "reference_range": d.get("reference_range") or "N/A",
            "reason":          d["reason"],
            "domain":          d.get("domain", "Other"),
        })

    if not tests_for_prompt:
        return []

    domains_str = ", ".join(domain_clusters.keys()) if domain_clusters else "None"

    try:
        raw = _invoke_with_fallback(explanation_chain, {
            "tests_json": json.dumps(tests_for_prompt, indent=2),
            "alert_level": risk,
            "domains": domains_str
        })
        cleaned = re.sub(r"```(?:json)?", "", raw).replace("```", "").strip()
        return json.loads(cleaned)
    except Exception:
        try:
            m = re.search(r"\[[\s\S]*\]", raw if 'raw' in locals() else "")
            if m: return json.loads(m.group())
        except: pass
        return []


# ── Step 4: Flatten panels → tests dict ──────────────────────────────────────

def _flatten_tests(panels: list) -> dict:
    tests = {}
    for panel in panels:
        for t in panel.get("tests", []):
            name = (t.get("parameter") or "").strip()
            raw_v = t.get("value", "")
            try:
                val = float(re.sub(r"[^\d.\-]", "", str(raw_v)))
            except:
                continue
            flag   = (t.get("lab_flag") or "").upper()
            status = "High" if flag in ("H","HIGH","CRITICAL") else "Low" if flag in ("L","LOW") else "Normal"
            if name:
                tests[name] = {
                    "value":  val,
                    "unit":   t.get("unit") or "",
                    "status": status,
                }
    return tests


# ── Public API ────────────────────────────────────────────────────────────────

def process_report_file(
    file_bytes: bytes, 
    is_image: bool = False, 
    content_type: str = "",
    previous_file_bytes: bytes = None,
    previous_is_image: bool = False,
    previous_content_type: str = ""
) -> dict:
    """
    Full pipeline: PDF/image → structured cards result.
    If previous_file_bytes provided, also returns trend comparison.

    Returns
    -------
    {
      patient_info, panels, tests,
      dynamic_analysis: { analysis_summary, detailed_analysis, highlight_map },
      card_explanations: [...],
      overall_risk,
    }
    """
    # Step 1: Extract text
    print(f"[DEBUG] Processing file as image: {is_image} (Type: {content_type})")
    raw_text = _extract_image_text(file_bytes, content_type=content_type) if is_image else _extract_pdf_text(file_bytes)
    _debug_log(f"Extracted Raw Text Length: {len(raw_text)}")
    _debug_log(f"Raw Text Sample: {raw_text[:200]}")

    if not raw_text.strip():
        raise RuntimeError(
            "Could not extract text from this file. "
            "For images, ensure good lighting and a clear photo. "
            "For PDFs, ensure it is text-based (not scanned)."
        )

    # Step 2: Dynamic extraction
    structured = _llm_extract(raw_text)
    patient_info = structured.get("patient_info") or {}
    panels       = structured.get("panels") or []
    print(f"[DEBUG] Structured extraction: {len(panels)} panels found")

    # Step 3: Dynamic range analysis
    dynamic_analysis = analyze_panels(panels) if panels else {
        "analysis_summary": {
            "total_tests": 0, "abnormal_count": 0, "critical_count": 0, 
            "overall_risk": "Unknown", "alert_level": "STABLE", "emergency_flag": False
        },
        "detailed_analysis": [],
        "highlight_map": {"normal":[],"high":[],"low":[],"borderline":[],"critical":[]},
    }
    print(f"[DEBUG] Dynamic analysis risk: {dynamic_analysis['analysis_summary'].get('overall_risk')}")
    risk = dynamic_analysis["analysis_summary"].get("overall_risk", "Unknown")

    # Step 4: Per-test card explanations (6-module NLP)
    domain_clusters = dynamic_analysis["analysis_summary"].get("domain_clusters", {})
    card_explanations = _llm_card_explanations(
        dynamic_analysis.get("detailed_analysis", []),
        risk,
        domain_clusters,
    )

    # Flat tests dict (for analytics + chat compatibility)
    tests = _flatten_tests(panels)

    # Stage 5: Trend Comparison (Optional)
    trend_data = None
    if previous_file_bytes:
        print(f"[DEBUG] Processing previous file as image: {previous_is_image}")
        prev_raw_text = _extract_image_text(previous_file_bytes, content_type=previous_content_type) if previous_is_image else _extract_pdf_text(previous_file_bytes)
        if prev_raw_text.strip():
            prev_structured = _llm_extract(prev_raw_text)
            prev_panels = prev_structured.get("panels", [])
            prev_tests = _flatten_tests(prev_panels)
            
            from rag_engine.explanation_engine import compute_trend_comparison
            trend_data = compute_trend_comparison(tests, prev_tests)
            print(f"[DEBUG] Trend comparison computed: {bool(trend_data)}")

    # Priority list from Module 3
    priority_list = dynamic_analysis.get("priority_list", [])

    from app.services.pdf_generator import DEFAULT_LABELS
    
    return {
        "patient_info":     patient_info,
        "panels":           panels,
        "tests":            tests,
        "dynamic_analysis": dynamic_analysis,
        "card_explanations": card_explanations,
        "priority_list":    priority_list,
        "overall_risk":     risk,
        "domain_clusters":  domain_clusters,
        "trend":            trend_data,
        "analytics": {
            "total":    dynamic_analysis["analysis_summary"].get("total_tests", 0),
            "abnormal": dynamic_analysis["analysis_summary"].get("abnormal_count", 0),
            "high":     len(dynamic_analysis["highlight_map"].get("high", [])),
            "low":      len(dynamic_analysis["highlight_map"].get("low", [])),
            "high_tests": [x["parameter"] for x in dynamic_analysis["highlight_map"].get("high", [])],
            "low_tests":  [x["parameter"] for x in dynamic_analysis["highlight_map"].get("low", [])],
            "normal":   len(dynamic_analysis["highlight_map"].get("normal", [])),
        },
        "alert": {
            "alert_level":    dynamic_analysis["analysis_summary"].get("alert_level", "STABLE"),
            "emergency_flag": dynamic_analysis["analysis_summary"].get("emergency_flag", False),
            "critical_tests": [x["parameter"] for x in dynamic_analysis["highlight_map"]["critical"]],
            "trigger_reason": f"{dynamic_analysis['analysis_summary'].get('abnormal_count', 0)} abnormal parameter(s) detected.",
        },
        "confidence": {"percentage": f"{max(50, 100 - dynamic_analysis['analysis_summary'].get('abnormal_count', 0) * 8)}%"},
        "explanation": trend_data.get("summary", "") if trend_data else "",
        "language": "English",
        "labels": DEFAULT_LABELS.copy(), # ADDED
    }


def _map_risk_to_alert(risk: str) -> str:
    m = {
        "Critical Attention Required": "CRITICAL",
        "High Risk": "HIGH",
        "Moderate Risk": "ELEVATED",
        "Mild Concern": "ELEVATED",
        "Stable": "NORMAL",
    }
    return m.get(risk, "NORMAL")
