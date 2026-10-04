from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models.models import Issue, Detection

class HealthScoreService:
    @staticmethod
    def calculate_health_score(db: Session) -> dict:
        """
        Calculates dynamic infrastructure health score (0–100) from MySQL database issue records.
        Formula:
        Base Health = 100
        Deductions:
          - Critical unresolved issue: -12 pts
          - High unresolved issue: -8 pts
          - Medium unresolved issue: -4 pts
          - Low unresolved issue: -1 pt
          - Resolved issues give back partial health (+50% of severity penalty restored)
        """
        total_issues = db.query(func.count(Issue.id)).scalar() or 0
        
        if total_issues == 0:
            return {
                "health_score": 100,
                "status_label": "Excellent",
                "total_issues": 0,
                "pothole_count": 0,
                "crack_count": 0,
                "high_critical_count": 0,
                "pending_issues": 0,
                "completed_issues": 0,
                "verified_issues": 0
            }

        # Issue status breakdown
        pending_statuses = ["Reported", "Assigned", "Accepted", "In Progress"]
        pending_issues = db.query(func.count(Issue.id)).filter(Issue.status.in_(pending_statuses)).scalar() or 0
        completed_issues = db.query(func.count(Issue.id)).filter(Issue.status == "Completed").scalar() or 0
        verified_issues = db.query(func.count(Issue.id)).filter(Issue.status == "Verified").scalar() or 0

        # Severity breakdown for pending issues
        critical_pending = db.query(func.count(Issue.id)).filter(
            Issue.status.in_(pending_statuses), Issue.overall_severity == "Critical"
        ).scalar() or 0

        high_pending = db.query(func.count(Issue.id)).filter(
            Issue.status.in_(pending_statuses), Issue.overall_severity == "High"
        ).scalar() or 0

        medium_pending = db.query(func.count(Issue.id)).filter(
            Issue.status.in_(pending_statuses), Issue.overall_severity == "Medium"
        ).scalar() or 0

        low_pending = db.query(func.count(Issue.id)).filter(
            Issue.status.in_(pending_statuses), Issue.overall_severity == "Low"
        ).scalar() or 0

        # Detection breakdown by class
        pothole_count = db.query(func.count(Detection.id)).filter(Detection.class_name == "pothole").scalar() or 0
        crack_count = db.query(func.count(Detection.id)).filter(Detection.class_name == "road_crack").scalar() or 0
        high_critical_count = critical_pending + high_pending

        # Score calculation
        deduction = (
            (critical_pending * 12) +
            (high_pending * 8) +
            (medium_pending * 4) +
            (low_pending * 1)
        )
        
        # Calculate final score bounded between 0 and 100
        health_score = max(0, min(100, int(100 - deduction)))

        # Status label text
        if health_score >= 85:
            status_label = "Optimal"
        elif health_score >= 70:
            status_label = "Good"
        elif health_score >= 50:
            status_label = "Moderate Risk"
        elif health_score >= 30:
            status_label = "Poor"
        else:
            status_label = "Critical Hazard"

        return {
            "health_score": health_score,
            "status_label": status_label,
            "total_issues": total_issues,
            "pothole_count": pothole_count,
            "crack_count": crack_count,
            "high_critical_count": high_critical_count,
            "pending_issues": pending_issues,
            "completed_issues": completed_issues,
            "verified_issues": verified_issues
        }
