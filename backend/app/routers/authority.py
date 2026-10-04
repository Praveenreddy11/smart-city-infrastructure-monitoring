from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from backend.app.database.session import get_db
from backend.app.models.models import Issue, Detection, Worker, Assignment, Repair, User
from backend.app.schemas.schemas import ReportOut, AssignmentCreate, AssignmentOut, VerificationAction
from backend.app.routers.deps import get_current_authority
from backend.app.services.health_score import HealthScoreService

router = APIRouter(prefix="/authority", tags=["Government Authority"])

@router.get("/issues", response_model=List[ReportOut])
def list_issues(
    status_filter: Optional[str] = Query(None, alias="status"),
    severity_filter: Optional[str] = Query(None, alias="severity"),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_authority: User = Depends(get_current_authority)
):
    query = db.query(Issue)
    
    if status_filter:
        query = query.filter(Issue.status == status_filter)
    if severity_filter:
        query = query.filter(Issue.overall_severity == severity_filter)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Issue.report_id.like(search_pattern),
                Issue.location_name.like(search_pattern),
                Issue.description.like(search_pattern)
            )
        )
        
    return query.order_by(Issue.created_at.desc()).all()

@router.get("/issues/{issue_id}", response_model=ReportOut)
def get_issue_detail(
    issue_id: int,
    db: Session = Depends(get_db),
    current_authority: User = Depends(get_current_authority)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue

@router.post("/assign", response_model=AssignmentOut)
def assign_worker_to_issue(
    payload: AssignmentCreate,
    db: Session = Depends(get_db),
    current_authority: User = Depends(get_current_authority)
):
    issue = db.query(Issue).filter(Issue.id == payload.issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Target issue not found")
        
    worker = db.query(Worker).filter(Worker.id == payload.worker_id).first()
    if not worker or worker.status != "ACTIVE":
        raise HTTPException(status_code=400, detail="Target worker is invalid or inactive")

    # Mark existing active assignments for this issue as Reassigned to maintain history and prevent conflicts
    existing_assignments = db.query(Assignment).filter(
        Assignment.issue_id == issue.id,
        Assignment.status.in_(["Assigned", "Accepted", "In Progress"])
    ).all()
    for prev_assignment in existing_assignments:
        prev_assignment.status = "Reassigned"

    # Create new assignment record
    assignment = Assignment(
        issue_id=issue.id,
        worker_id=worker.id,
        assigned_by=current_authority.id,
        notes=payload.notes,
        status="Assigned"
    )
    db.add(assignment)
    
    # Update issue status to Assigned
    issue.status = "Assigned"
    issue.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(assignment)
    return assignment

@router.post("/verify/{issue_id}")
def verify_completed_repair(
    issue_id: int,
    action_data: VerificationAction,
    db: Session = Depends(get_db),
    current_authority: User = Depends(get_current_authority)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    repair = db.query(Repair).filter(Repair.issue_id == issue.id).order_by(Repair.submitted_at.desc()).first()
    if not repair:
        raise HTTPException(status_code=400, detail="No repair proof has been submitted for this issue yet.")

    latest_assignment = db.query(Assignment).filter(
        Assignment.issue_id == issue.id
    ).order_by(Assignment.assigned_at.desc()).first()

    action = action_data.action.upper()
    if action == "VERIFY":
        issue.status = "Verified"
        repair.verification_status = "Verified"
        repair.verified_at = datetime.now(timezone.utc)
        if latest_assignment:
            latest_assignment.status = "Verified"
        message = "Repair proof successfully verified. Issue marked as Verified."
    elif action == "REJECT":
        issue.status = "Assigned"
        repair.verification_status = "Rejected"
        repair.rejection_reason = action_data.rejection_reason or "Repair quality unsatisfactory."
        if latest_assignment:
            latest_assignment.status = "Assigned"
        message = "Repair proof rejected. Task returned to worker."
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Must be VERIFY or REJECT.")

    issue.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": message, "status": issue.status}

@router.get("/health-score")
def get_infrastructure_health_score(
    db: Session = Depends(get_db),
    current_authority: User = Depends(get_current_authority)
):
    return HealthScoreService.calculate_health_score(db)

@router.get("/analytics")
def get_dashboard_analytics(
    db: Session = Depends(get_db),
    current_authority: User = Depends(get_current_authority)
):
    # Dynamic aggregations from MySQL
    by_type = db.query(
        Detection.class_name, func.count(Detection.id)
    ).group_by(Detection.class_name).all()

    by_severity = db.query(
        Issue.overall_severity, func.count(Issue.id)
    ).group_by(Issue.overall_severity).all()

    by_status = db.query(
        Issue.status, func.count(Issue.id)
    ).group_by(Issue.status).all()

    health_info = HealthScoreService.calculate_health_score(db)

    return {
        "health_info": health_info,
        "by_type": [{"name": t[0], "count": t[1]} for t in by_type],
        "by_severity": [{"name": s[0], "count": s[1]} for s in by_severity],
        "by_status": [{"name": st[0], "count": st[1]} for st in by_status]
    }
