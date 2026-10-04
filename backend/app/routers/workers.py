import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.core.config import settings
from backend.app.core.security import get_password_hash
from backend.app.models.models import Worker, User, Issue, Assignment, Repair
from backend.app.schemas.schemas import WorkerOut, WorkerCreate, WorkerUpdate, ReportOut, RepairOut
from backend.app.routers.deps import get_current_authority, get_current_worker

router = APIRouter(tags=["Workers & Worker Dashboard"])

# --- AUTHORITY WORKER MANAGEMENT ENDPOINTS ---

@router.get("/workers", response_model=List[WorkerOut])
def list_all_workers(
    db: Session = Depends(get_db),
    current_authority: User = Depends(get_current_authority)
):
    workers = db.query(Worker).all()
    result = []
    for w in workers:
        active_assignments = db.query(Assignment).filter(
            Assignment.worker_id == w.id,
            Assignment.status != "Reassigned"
        ).all()
        
        assigned_cnt = sum(1 for a in active_assignments if a.status == "Assigned")
        pending_cnt = sum(1 for a in active_assignments if a.status in ["Assigned", "Accepted"])
        in_prog_cnt = sum(1 for a in active_assignments if a.status == "In Progress")
        completed_cnt = sum(1 for a in active_assignments if a.status in ["Completed", "Verified"])
        workload = pending_cnt + in_prog_cnt
        
        # Attach dynamic attributes for Pydantic schema validation
        w.assigned_tasks_count = assigned_cnt
        w.pending_tasks_count = pending_cnt
        w.in_progress_tasks_count = in_prog_cnt
        w.completed_tasks_count = completed_cnt
        w.current_workload = workload
        result.append(w)
        
    return result

@router.post("/workers", response_model=WorkerOut)
def create_new_worker(
    payload: WorkerCreate,
    db: Session = Depends(get_db),
    current_authority: User = Depends(get_current_authority)
):
    worker_email = payload.email or f"worker_{uuid.uuid4().hex[:4]}@smartcity.gov"
    worker_pass = payload.password or "Worker@123"
    
    # Check email duplicate
    existing = db.query(User).filter(User.email == worker_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Worker email already exists.")

    new_user = User(
        username=f"worker_{uuid.uuid4().hex[:6]}",
        email=worker_email,
        password_hash=get_password_hash(worker_pass),
        role="WORKER",
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    new_worker = Worker(
        user_id=new_user.id,
        name=payload.name,
        phone=payload.phone,
        area=payload.area,
        specialization=payload.specialization or "General Maintenance",
        availability=True,
        status="ACTIVE"
    )
    db.add(new_worker)
    db.commit()
    db.refresh(new_worker)

    new_worker.assigned_tasks_count = 0
    new_worker.pending_tasks_count = 0
    new_worker.in_progress_tasks_count = 0
    new_worker.completed_tasks_count = 0
    new_worker.current_workload = 0
    return new_worker

@router.put("/workers/{worker_id}", response_model=WorkerOut)
def update_worker_info(
    worker_id: int,
    payload: WorkerUpdate,
    db: Session = Depends(get_db),
    current_authority: User = Depends(get_current_authority)
):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    if payload.name is not None:
        worker.name = payload.name
    if payload.phone is not None:
        worker.phone = payload.phone
    if payload.area is not None:
        worker.area = payload.area
    if payload.specialization is not None:
        worker.specialization = payload.specialization
    if payload.availability is not None:
        worker.availability = payload.availability
    if payload.status is not None:
        worker.status = payload.status

    db.commit()
    db.refresh(worker)

    active_assignments = db.query(Assignment).filter(
        Assignment.worker_id == worker.id,
        Assignment.status != "Reassigned"
    ).all()
    worker.assigned_tasks_count = sum(1 for a in active_assignments if a.status == "Assigned")
    worker.pending_tasks_count = sum(1 for a in active_assignments if a.status in ["Assigned", "Accepted"])
    worker.in_progress_tasks_count = sum(1 for a in active_assignments if a.status == "In Progress")
    worker.completed_tasks_count = sum(1 for a in active_assignments if a.status in ["Completed", "Verified"])
    worker.current_workload = worker.pending_tasks_count + worker.in_progress_tasks_count

    return worker

# --- WORKER DASHBOARD ENDPOINTS ---

@router.get("/worker/tasks", response_model=List[ReportOut])
def get_worker_assigned_tasks(
    db: Session = Depends(get_db),
    current_worker: Worker = Depends(get_current_worker)
):
    assignments = db.query(Assignment).filter(
        Assignment.worker_id == current_worker.id,
        Assignment.status != "Reassigned"
    ).all()
    issue_ids = [a.issue_id for a in assignments]
    if not issue_ids:
        return []
    return db.query(Issue).filter(Issue.id.in_(issue_ids)).order_by(Issue.created_at.desc()).all()

@router.put("/worker/tasks/{issue_id}/status")
def update_task_status(
    issue_id: int,
    new_status: str,
    db: Session = Depends(get_db),
    current_worker: Worker = Depends(get_current_worker)
):
    # Allowed worker state transitions
    valid_transitions = {"Accepted", "In Progress"}
    if new_status not in valid_transitions:
        raise HTTPException(
            status_code=400,
            detail=f"Workers can only set status to 'Accepted' or 'In Progress'. Submit repair proof to complete task."
        )

    assignment = db.query(Assignment).filter(
        Assignment.issue_id == issue_id, Assignment.worker_id == current_worker.id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=403, detail="Task not assigned to this worker.")

    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    issue.status = new_status
    issue.updated_at = datetime.now(timezone.utc)
    assignment.status = new_status

    db.commit()
    return {"message": f"Task status updated to {new_status}", "status": issue.status}

@router.post("/worker/tasks/{issue_id}/repair-proof", response_model=RepairOut)
async def upload_repair_proof(
    issue_id: int,
    proof_image: UploadFile = File(...),
    completion_notes: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_worker: Worker = Depends(get_current_worker)
):
    assignment = db.query(Assignment).filter(
        Assignment.issue_id == issue_id, Assignment.worker_id == current_worker.id
    ).first()
    if not assignment:
        raise HTTPException(status_code=403, detail="Task not assigned to this worker.")

    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    # Validate file extension
    ext = os.path.splitext(proof_image.filename)[1].lower()
    if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise HTTPException(status_code=400, detail="Invalid repair proof image format.")

    unique_filename = f"proof_{issue_id}_{uuid.uuid4().hex[:6]}{ext}"
    saved_path = os.path.join(settings.REPAIR_UPLOADS, unique_filename)

    contents = await proof_image.read()
    with open(saved_path, "wb") as f:
        f.write(contents)

    repair = Repair(
        issue_id=issue.id,
        worker_id=current_worker.id,
        proof_image_path=saved_path.replace("\\", "/"),
        completion_notes=completion_notes,
        submitted_at=datetime.now(timezone.utc),
        verification_status="Pending"
    )
    db.add(repair)

    # Update issue and assignment status to Completed
    issue.status = "Completed"
    issue.updated_at = datetime.now(timezone.utc)
    assignment.status = "Completed"

    db.commit()
    db.refresh(repair)
    return repair
