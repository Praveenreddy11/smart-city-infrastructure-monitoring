# Project Notes — Smart City AI Infrastructure Monitoring System

- **Project Status**: Full-stack application implemented.
- **Backend**: FastAPI with JWT Auth, OpenCV/YOLOv8 AI Inference Pipeline, SQLAlchemy MySQL ORM models, dynamic Infrastructure Health Score service, and public report tracking.
- **Frontend**: React + Vite SPA with Leaflet maps, Recharts visual analytics dashboard, Authority management portal, Worker task portal, and Public citizen report submission.
- **AI Computer Vision**: Ultralytics YOLOv8 pipeline configured for `pothole` (ID 0) and `road_crack` (ID 1), dataset conversion & validation scripts implemented under `ai-model/training/`.
- **Database**: MySQL schema ready with automated setup script `database/init_db.py`.
