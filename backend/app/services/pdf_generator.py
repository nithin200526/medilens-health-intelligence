"""
app/services/pdf_generator.py
-----------------------------
Generate a simple, patient-friendly PDF health report.
Designed specifically for clarity and to reduce elderly patient anxiety.
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
import reportlab.lib.styles as rstyles
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
import io
import os
from datetime import datetime
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics

# ── Color Palette (Calm & Clear) ───────────────────────────────────────────
C_PRIMARY   = colors.HexColor("#3B82F6")  # Gentle Blue
C_TEXT      = colors.HexColor("#1E293B")  # Slate 800 (Main text)
C_MUTED     = colors.HexColor("#475569")  # Slate 600 (Easier to read than lighter grey)
C_BG_BOX    = colors.HexColor("#F0FDF4")  # Very soft green tinted box for reassurance
C_BG_BORDER = colors.HexColor("#BBF7D0")  # Green 200
C_GREEN     = colors.HexColor("#059669")  # Reassuring Green
C_RED       = colors.HexColor("#DC2626")  # Clear Red (not too harsh)
C_BLACK     = colors.HexColor("#334155")
C_WHITE     = colors.white

C_STATUS    = {"HIGH": C_RED, "CRITICAL": C_RED, "LOW": C_BLACK, "NORMAL": C_GREEN, "BORDERLINE": colors.HexColor("#D97706")}

DEFAULT_LABELS = {
    "title": "MediLens Health Summary",
    "gen_date": "Generated on",
    "pt_age": "Patient Age",
    "pt_gender": "Gender",
    "years": "years old",
    "stat_markers": "Markers",
    "stat_findings": "Findings",
    "stat_urgent": "Urgent",
    "trend_title": "Health Progress Tracking",
    "ai_assessment": "AI-Powered Assessment",
    "trend_compare": "Comparing current results with your previous submission",
    "headline_stable": "Your health results look stable.",
    "headline_elevated": "Your health is showing focus areas.",
    "tab_insights": "Insights",
    "tab_consult": "Consult AI",
    "export_btn": "Export Insights",
    "nav_analyze_another": "Analyze Another",
    "status_critical": "Critical Priority",
    "status_high": "Attention Needed",
    "status_borderline": "Mild Concern",
    "status_low": "Low Levels",
    "status_normal": "Healthy Status",
    "trend_improved": "Improved",
    "trend_worsened": "Worsened",
    "trend_stable": "Stable",
    "trend_increased": "Increased",
    "trend_decreased": "Decreased",
    "summary_abnormal": "Your lab results are ready. We noticed a few values ({abnormal_names}) are slightly outside the usual range. Please do not worry—this is very common. We recommend sharing this report with your doctor during your next visit.",
    "summary_normal": "Great news! All of your analyzed lab results appear to be within the normal, healthy range. Keep up the good work and maintain your healthy lifestyle.",
    "tests_title": "Your Test Results",
    "th_name": "Test Name",
    "th_result": "Your Result",
    "th_range": "Normal Range",
    "th_status": "Status",
    "exp_title": "Understanding Your Results",
    "exp_sub": "Here is a simple explanation of the tests that were outside the normal range:",
    "clinical_context": "Clinical Context",
    "human_impact": "Human Impact",
    "historical_context": "Historical Context",
    "what_is": "What is",
    "what_meas": "What it measures:",
    "what_mean": "What this means for you:",
    "q_title": "Questions to Ask Your Doctor",
    "q_abn_1": "What does it mean that my {abnormal_names} values are slightly off?",
    "q_abn_2": "Are there any simple changes to my diet or daily routine that could help?",
    "q_abn_3": "When should I schedule my next follow-up test?",
    "q_norm_1": "How can I continue to maintain these healthy results?",
    "q_norm_2": "Are there any specific wellness tips for someone my age?",
    "footer_note": "Please Note:",
    "footer_text": "This summary is designed to help you understand your lab results easily. It is not a medical diagnosis. Always check with your doctor before making any health decisions."
}

def generate_health_pdf(data: dict, labels: dict = None) -> bytes:
    if not labels: labels = DEFAULT_LABELS
    
    target_lang = data.get("language", "English")
    font_regular = "Helvetica"
    font_bold = "Helvetica-Bold"

    # Register Arial for decent Latin support (Spanish, etc.)
    arial_path = "C:\\Windows\\Fonts\\arial.ttf"
    arial_bold_path = "C:\\Windows\\Fonts\\arialbd.ttf"
    if os.path.exists(arial_path):
        try:
            pdfmetrics.registerFont(TTFont('Arial', arial_path))
            font_regular = "Arial"
            font_bold = "Arial"
            if os.path.exists(arial_bold_path):
                pdfmetrics.registerFont(TTFont('Arial-Bold', arial_bold_path))
                font_bold = "Arial-Bold"
        except: pass

    # Multi-language support for Indic Scripts (Hindi, Tamil, Telugu)
    indic_langs = ["Hindi", "Tamil", "Telugu", "Marathi", "Bengali", "Kannada", "Gujarati", "Malayalam"]
    if any(l.lower() in target_lang.lower() for l in indic_langs):
        font_paths = [
            os.environ.get("NIRMALA_FONT_PATH", "C:\\Windows\\Fonts\\nirmala.ttc"),
            "C:\\Windows\\Fonts\\Nirmala.ttc",
            "C:\\Windows\\Fonts\\nirmala.ttf",
        ]
        loaded = False
        for path in font_paths:
            if os.path.exists(path):
                try:
                    if path.lower().endswith(".ttc"):
                        pdfmetrics.registerFont(TTFont('Nirmala', path, subfontIndex=0))
                        pdfmetrics.registerFont(TTFont('Nirmala-Bold', path, subfontIndex=1))
                        font_regular = "Nirmala"
                        font_bold = "Nirmala-Bold"
                        loaded = True
                        break
                    else:
                        pdfmetrics.registerFont(TTFont('Nirmala', path))
                        font_regular = "Nirmala"
                        font_bold = "Nirmala"
                        loaded = True
                        break
                except: pass
        if not loaded:
             print(f"Warning: Indic font not found for {target_lang}")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        topMargin=20*mm, bottomMargin=20*mm,
        leftMargin=18*mm, rightMargin=18*mm,
    )

    styles = rstyles.getSampleStyleSheet()
    W = A4[0] - 36*mm  # usable width

    # ── Custom Paragraph Styles ──────────────────────────────────────────────
    h1 = rstyles.ParagraphStyle("H1", parent=styles["Heading1"],
                         fontSize=24, textColor=C_PRIMARY,
                         spaceAfter=4, fontName=font_bold)
    h2 = rstyles.ParagraphStyle("H2", parent=styles["Heading2"],
                         fontSize=16, textColor=C_TEXT,
                         spaceAfter=8, spaceBefore=16, fontName=font_bold)
    h3_blue = rstyles.ParagraphStyle("H3", parent=styles["Heading3"],
                         fontSize=12, textColor=C_PRIMARY,
                         spaceAfter=6, spaceBefore=12, fontName=font_bold)
    body = rstyles.ParagraphStyle("Body", parent=styles["Normal"],
                           fontSize=11, textColor=C_TEXT,
                           spaceAfter=8, leading=16, fontName=font_regular)
    body_muted = rstyles.ParagraphStyle("BodyMuted", parent=body, textColor=C_MUTED)
    small = rstyles.ParagraphStyle("Small", parent=styles["Normal"],
                            fontSize=9, textColor=C_MUTED,
                            spaceAfter=4, leading=13, fontName=font_regular)

    story = []

    # ── Header ────────────────────────────────────────────────────────────────
    story.append(Paragraph(labels["title"], h1))
    story.append(Paragraph(f"{labels['gen_date']} {datetime.now().strftime('%d %B %Y')}", body_muted))
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=1, color=C_PRIMARY, spaceAfter=14))

    # ── Patient Profile ───────────────────────────────────────────────────────
    p_info = data.get("patient_info", {})
    name   = p_info.get("name", "Unknown")
    age    = p_info.get("age", "—")
    gender = p_info.get("gender", "—")
    
    patient_data = [
        [Paragraph(f"<b>{name}</b>", body), Paragraph(f"<b>{labels['pt_age']}:</b> {age} {labels['years']}", body), Paragraph(f"<b>{labels['pt_gender']}:</b> {gender}", body)]
    ]
    pt = Table(patient_data, colWidths=[W*0.4, W*0.3, W*0.3])
    pt.setStyle(TableStyle([
        ("FONTNAME", (0,0), (-1,-1), font_regular),
        ("BOTTOMPADDING", (0,0), (-1,-1), 8),
        ("TOPPADDING", (0,0), (-1,-1), 0),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("ALIGN", (0,0), (-1,-1), "LEFT"),
    ]))
    story.append(pt)
    story.append(Spacer(1, 8))

    # ── Simple Summary Box ─────────────────────────────────────────────────────
    analytics = data.get("analytics", {})
    abnormal_names = analytics.get("high_tests", []) + analytics.get("low_tests", [])
    
    if abnormal_names:
        abn_str = "<font color='" + C_RED.hexval() + "'>" + ", ".join(abnormal_names) + "</font>"
        summary_text = labels["summary_abnormal"].replace("{abnormal_names}", abn_str)
        # in case json translation loses the placeholder, just ensure it's displayed
        if "{abnormal_names}" not in labels["summary_abnormal"]: 
             summary_text += f" ({abn_str})"
    else:
        summary_text = labels["summary_normal"]

    exec_table = Table([[Paragraph(summary_text, rstyles.ParagraphStyle("ExecBody", parent=body, textColor=colors.HexColor("#065F46"), leading=16, fontSize=12))]], colWidths=[W])
    exec_table.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), C_BG_BOX),
        ("TOPPADDING", (0,0), (-1,-1), 16),
        ("BOTTOMPADDING", (0,0), (-1,-1), 16),
        ("LEFTPADDING", (0,0), (-1,-1), 16),
        ("RIGHTPADDING", (0,0), (-1,-1), 16),
        ("BOX", (0,0), (-1,-1), 1, C_BG_BORDER),
    ]))
    story.append(exec_table)
    story.append(Spacer(1, 14))

    # ── Your Test Results (Simplified Table) ──────────────────────────────────
    tests = data.get("tests", {})
    dyn = data.get("dynamic_analysis", {})
    
    story.append(Paragraph(labels["tests_title"], h2))
    
    if tests:
        # Simple string column names
        rows = [ [labels["th_name"], labels["th_result"], labels["th_range"], labels["th_status"]] ]
        
        # Gather reference ranges
        detailed = []
        if isinstance(dyn, dict):
            detailed = dyn.get("detailed_analysis", [])
        ref_map = {}
        for d in detailed:
            ref_map[d.get("parameter", "")] = d.get("reference_range", "")

        for name, d in tests.items():
            status = d.get("status", "Normal").upper()
            sc = C_STATUS.get(status, C_MUTED)
            val_str = f"<b>{d.get('value')}</b> {d.get('unit', '')}"
            ref_str = ref_map.get(name, "—")
            
            rows.append([
                Paragraph(name, body),
                Paragraph(val_str, body),
                Paragraph(ref_str, body_muted),
                Paragraph(f"<b><font color='{sc.hexval()}'>{status}</font></b>", body),
            ])
            
        t = Table(rows, colWidths=[W*0.35, W*0.25, W*0.25, W*0.15])
        t.setStyle(TableStyle([
            ("TEXTCOLOR",  (0,0), (-1,0), C_MUTED),
            ("FONTNAME",   (0,0), (-1,0), font_bold),
            ("BOTTOMPADDING",(0,0),(-1,0), 8),
            ("LINEBELOW",  (0,0), (-1,0), 1, C_PRIMARY),
            ("LINEBELOW",  (0,1), (-1,-1), 0.5, colors.HexColor("#F1F5F9")),
            ("VALIGN",     (0,0), (-1,-1), "MIDDLE"),
            ("TOPPADDING", (0,1), (-1,-1), 10),
            ("BOTTOMPADDING",(0,1),(-1,-1), 10),
        ]))
        story.append(t)

    story.append(Spacer(1, 20))

    # ── Simple Explanations (Only if abnormal) ─────────────────────────────────
    if abnormal_names:
        story.append(Paragraph(labels["exp_title"], h2))
        story.append(Paragraph(labels["exp_sub"], body))
        story.append(Spacer(1, 8))
        
        cards = data.get("card_explanations", [])
        for c in cards:
            param = c.get("parameter", "")
            if param in abnormal_names:
                story.append(Paragraph(f"<b>{labels['what_is']} <font color='{C_RED.hexval()}'>{param}</font>?</b>", body))
                story.append(Paragraph(f"• <b>{labels['what_meas']}</b> {c.get('one_liner', '')}", body))
                story.append(Paragraph(f"• <b>{labels['what_mean']}</b> {c.get('what_this_means', '')}", body))
                story.append(Spacer(1, 10))

    story.append(Spacer(1, 10))

    # ── Questions for the Doctor ───────────────────────────────────────────────
    story.append(Paragraph(labels["q_title"], h2))
    if abnormal_names:
        p_names = ", ".join(abnormal_names)
        q1 = labels["q_abn_1"].replace("{abnormal_names}", p_names)
        story.append(Paragraph(f"• {q1}", body))
        story.append(Paragraph(f"• {labels['q_abn_2']}", body))
        story.append(Paragraph(f"• {labels['q_abn_3']}", body))
    else:
        story.append(Paragraph(f"• {labels['q_norm_1']}", body))
        story.append(Paragraph(f"• {labels['q_norm_2']}", body))
        
    story.append(Spacer(1, 25))

    # ── Footer / Disclaimer ───────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=1, color=C_MUTED, spaceAfter=10))
    story.append(Paragraph(f"<b>{labels['footer_note']}</b> {labels['footer_text']}", small))

    doc.build(story)
    return buffer.getvalue()
