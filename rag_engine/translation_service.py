"""
rag_engine/translation_service.py
---------------------------------
Robust translation service for medical reports.
"""
import json
import re
from rag_engine.grok_client import call_grok

def extract_json_robustly(text: str) -> str:
    """Finds the first { and last } to extract JSON from a potentially messy string."""
    try:
        # Find first '{' and last '}'
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1 and end > start:
            return text[start:end+1]
        return text
    except:
        return text

def translate_report_data(data: dict, target_lang: str) -> dict:
    """
    Translates the relevant textual fields of a report payload.
    Used for both dashboard UI and PDF export.
    """
    if not target_lang or target_lang.lower() == "english":
        return data

    # 1. Identify what to translate
    to_translate = {
        "card_explanations": data.get("card_explanations", []),
        "overall_risk": data.get("overall_risk", ""),
        "trigger_reason": data.get("alert", {}).get("trigger_reason", ""),
        "trend_summary": data.get("trend", {}).get("summary", "") if data.get("trend") else "",
        "analysis_summary": data.get("dynamic_analysis", {}).get("analysis_summary", {}).get("summary", "") 
                            if isinstance(data.get("dynamic_analysis", {}).get("analysis_summary"), dict) else "",
        "detailed_analysis": data.get("dynamic_analysis", {}).get("detailed_analysis", []), # Added detailed analysis
        "labels": data.get("labels", {})
    }

    # Enhanced prompt for smaller models (fallback)
    prompt = f"""
You are a professional medical translator. 
TASK: Translate the following JSON object into {target_lang}.

RULES:
1. Translate 'one_liner', 'what_this_means', and 'what_if_ignored' inside 'card_explanations'.
2. Keep the 'parameter' names as they are in English (Crucial for UI mapping).
3. Translate the strings: 'overall_risk', 'trigger_reason', 'trend_summary', 'analysis_summary'.
4. Translate 'interpretation' and 'status' (High, Low, Normal etc.) inside 'detailed_analysis'.
5. Translate all values in the 'labels' dictionary.
6. Return ONLY a valid JSON object. No markdown.
Do not explain your work.

JSON TO TRANSLATE:
{json.dumps(to_translate, ensure_ascii=False)}
"""

    response = ""
    try:
        response = call_grok(prompt).strip()
        
        # Clean up response for potential conversational filler
        json_str = extract_json_robustly(response)
        translated = json.loads(json_str)

        if not isinstance(translated, dict):
            print(f"[WARNING] LLM returned {type(translated)} instead of dict. Response: {response[:100]}...")
            return data

        # 2. Merge back into a COPY of the original data
        new_data = json.loads(json.dumps(data)) # Deep copy
        
        new_data["card_explanations"] = translated.get("card_explanations", new_data["card_explanations"])
        new_data["overall_risk"] = translated.get("overall_risk", new_data.get("overall_risk"))
        new_data["labels"] = translated.get("labels", new_data.get("labels", {}))
        
        if "alert" in new_data:
            new_data["alert"]["trigger_reason"] = translated.get("trigger_reason", new_data["alert"].get("trigger_reason"))
            
        if "trend" in new_data and new_data["trend"]:
            new_data["trend"]["summary"] = translated.get("trend_summary", new_data["trend"].get("summary"))
            
        if "dynamic_analysis" in new_data and "analysis_summary" in new_data["dynamic_analysis"]:
            if isinstance(new_data["dynamic_analysis"]["analysis_summary"], dict):
                new_data["dynamic_analysis"]["analysis_summary"]["summary"] = translated.get("analysis_summary", new_data["dynamic_analysis"]["analysis_summary"].get("summary"))
        
        # Merge detailed_analysis
        if "dynamic_analysis" in new_data and "detailed_analysis" in new_data["dynamic_analysis"]:
            translated_detailed = translated.get("detailed_analysis", [])
            # Map back interpreted fields
            interpret_map = { d.get("parameter"): d for d in translated_detailed if d.get("parameter") }
            for entry in new_data["dynamic_analysis"]["detailed_analysis"]:
                p = entry.get("parameter")
                if p in interpret_map:
                    entry["interpretation"] = interpret_map[p].get("interpretation", entry.get("interpretation"))
                    entry["status"] = interpret_map[p].get("status", entry.get("status"))

        new_data["translatedFor"] = target_lang
        print(f"[SUCCESS] Translated report to {target_lang}")
        return new_data

    except Exception as e:
        print(f"[ERROR] Translation failed for {target_lang}: {str(e)}")
        if response:
            print(f"[DEBUG] Raw response start: {response[:200]}...")
        else:
            print(f"[DEBUG] No response received from LLM.")
        print(f"[INFO] Defaulting to original English data for {target_lang}")
        return data
