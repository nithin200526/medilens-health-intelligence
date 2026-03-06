"""
app/services/dynamic_analyzer.py  (v3 — 6-Module Triage Engine)
-----------------------------------------------------------------
Module 2: DETERMINISTIC RISK ANALYSIS
Module 3: PRIORITIZATION ENGINE

New in v3:
  - Domain clustering (Hematology / Cardiac / Metabolic / Liver / Hormonal / Immunity)
  - Priority ranking (Priority 1/2/3) by severity distance + critical thresholds
  - Precise alert level rules: STABLE / MILD CONCERN / HIGH / CRITICAL
  - emergency_flag with critical threshold table
  - Report ID passthrough
"""
import re
from typing import Any


# ── Domain Keyword Map ────────────────────────────────────────────────────────
DOMAIN_KEYWORDS: dict[str, list[str]] = {
    "Hematology":    ["hemoglobin","hgb","hb","rbc","wbc","platelet","hematocrit","mcv","mch","mchc",
                      "lymphocyte","neutrophil","eosinophil","basophil","monocyte","rdw","white blood",
                      "red blood","differential","total count","esr"],
    "Cardiac/Lipid": ["ldl","hdl","cholesterol","triglyceride","vldl","non-hdl","lipoprotein",
                      "cardiac","troponin","ck-mb","creatine kinase","bnp","pro-bnp"],
    "Metabolic":     ["glucose","hba1c","glycated","insulin","fasting","blood sugar","ppbs","rbs",
                      "creatinine","urea","bun","uric acid","electrolyte","sodium","potassium",
                      "chloride","bicarbonate","calcium","phosphorus","magnesium"],
    "Liver":         ["alt","sgpt","ast","sgot","alkaline phosphatase","alp","bilirubin","ggt",
                      "albumin","total protein","gamma","liver","hepatic","globulin"],
    "Hormonal":      ["tsh","t3","t4","ft3","ft4","thyroid","cortisol","testosterone","estrogen",
                      "progesterone","fsh","lh","prolactin","insulin","igf","growth hormone"],
    "Immunity":      ["crp","esr","ferritin","immunoglobulin","complement","ana","anti","anca",
                      "rf","rheumatoid","c-reactive","interleukin","d-dimer","fibrinogen","procalcitonin"],
}

def _classify_domain(parameter: str) -> str:
    p = parameter.lower()
    for domain, keywords in DOMAIN_KEYWORDS.items():
        if any(k in p for k in keywords):
            return domain
    return "Other"


# ── Critical Threshold Table ──────────────────────────────────────────────────
CRITICAL_THRESHOLDS: dict[str, dict] = {
    "hemoglobin":              {"max": 7.0,  "note": "Severe anaemia risk"},
    "hgb":                     {"max": 7.0,  "note": "Severe anaemia risk"},
    "platelet":                {"max": 50.0, "note": "Bleeding risk — critical low"},
    "glucose":                 {"min": 400,  "note": "Hyperglycaemic urgency"},
    "blood sugar":             {"min": 400,  "note": "Hyperglycaemic urgency"},
    "creatinine":              {"min": 3.5,  "note": "Severe renal impairment"},
    "potassium":               {"min": 2.5,  "max_v": 6.5, "note": "Life-threatening arrhythmia risk"},
    "sodium":                  {"min": 120,  "max_v": 160, "note": "Critical electrolyte disturbance"},
    "ldl":                     {"min": 200,  "note": "Very high cardiovascular risk"},
    "hba1c":                   {"min": 10.0, "note": "Critically poor glycaemic control"},
    "tsh":                     {"min": 15.0, "note": "Critically high TSH — severe hypothyroid"},
    "bilirubin":               {"min": 10.0, "note": "Severe jaundice threshold"},
    "d-dimer":                 {"min": 4.0,  "note": "Thrombotic emergency concern"},
}

def _is_critical_override(name: str, value: float) -> tuple[bool, str]:
    n = name.lower()
    for key, thresholds in CRITICAL_THRESHOLDS.items():
        if key in n:
            note = thresholds.get("note", "")
            if "min" in thresholds and value >= thresholds["min"]:
                return True, note
            if "max" in thresholds and value <= thresholds["max"]:
                return True, note
            if "max_v" in thresholds and value >= thresholds["max_v"]:
                return True, note
    return False, ""


# ── Reference Range Parser ────────────────────────────────────────────────────
def _parse_range(ref: str | None) -> tuple[float | None, float | None]:
    if not ref:
        return None, None
    ref = str(ref).strip()
    try:
        m = re.match(r"(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)", ref)
        if m: return float(m.group(1)), float(m.group(2))
        m = re.match(r"<\s*(\d+\.?\d*)", ref)
        if m: return None, float(m.group(1))
        m = re.match(r">\s*(\d+\.?\d*)", ref)
        if m: return float(m.group(1)), None
        m = re.match(r"up\s+to\s+(\d+\.?\d*)", ref, re.I)
        if m: return None, float(m.group(1))
    except Exception:
        pass
    return None, None


# ── Classifier ────────────────────────────────────────────────────────────────
def _classify(value: float, low: float | None, high: float | None,
              lab_flag: str | None, name: str) -> tuple[str, str]:
    flag = (lab_flag or "").upper().strip()
    if flag in ("H", "HIGH"):           return "HIGH",     "Lab-flagged as HIGH."
    if flag in ("L", "LOW"):            return "LOW",      "Lab-flagged as LOW."
    if flag in ("CRITICAL","CRIT","C"): return "CRITICAL", "Lab-flagged as CRITICAL."

    if low is None and high is None:
        return "REFERENCE NOT PROVIDED", "No reference range available."

    parts = []
    if low  is not None: parts.append(f"≥{low}")
    if high is not None: parts.append(f"≤{high}")
    ref_str = ", ".join(parts)

    # Critical override first
    crit, note = _is_critical_override(name, value)
    if crit:
        return "CRITICAL", f"⚠️ Critical threshold breached — {note}."

    if low is not None and value < low:
        margin = ((low - value) / low) * 100
        if margin < 10: return "BORDERLINE", f"Slightly below lower limit ({low}). {ref_str}."
        return "LOW",  f"Value {value} is below normal lower limit {low}."

    if high is not None and value > high:
        margin = ((value - high) / high) * 100
        if margin < 10: return "BORDERLINE", f"Slightly above upper limit ({high}). {ref_str}."
        return "HIGH", f"Value {value} exceeds normal upper limit {high}."

    return "NORMAL", f"Within normal reference range ({ref_str})."


# ── Severity Score (for prioritization) ──────────────────────────────────────
STATUS_SEVERITY = {"CRITICAL": 100, "HIGH": 60, "LOW": 50, "BORDERLINE": 25, "NORMAL": 0, "REFERENCE NOT PROVIDED": 0}

def _severity_score(status: str, value: float, low: float | None, high: float | None) -> float:
    base = STATUS_SEVERITY.get(status, 0)
    if status in ("HIGH", "LOW", "BORDERLINE") and (low or high):
        try:
            if status == "HIGH"  and high: base += ((value - high) / high) * 40
            if status == "LOW"   and low:  base += ((low - value)  / low)  * 40
        except: pass
    return round(base, 1)


# ── Main Analysis ─────────────────────────────────────────────────────────────
def analyze_panels(panels: list[dict]) -> dict:
    """
    MODULE 2 + 3: Risk Analysis + Prioritization.

    Returns
    -------
    {
      analysis_summary: { total_tests, abnormal_count, critical_count, overall_risk,
                          alert_level, emergency_flag, domain_clusters },
      detailed_analysis: [...],
      highlight_map: { normal, borderline, high, low, critical },
      priority_list: [ {rank, parameter, status, reason, domain, urgency_note} ]
    }
    """
    detailed: list[dict] = []
    highlight: dict[str, list] = {"normal":[],"borderline":[],"high":[],"low":[],"critical":[]}
    domain_map: dict[str, dict] = {}   # domain → {abnormal: [], critical: []}

    for panel in panels:
        panel_name = panel.get("panel_name", "General")
        for test in panel.get("tests", []):
            name    = test.get("parameter", "Unknown")
            raw_v   = test.get("value", "")
            unit    = test.get("unit") or ""
            ref     = test.get("reference_range")
            flag    = test.get("lab_flag")
            comment = test.get("comment")
            domain  = _classify_domain(name)

            try:
                value = float(re.sub(r"[^\d.\-]", "", str(raw_v)))
            except Exception:
                detailed.append({"parameter": name, "panel": panel_name, "domain": domain,
                                  "value": raw_v, "unit": unit, "status": "NON-NUMERIC",
                                  "reason": "Non-numeric value.", "reference_range": ref, "comment": comment,
                                  "severity_score": 0})
                continue

            lo, hi = _parse_range(ref)
            status, reason = _classify(value, lo, hi, flag, name)
            sev = _severity_score(status, value, lo, hi)

            entry = {"parameter": name, "panel": panel_name, "domain": domain,
                     "value": raw_v, "unit": unit, "status": status,
                     "reason": reason, "reference_range": ref, "comment": comment,
                     "severity_score": sev}
            detailed.append(entry)

            # Highlight bucket
            bucket = status.lower()
            if "critical"   in bucket: highlight["critical"].append(entry)
            elif "high"     in bucket: highlight["high"].append(entry)
            elif "low"      in bucket: highlight["low"].append(entry)
            elif "borderline" in bucket: highlight["borderline"].append(entry)
            else: highlight["normal"].append(entry)

            # Domain clustering
            if status not in ("NORMAL", "NON-NUMERIC", "REFERENCE NOT PROVIDED"):
                if domain not in domain_map:
                    domain_map[domain] = {"abnormal": [], "critical": []}
                domain_map[domain]["abnormal"].append(name)
                if status == "CRITICAL":
                    domain_map[domain]["critical"].append(name)

    # ── Alert Level & Risk ──────────────────────────────────────────────────
    total    = len([d for d in detailed if d["status"] not in ("NON-NUMERIC",)])
    abnormal = len([d for d in detailed if d["status"] in ("HIGH","LOW","BORDERLINE","CRITICAL")])
    critical = len([d for d in detailed if d["status"] == "CRITICAL"])
    emergency_flag = critical > 0

    if critical > 0:
        alert_level = "CRITICAL"
        overall_risk = "Critical Attention Required"
    elif abnormal >= 3:
        alert_level = "HIGH"
        overall_risk = "High Risk"
    elif abnormal == 2:
        alert_level = "MILD CONCERN"
        overall_risk = "Moderate Risk"
    elif abnormal == 1:
        alert_level = "MILD CONCERN"
        overall_risk = "Mild Concern"
    else:
        alert_level = "STABLE"
        overall_risk = "Stable"

    # ── Priority List (Module 3) ─────────────────────────────────────────────
    abnormal_entries = [d for d in detailed if d["status"] in ("HIGH","LOW","BORDERLINE","CRITICAL")]
    ranked = sorted(abnormal_entries, key=lambda x: x["severity_score"], reverse=True)

    priority_list = []
    for rank_idx, entry in enumerate(ranked, 1):
        urgency = ("Seek immediate care" if entry["status"] == "CRITICAL"
                   else "Consult doctor soon" if entry["status"] in ("HIGH","LOW")
                   else "Monitor at next checkup")
        priority_list.append({
            "rank":       rank_idx,
            "parameter":  entry["parameter"],
            "status":     entry["status"],
            "value":      f"{entry['value']} {entry['unit']}".strip(),
            "reason":     entry["reason"],
            "domain":     entry["domain"],
            "urgency_note": urgency,
            "severity_score": entry["severity_score"],
        })

    return {
        "analysis_summary": {
            "total_tests":    total,
            "abnormal_count": abnormal,
            "critical_count": critical,
            "overall_risk":   overall_risk,
            "alert_level":    alert_level,
            "emergency_flag": emergency_flag,
            "domain_clusters": domain_map,
        },
        "detailed_analysis": detailed,
        "highlight_map":     highlight,
        "priority_list":     priority_list,
    }
