import os
from pathlib import Path
from ultralytics import YOLO
from backend.app.core.config import settings

class ModelLoader:
    _instance = None
    _model = None
    _model_path_used = None

    @classmethod
    def get_model(cls) -> YOLO:
        if cls._model is None:
            cls.load_model()
        return cls._model

    @classmethod
    def load_model(cls):
        # Candidate model weight paths
        candidates = [
            Path(settings.MODEL_PATH),
            Path(__file__).resolve().parent / "models" / "best.pt",
            Path("ai-model/runs/detect/train/weights/best.pt")
        ]
        
        target_path = None
        for candidate in candidates:
            if candidate.exists():
                target_path = str(candidate)
                break
                
        if not target_path:
            print("[INFO] Custom trained weights not found. Loading pretrained YOLOv8n model.")
            target_path = "yolov8n.pt"
            
        print(f"--- Loading YOLOv8 model from: {target_path} ---")
        cls._model = YOLO(target_path)
        cls._model_path_used = target_path
        print("YOLOv8 Model successfully loaded into memory.")

    @classmethod
    def get_info(cls):
        return {
            "loaded": cls._model is not None,
            "weights_path": cls._model_path_used
        }
