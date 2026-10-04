# Smart City Infrastructure Monitoring — API Documentation

Interactive API documentation is automatically exposed by FastAPI at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## Endpoint Groups Summary

### 1. Health & Core
- `GET /health`: System health check verifying API operational status, MySQL database connection state, and YOLOv8 model loading status.

### 2. Authentication (`/api/auth`)
- `POST /api/auth/login`: Authenticate Authority or Worker users via JWT standard Bearer tokens.
- `GET /api/auth/me`: Retrieve current logged-in user identity and assigned role.

### 3. Public Citizen Reporting (`/api/public`)
- `POST /api/public/reports`: Public issue submission (Upload image, latitude, longitude, location name, description). Runs live YOLOv8 AI object detection, computes prototype severity rating, generates unique `report_id` (e.g., `REP-2026-X89F`), and stores record in MySQL.
- `GET /api/public/track/{report_id}`: Track public issue status timeline (`Reported` → `Assigned` → `Accepted` → `In Progress` → `Completed` → `Verified`).

### 4. Government Authority Management (`/api/authority`)
- `GET /api/authority/issues`: List, filter (by status, severity), and search all reported infrastructure issues.
- `GET /api/authority/issues/{issue_id}`: View detailed issue report with AI bounding boxes and assigned worker info.
- `POST /api/authority/assign`: Assign/dispatch a registered municipal worker to an issue.
- `POST /api/authority/verify/{issue_id}`: Review worker repair proof image; approve (`Verified`) or reject (`Assigned`) with feedback.
- `GET /api/authority/health-score`: Compute dynamic 0–100 Infrastructure Health Score from database records.
- `GET /api/authority/analytics`: Aggregated metrics for Recharts visual dashboard (issues by type, severity, status).

### 5. Municipal Workers (`/api/workers` & `/api/worker`)
- `GET /api/workers`: Authority list of registered municipal workers.
- `POST /api/workers`: Authority endpoint to register new municipal maintenance worker.
- `PUT /api/workers/{worker_id}`: Edit worker profile or toggle status (`ACTIVE`/`INACTIVE`).
- `GET /api/worker/tasks`: Worker dashboard list of assigned dispatches.
- `PUT /api/worker/tasks/{issue_id}/status`: Worker state update (`Accepted` → `In Progress`).
- `POST /api/worker/tasks/{issue_id}/repair-proof`: Worker upload of after-repair proof photograph and work notes (status transitions to `Completed`).

### 6. Work & Payment Records (`/api/payments`)
- `GET /api/payments`: Audit list of work completion and payout records.
- `POST /api/payments`: Record payout amount and remarks for completed tasks.
- `PUT /api/payments/{payment_id}/status`: Update payment record status (`Pending` → `Approved` → `Paid`).
