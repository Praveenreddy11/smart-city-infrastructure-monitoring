from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.models import Payment, Issue, Worker, User
from backend.app.schemas.schemas import PaymentOut, PaymentCreate
from backend.app.routers.deps import get_current_authority

router = APIRouter(prefix="/payments", tags=["Work & Payment Records"])

@router.get("", response_model=List[PaymentOut])
def list_payment_records(
    db: Session = Depends(get_db),
    current_authority: User = Depends(get_current_authority)
):
    return db.query(Payment).order_by(Payment.created_at.desc()).all()

@router.post("", response_model=PaymentOut)
def record_work_payment(
    payload: PaymentCreate,
    db: Session = Depends(get_db),
    current_authority: User = Depends(get_current_authority)
):
    issue = db.query(Issue).filter(Issue.id == payload.issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    worker = db.query(Worker).filter(Worker.id == payload.worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    payment = Payment(
        issue_id=issue.id,
        worker_id=worker.id,
        amount=payload.amount,
        payment_status="Pending",
        work_completion_date=issue.updated_at,
        verification_date=datetime.now(timezone.utc) if issue.status == "Verified" else None,
        remarks=payload.remarks or "Prototype maintenance work payout record."
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment

@router.put("/{payment_id}/status", response_model=PaymentOut)
def update_payment_status(
    payment_id: int,
    status_str: str,
    db: Session = Depends(get_db),
    current_authority: User = Depends(get_current_authority)
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")

    status_upper = status_str.upper()
    if status_upper not in ["PENDING", "APPROVED", "PAID"]:
        raise HTTPException(status_code=400, detail="Invalid payment status. Must be Pending, Approved, or Paid.")

    payment.payment_status = status_upper.capitalize()
    db.commit()
    db.refresh(payment)
    return payment
