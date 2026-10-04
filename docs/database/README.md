# Database Schema & Entity Relationship Documentation

The system uses **MySQL 8.0** with **SQLAlchemy ORM** for persistent relational storage.

Database Name: `smartcity_monitoring`

---

## Entity Relationship Overview

```
[ User ] 1 ── 0..1 [ Worker ]
  │                     │
  │ (assigned_by)       │ (assigned_to)
  ▼                     ▼
[ Assignment ] ◄─── [ Issue ] ───► [ Detection ] (1..N)
                      │   │
                      │   └──► [ Repair ]
                      │
                      └──────► [ Payment ]
```

---

## Table Definitions

### 1. `users`
Stores user authentication accounts and role privileges.
- `id` (INT, PK, Auto-Increment)
- `username` (VARCHAR(50), Unique, Not Null)
- `email` (VARCHAR(100), Unique, Not Null)
- `password_hash` (VARCHAR(255), Not Null) - Hashed using bcrypt
- `role` (VARCHAR(20), Not Null) - `AUTHORITY` or `WORKER`
- `is_active` (BOOLEAN, Default True)
- `created_at` (DATETIME, Default UTC Now)

### 2. `workers`
Stores municipal maintenance worker profiles linked to user accounts.
- `id` (INT, PK, Auto-Increment)
- `user_id` (INT, FK -> `users.id`, OnDelete CASCADE)
- `name` (VARCHAR(100), Not Null)
- `phone` (VARCHAR(20), Not Null)
- `area` (VARCHAR(100), Not Null) - Zone/District assignment
- `specialization` (VARCHAR(100), Default 'General Maintenance')
- `availability` (BOOLEAN, Default True)
- `status` (VARCHAR(20), Default 'ACTIVE') - `ACTIVE`, `INACTIVE`
- `created_at` (DATETIME)

### 3. `issues`
Core entity storing road infrastructure defect reports.
- `id` (INT, PK, Auto-Increment)
- `report_id` (VARCHAR(50), Unique, Not Null, Index) - e.g., `REP-2026-X89F`
- `image_path` (VARCHAR(255), Not Null) - File system path to original uploaded photo
- `annotated_image_path` (VARCHAR(255)) - File system path to YOLOv8 annotated photo
- `latitude` (FLOAT, Not Null)
- `longitude` (FLOAT, Not Null)
- `location_name` (VARCHAR(255))
- `description` (TEXT)
- `status` (VARCHAR(30), Default 'Reported', Index) - `Reported`, `Assigned`, `Accepted`, `In Progress`, `Completed`, `Verified`, `Rejected`
- `overall_severity` (VARCHAR(20), Default 'Medium') - `Low`, `Medium`, `High`, `Critical`
- `created_at` (DATETIME, Default UTC Now)
- `updated_at` (DATETIME, OnUpdate UTC Now)

### 4. `detections`
Stores individual YOLOv8 object detections per issue.
- `id` (INT, PK, Auto-Increment)
- `issue_id` (INT, FK -> `issues.id`, OnDelete CASCADE)
- `class_name` (VARCHAR(50), Not Null) - `pothole`, `road_crack`
- `confidence` (FLOAT, Not Null) - Detection confidence score (0.00 to 1.00)
- `bbox_x1`, `bbox_y1`, `bbox_x2`, `bbox_y2` (FLOAT) - Bounding box pixel coordinates
- `severity` (VARCHAR(20))

### 5. `assignments`
Tracks task dispatches from authority users to municipal workers.
- `id` (INT, PK, Auto-Increment)
- `issue_id` (INT, FK -> `issues.id`, OnDelete CASCADE)
- `worker_id` (INT, FK -> `workers.id`, OnDelete CASCADE)
- `assigned_by` (INT, FK -> `users.id`)
- `assigned_at` (DATETIME)
- `notes` (TEXT)
- `status` (VARCHAR(30), Default 'Assigned')

### 6. `repairs`
Stores worker repair completion proof images and verification notes.
- `id` (INT, PK, Auto-Increment)
- `issue_id` (INT, FK -> `issues.id`, OnDelete CASCADE)
- `worker_id` (INT, FK -> `workers.id`, OnDelete CASCADE)
- `proof_image_path` (VARCHAR(255), Not Null)
- `completion_notes` (TEXT)
- `submitted_at` (DATETIME)
- `verification_status` (VARCHAR(20), Default 'Pending') - `Pending`, `Verified`, `Rejected`
- `rejection_reason` (TEXT)
- `verified_at` (DATETIME)

### 7. `payments`
Maintains audit records for work completion payouts (record-management only).
- `id` (INT, PK, Auto-Increment)
- `issue_id` (INT, FK -> `issues.id`, OnDelete CASCADE)
- `worker_id` (INT, FK -> `workers.id`, OnDelete CASCADE)
- `amount` (FLOAT, Default 0.0)
- `payment_status` (VARCHAR(20), Default 'Pending') - `Pending`, `Approved`, `Paid`
- `work_completion_date` (DATETIME)
- `verification_date` (DATETIME)
- `remarks` (TEXT)
- `created_at` (DATETIME)
