from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str

class LoginRequest(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    role: str
    is_active: bool
    created_at: datetime

# --- Detection & Issue Schemas ---
class BBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float

class DetectionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    class_name: str
    confidence: float
    bbox_x1: float
    bbox_y1: float
    bbox_x2: float
    bbox_y2: float
    severity: str

# --- Assignment Schemas ---
class AssignmentCreate(BaseModel):
    issue_id: int
    worker_id: int
    notes: Optional[str] = None

class AssignmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    issue_id: int
    worker_id: int
    assigned_at: datetime
    notes: Optional[str] = None
    status: str

# --- Repair Proof Schemas ---
class RepairOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    issue_id: int
    worker_id: int
    proof_image_path: str
    completion_notes: Optional[str] = None
    submitted_at: datetime
    verification_status: str
    rejection_reason: Optional[str] = None
    verified_at: Optional[datetime] = None

class VerificationAction(BaseModel):
    action: str # "VERIFY" or "REJECT"
    rejection_reason: Optional[str] = None

# --- Report & Issue Schema ---
class ReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    report_id: str
    image_path: str
    annotated_image_path: Optional[str] = None
    latitude: float
    longitude: float
    location_name: Optional[str] = None
    description: Optional[str] = None
    status: str
    overall_severity: str
    created_at: datetime
    updated_at: datetime
    detections: List[DetectionOut] = []
    assignments: List[AssignmentOut] = []
    repairs: List[RepairOut] = []

# --- Worker Schemas ---
class WorkerCreate(BaseModel):
    name: str
    phone: str
    area: str
    specialization: Optional[str] = "General Maintenance"
    email: Optional[str] = None
    password: Optional[str] = None

class WorkerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    area: Optional[str] = None
    specialization: Optional[str] = None
    availability: Optional[bool] = None
    status: Optional[str] = None

class WorkerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: Optional[int] = None
    name: str
    phone: str
    area: str
    specialization: str
    availability: bool
    status: str
    created_at: datetime
    assigned_tasks_count: Optional[int] = 0
    pending_tasks_count: Optional[int] = 0
    in_progress_tasks_count: Optional[int] = 0
    completed_tasks_count: Optional[int] = 0
    current_workload: Optional[int] = 0

# --- Payment Schemas ---
class PaymentCreate(BaseModel):
    issue_id: int
    worker_id: int
    amount: float
    remarks: Optional[str] = None

class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    issue_id: int
    worker_id: int
    amount: float
    payment_status: str
    work_completion_date: Optional[datetime] = None
    verification_date: Optional[datetime] = None
    remarks: Optional[str] = None
    created_at: datetime
