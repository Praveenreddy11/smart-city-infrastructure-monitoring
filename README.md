# AI-Enabled Infrastructure Monitoring System for Smart Cities

A functional, full-stack, web-based Smart City infrastructure monitoring platform using **YOLOv8 computer vision**, **FastAPI**, **MySQL**, and **React + Vite**. The platform enables public citizens to report road hazards (potholes and road cracks), automatically performs object detection and prototype severity estimation, and provides government authorities and municipal workers with a complete dispatch, verification, and work logging workflow.

---

## Key Features

1. **Public Reporting Portal (No Login Required)**
   - Upload road damage photographs.
   - Interactive OpenStreetMap location selection with GPS geolocation support.
   - Live YOLOv8 object detection returns bounding box coordinates, confidence scores, and severity ratings.
   - Unique Report ID generation (e.g., `REP-2026-X89F`) for public status tracking.

2. **YOLOv8 Computer Vision Pipeline**
   - Detects domain-specific classes: `pothole` (Class 0) and `road_crack` (Class 1).
   - Strictly converts 3-class datasets by filtering out unsupported classes such as `manhole`.
   - Rule-based prototype severity estimation (`Low`, `Medium`, `High`, `Critical`) based on bounding box relative surface area and confidence.
   - Output images with colored bounding boxes rendered and saved dynamically.

3. **Government Authority Dashboard (JWT Auth Required)**
   - Real-time **Infrastructure Health Score (0–100)** calculated dynamically from MySQL database records.
   - Interactive visual analytics powered by **Recharts** (issues by type, severity, and status pipeline).
   - Filterable issues table and detail view.
   - Interactive GIS map view with color-coded markers powered by **Leaflet & OpenStreetMap**.
   - Municipal worker management (register workers, edit profile, toggle status).
   - Task dispatching to registered municipal workers.
   - **Repair Proof Verification**: Side-by-side comparison of original report photo vs. worker after-repair proof photo with Approve/Verify or Reject actions.
   - Work & payment record management.

4. **Municipal Worker Dashboard (JWT Auth Required)**
   - Task management view for assigned dispatches.
   - Workflow state updates (`Accepted` → `In Progress`).
   - Upload after-repair proof photograph and completion notes (transitions status to `Completed`).

---

## Approved Technology Stack

- **Frontend**: React 18, Vite, JavaScript, React Router DOM, Axios, Recharts, Leaflet + React-Leaflet, Lucide Icons.
- **Backend**: Python 3.13, FastAPI, SQLAlchemy ORM, PyMySQL, Pydantic, PyJWT, passlib/bcrypt, python-dotenv.
- **AI / Computer Vision**: Ultralytics YOLOv8 (`yolov8n.pt`), OpenCV, PyTorch, PIL.
- **Database**: MySQL 8.0.

---

## Project Directory Structure

```
fouroneproj/
├── ai-model/
│   ├── dataset/
│   │   ├── images/ ({train, val, test})
│   │   ├── labels/ ({train, val, test})
│   │   └── data.yaml
│   ├── training/
│   │   ├── validate_dataset.py
│   │   ├── train.py
│   │   ├── evaluate.py
│   │   └── infer_test.py
│   ├── evaluation/
│   │   └── metrics.json
│   └── runs/
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   │   ├── detector.py
│   │   │   ├── model_loader.py
│   │   │   └── severity.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   ├── database/
│   │   │   └── session.py
│   │   ├── models/
│   │   │   └── models.py
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── authority.py
│   │   │   ├── deps.py
│   │   │   ├── payments.py
│   │   │   ├── public_reports.py
│   │   │   └── workers.py
│   │   ├── schemas/
│   │   │   └── schemas.py
│   │   ├── services/
│   │   │   └── health_score.py
│   │   └── main.py
│   ├── tests/
│   │   └── test_api.py
│   ├── uploads/
│   │   ├── repair_proofs/
│   │   └── reports/ (annotated/)
│   └── .env
├── database/
│   └── init_db.py
├── docs/
│   ├── api/
│   ├── architecture/
│   └── database/
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── context/
    │   ├── pages/
    │   ├── services/
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

---

## Setup & Running Instructions

### 1. Database Configuration (MySQL)
Ensure MySQL server is running locally on port 3306. Update `backend/.env` with your MySQL credentials:
```env
DATABASE_URL=mysql+pymysql://root:YOUR_MYSQL_PASSWORD@localhost:3306/smartcity_monitoring
SECRET_KEY=smartcity_monitoring_jwt_secret_key_2026_super_secure
```

Initialize the database schema and seed development accounts:
```bash
python database/init_db.py
```

### 2. Backend Setup & Server Start
Navigate to project root and run FastAPI server with Uvicorn:
```bash
uvicorn backend.app.main:app --reload --port 8000
```
FastAPI documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- Health Endpoint: `http://localhost:8000/health`

### 3. Frontend Setup & Development Server
In `frontend/` directory, install dependencies and start Vite dev server:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Development Demo Accounts

| Role | Email | Password | Access Portal |
|---|---|---|---|
| **Government Authority** | `admin@smartcity.gov` | `Admin@123` | `/authority/login` |
| **Municipal Worker** | `worker1@smartcity.gov` | `Worker@123` | `/worker/login` |
| **Public Citizen** | No Login Required | N/A | `/report` & `/track` |

---

## AI Model Dataset Preparation & Training

1. **Dataset Validation**:
   Validate YOLO annotations and convert 3-class datasets (removing `manhole` class to keep `0: pothole`, `1: road_crack`):
   ```bash
   python ai-model/training/validate_dataset.py
   ```
2. **YOLOv8 Fine-Tuning**:
   Execute fine-tuning on custom dataset images:
   ```bash
   python ai-model/training/train.py --epochs 10 --batch 16 --imgsz 640 --device cpu
   ```
3. **Evaluation & Test Inference**:
   ```bash
   python ai-model/training/evaluate.py
   python ai-model/training/infer_test.py --image path/to/sample.jpg
   ```

---

## System Limitations & Disclaimer

- **Academic Prototype**: This system is designed as an educational/academic prototype. It does not claim integration with real municipal corporations, live government databases, or real payment gateways.
- **Severity Rating**: Damage severity (`Low`, `Medium`, `High`, `Critical`) is a rule-based prototype estimation calculated from bounding box relative surface area and confidence scores, not a scientifically certified road engineering standard.
- **Payment Records**: The payment module is a work-logging record system and does not execute actual financial transactions.
