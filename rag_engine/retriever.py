"""
retriever.py
------------
Retrieves grounded medical context from the structured knowledge base
for given lab test names and their statuses (High / Low).

This module ensures the LLM is NEVER asked to invent medical facts —
all context is sourced from verified structured data.
"""

import json
import os
from typing import Optional

# Absolute path to the knowledge base file
_KB_PATH = os.path.join(os.path.dirname(__file__), "knowledge_base", "medical_data.json")

# Cached knowledge base (loaded once)
_KNOWLEDGE_BASE: Optional[dict] = None


def _load_knowledge_base() -> dict:
    """Load and cache the medical knowledge base from JSON."""
    global _KNOWLEDGE_BASE
    if _KNOWLEDGE_BASE is None:
        with open(_KB_PATH, "r", encoding="utf-8") as f:
            _KNOWLEDGE_BASE = json.load(f)
    return _KNOWLEDGE_BASE


def retrieve_context(tests: dict) -> str:
    """
    Retrieve structured medical context for the given test results.

    Parameters
    ----------
    tests : dict
        A dictionary of test results in the format:
        {
            "TestName": {"value": float, "unit": str, "status": "High" | "Low" | "Normal"},
            ...
        }

    Returns
    -------
    str
        A formatted medical reference context string ready for prompt injection.
    """
    kb = _load_knowledge_base()
    context_blocks = []

    for test_name, test_data in tests.items():
        status = test_data.get("status", "").strip()

        # Only retrieve context for abnormal results
        if status not in ("High", "Low"):
            continue

        test_info = kb.get(test_name)
        if not test_info:
            # Gracefully skip unknown tests — no hallucination fallback
            context_blocks.append(
                f"[{test_name} ({status})]\n"
                f"  Note: No structured reference data available for this parameter. "
                f"Doctor consultation is recommended."
            )
            continue

        status_info = test_info.get(status)
        if not status_info:
            context_blocks.append(
                f"[{test_name} ({status})]\n"
                f"  Note: No specific reference available for this status. "
                f"Further evaluation recommended."
            )
            continue

        block = (
            f"[{test_name} ({status})]\n"
            f"  Reference Range   : {status_info.get('reference_range', 'N/A')}\n"
            f"  Clinical Meaning  : {status_info.get('clinical_meaning', 'N/A')}\n"
            f"  Possible Symptoms : {status_info.get('possible_symptoms', 'N/A')}\n"
            f"  General Advice    : {status_info.get('general_advice', 'N/A')}\n"
            f"  Severity Note     : {status_info.get('severity_note', 'N/A')}"
        )
        context_blocks.append(block)

    if not context_blocks:
        return "All reported lab values are within normal reference ranges. No abnormal context to retrieve."

    return "\n\n".join(context_blocks)


def get_available_tests() -> list:
    """Return the list of test names available in the knowledge base."""
    kb = _load_knowledge_base()
    return list(kb.keys())


if __name__ == "__main__":
    # Quick sanity check
    sample_tests = {
        "Hemoglobin": {"value": 10.2, "unit": "g/dL", "status": "Low"},
        "LDL": {"value": 160, "unit": "mg/dL", "status": "High"},
    }
    print(retrieve_context(sample_tests))
