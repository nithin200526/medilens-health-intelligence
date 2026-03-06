"""
app/api/report.py
-----------------
POST /api/analyze-report
  - Accepts PDF or image file (jpg/jpeg/png)
  - Extracts ALL data dynamically (no hardcoding)
  - Returns structured card-based results for the UI
  - Patient name/age/gender extracted from the report itself
"""
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.report_processor import process_report_file

router = APIRouter()

ALLOWED_TYPES = {
    "application/pdf",
    "image/jpeg", "image/jpg", "image/png",
    "image/webp",
}

@router.post("/analyze-report")
async def analyze_report(
    file: UploadFile = File(...),
    previous_file: Optional[UploadFile] = File(None)
):
    """
    Single endpoint: upload PDF or image → get full structured analysis.
    No manual input required.
    """
    content_type = file.content_type or ""
    filename = file.filename or ""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    is_image = content_type.startswith("image/") or ext in ("jpg","jpeg","png","webp")
    is_pdf   = "pdf" in content_type or ext == "pdf"

    if not (is_image or is_pdf):
        raise HTTPException(
            status_code=400,
            detail="Only PDF or image files (JPG, PNG) are supported."
        )

    try:
        file_bytes = await file.read()
        
        prev_bytes = None
        prev_is_image = False
        prev_content_type = ""
        
        if previous_file:
            prev_content_type = previous_file.content_type or ""
            prev_filename = previous_file.filename or ""
            prev_ext = prev_filename.rsplit(".", 1)[-1].lower() if "." in prev_filename else ""
            prev_is_image = prev_content_type.startswith("image/") or prev_ext in ("jpg","jpeg","png","webp")
            prev_bytes = await previous_file.read()

        result = process_report_file(
            file_bytes, 
            is_image=is_image, 
            content_type=content_type,
            previous_file_bytes=prev_bytes,
            previous_is_image=prev_is_image,
            previous_content_type=prev_content_type
        )
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")
