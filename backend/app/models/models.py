from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="WORKER") # AUTHORITY, WORKER
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    worker_profile = relationship("Worker", back_populates="user", uselist=False)
    assignments_created = relationship("Assignment", back_populates="assigner")


class Worker(Base):
    __tablename__ = "workers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    area = Column(String(100), nullable=False)
    specialization = Column(String(100), nullable=False, default="General Maintenance")
    availability = Column(Boolean, default=True)
    status = Column(String(20), default="ACTIVE") # ACTIVE, INACTIVE
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="worker_profile")
    assignments = relationship("Assignment", back_populates="worker")
    repairs = relationship("Repair", back_populates="worker")
    payments = relationship("Payment", back_populates="worker")


class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(String(50), unique=True, index=True, nullable=False)
    image_path = Column(String(255), nullable=False)
    annotated_image_path = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_name = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String(30), default="Reported", index=True) # Reported, Assigned, Accepted, In Progress, Completed, Verified, Rejected
    overall_severity = Column(String(20), default="Medium") # Low, Medium, High, Critical
    created_at = Column(DateTime, default=utc_now, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    detections = relationship("Detection", back_populates="issue", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="issue", cascade="all, delete-orphan")
    repairs = relationship("Repair", back_populates="issue", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="issue", cascade="all, delete-orphan")


class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id", ondelete="CASCADE"), nullable=False)
    class_name = Column(String(50), nullable=False) # pothole, road_crack
    confidence = Column(Float, nullable=False)
    bbox_x1 = Column(Float, nullable=False)
    bbox_y1 = Column(Float, nullable=False)
    bbox_x2 = Column(Float, nullable=False)
    bbox_y2 = Column(Float, nullable=False)
    severity = Column(String(20), default="Medium")

    issue = relationship("Issue", back_populates="detections")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id", ondelete="CASCADE"), nullable=False)
    worker_id = Column(Integer, ForeignKey("workers.id", ondelete="CASCADE"), nullable=False)
    assigned_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_at = Column(DateTime, default=utc_now)
    notes = Column(Text, nullable=True)
    status = Column(String(30), default="Assigned") # Assigned, Accepted, In Progress, Completed

    issue = relationship("Issue", back_populates="assignments")
    worker = relationship("Worker", back_populates="assignments")
    assigner = relationship("User", back_populates="assignments_created")


class Repair(Base):
    __tablename__ = "repairs"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id", ondelete="CASCADE"), nullable=False)
    worker_id = Column(Integer, ForeignKey("workers.id", ondelete="CASCADE"), nullable=False)
    proof_image_path = Column(String(255), nullable=False)
    completion_notes = Column(Text, nullable=True)
    submitted_at = Column(DateTime, default=utc_now)
    verification_status = Column(String(20), default="Pending") # Pending, Verified, Rejected
    rejection_reason = Column(Text, nullable=True)
    verified_at = Column(DateTime, nullable=True)

    issue = relationship("Issue", back_populates="repairs")
    worker = relationship("Worker", back_populates="repairs")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id", ondelete="CASCADE"), nullable=False)
    worker_id = Column(Integer, ForeignKey("workers.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False, default=0.0)
    payment_status = Column(String(20), default="Pending") # Pending, Approved, Paid
    work_completion_date = Column(DateTime, nullable=True)
    verification_date = Column(DateTime, nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    issue = relationship("Issue", back_populates="payments")
    worker = relationship("Worker", back_populates="payments")
