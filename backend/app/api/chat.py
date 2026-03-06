"""
app/api/chat.py
---------------
POST /api/chat — Interactive Q&A about an uploaded report.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class ChatRequest(BaseModel):
    session_id: str = "default_session"
    question: str
    tests: dict
    analytics: dict
    alert: dict
    explanation: str = ""
    language: str = "English"
    history: Optional[list[dict]] = []
    patient_info: Optional[dict] = {}
    panels: Optional[list] = []
    dynamic_analysis: Optional[dict] = {}
    is_general_mode: bool = False

SAFETY_KEYWORDS = [
    "diagnose", "diagnosis", "what disease", "which disease",
    "do i have", "what illness", "prescribe", "medication",
    "which medicine", "what drug", "dosage", "treatment plan",
    "cure", "surgery",
]

def _is_unsafe(query: str) -> bool:
    q = query.lower()
    return any(k in q for k in SAFETY_KEYWORDS)

def _build_report_context(req: ChatRequest) -> str:
    patient_info = req.patient_info or {}
    pname  = patient_info.get("name") or ""
    pdoc   = patient_info.get("doctor") or ""
    plab   = patient_info.get("lab_name") or ""
    pdate  = patient_info.get("report_date") or ""
    patient_block = (
        f"  Patient : {pname}  |  Lab: {plab}  |  Date: {pdate}  |  Doctor: {pdoc}\n"
        if any([pname, plab, pdate, pdoc]) else ""
    )

    if req.panels:
        test_lines = []
        for panel in req.panels:
            test_lines.append(f"\n  [{panel.get('panel_name','General')}]")
            for t in panel.get("tests", []):
                ref   = t.get("reference_range") or "N/A"
                flag  = t.get("lab_flag") or ""
                flag_str = f" ← {flag}" if flag else ""
                test_lines.append(
                    f"    {t.get('parameter','?')}: {t.get('value','?')} "
                    f"{t.get('unit') or ''}  [Ref: {ref}]{flag_str}"
                )
        tests_str = "\n".join(test_lines)
    else:
        test_lines = []
        for name, d in req.tests.items():
            test_lines.append(
                f"  - {name}: {d.get('value')} {d.get('unit','')} [{d.get('status','Normal')}]"
            )
        tests_str = "\n".join(test_lines) or "  (no tests)"

    dyn = req.dynamic_analysis or {}
    dyn_summary = dyn.get("analysis_summary", {})
    dyn_risk = dyn_summary.get("overall_risk", "")
    dyn_str  = (
        f"  Dynamic Risk: {dyn_risk}  |  "
        f"Abnormal: {dyn_summary.get('abnormal_count','?')}  |  "
        f"Critical: {dyn_summary.get('critical_count','?')}\n"
        if dyn_risk else ""
    )

    high = req.analytics.get("high_tests", [])
    low  = req.analytics.get("low_tests",  [])
    critical = req.alert.get("critical_tests", [])
    abnormal_lines = []
    for t in high:     abnormal_lines.append(f"  - {t}: HIGH")
    for t in low:      abnormal_lines.append(f"  - {t}: LOW")
    for t in critical: abnormal_lines.append(f"  - {t}: CRITICAL (threshold breach)")
    abnormal_str = "\n".join(abnormal_lines) or "  None"

    return f"""━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATIENT & REPORT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{patient_block}
PATIENT'S FULL LAB REPORT (with Reference Ranges)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{tests_str}

{dyn_str}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABNORMAL PARAMETERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{abnormal_str}
"""

@router.post("/chat")
async def chat(req: ChatRequest):
    """Interactive Q&A about an uploaded report."""
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    if _is_unsafe(req.question):
        return {
            "answer": (
                "I'm not able to provide a medical diagnosis, prescribe medications, or recommend "
                "specific treatments. This AI assistant provides informational support only. "
                "Please consult a licensed medical professional for personalized advice."
            ),
            "safe": False,
        }

    try:
        from rag_engine.langchain_chain import build_chat_chain, build_general_chat_chain, get_session_memory, _invoke_with_fallback
        
        memory = get_session_memory(req.session_id)
        hist = memory.load_memory_variables({}).get("history", [])
        
        question = req.question
        if req.language != "English":
            question += f"\n[Please answer entirely in {req.language}. All output must be in {req.language}.]"
            
        print(f"DEBUG: Invoking chain for session {req.session_id} (General Mode: {req.is_general_mode})...")
        
        if req.is_general_mode:
            chain = build_general_chat_chain()
            answer = _invoke_with_fallback(chain, {
                "history": hist,
                "question": question
            })
        else:
            chain = build_chat_chain(req.session_id)
            report_context = _build_report_context(req)
            alert_level = req.alert.get("alert_level", "NORMAL")
            emergency = "YES — immediate care needed" if req.alert.get("emergency_flag", False) else "No"
            
            answer = _invoke_with_fallback(chain, {
                "report_context": report_context,
                "alert_level": alert_level,
                "emergency": emergency,
                "history": hist,
                "question": question
            })
        
        # Save to memory
        memory.save_context({"question": req.question}, {"output": answer})
        
        print("DEBUG: Chat complete.")
        return {"answer": answer, "safe": True}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")
