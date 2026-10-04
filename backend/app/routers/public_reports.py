import os
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.core.config import settings
from backend.app.ai.detector import run_detection
from backend.app.models.models import Issue, Detection
from backend.app.schemas.schemas import ReportOut

router = APIRouter(prefix="/public", tags=["Public Citizen Reports"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE_MB = 10

def generate_report_id() -> str:
    timestamp_str = datetime.now().strftime("%Y")
    unique_suffix = uuid.uuid4().hex[:6].upper()
    return f"REP-{timestamp_str}-{unique_suffix}"

@router.post("/reports", response_model=ReportOut)
async def submit_public_report(
    image: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    location_name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    # 1. Validate File Extension
    ext = os.path.splitext(image.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image extension. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # 2. Save Uploaded File
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    saved_image_path = os.path.join(settings.REPORT_UPLOADS, unique_filename)

    contents = await image.read()
    if len(contents) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum limit of {MAX_FILE_SIZE_MB}MB."
        )

    with open(saved_image_path, "wb") as f:
        f.write(contents)

    # 3. Run YOLOv8 AI Object Detection
    try:
        ai_result = run_detection(saved_image_path)
    except Exception as e:
        print(f"[ERROR] AI Detection Pipeline Error: {e}")
        # Clean up file if detection fails critically
        if os.path.exists(saved_image_path):
            os.remove(saved_image_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing image through AI detection pipeline."
        )

    # 4. Generate Unique Report ID & DB Record
    report_id = generate_report_id()
    overall_severity = ai_result.get("overall_severity", "Low")
    annotated_path = ai_result.get("annotated_image_path")

    new_issue = Issue(
        report_id=report_id,
        image_path=saved_image_path.replace("\\", "/"),
        annotated_image_path=annotated_path.replace("\\", "/") if annotated_path else None,
        latitude=latitude,
        longitude=longitude,
        location_name=location_name or "Smart City Road Segment",
        description=description,
        status="Reported",
        overall_severity=overall_severity
    )

    db.add(new_issue)
    db.commit()
    db.refresh(new_issue)

    # 5. Store AI Detections in MySQL
    for det in ai_result.get("detections", []):
        detection_rec = Detection(
            issue_id=new_issue.id,
            class_name=det["class_name"],
            confidence=det["confidence"],
            bbox_x1=det["bbox"]["x1"],
            bbox_y1=det["bbox"]["y1"],
            bbox_x2=det["bbox"]["x2"],
            bbox_y2=det["bbox"]["y2"],
            severity=det["severity"]
        )
        db.add(detection_rec)

    db.commit()
    db.refresh(new_issue)

    return new_issue

@router.get("/track/{report_id}", response_model=ReportOut)
def track_public_report(report_id: str, db: Session = Depends(get_db)):
    issue = db.query(Issue).filter(Issue.report_id == report_id.strip()).first()
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID '{report_id}' was not found in system records."
        )
    return issue
