import os
import json
import glob
from pathlib import Path
from ultralytics import YOLO

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
DATASET_YAML = ROOT_DIR / "ai-model" / "dataset" / "data.yaml"
EVAL_DIR = ROOT_DIR / "ai-model" / "evaluation"
BEST_WEIGHTS = ROOT_DIR / "ai-model" / "runs" / "detect" / "train" / "weights" / "best.pt"

def evaluate_model():
    EVAL_DIR.mkdir(parents=True, exist_ok=True)
    metrics_file = EVAL_DIR / "metrics.json"
    
    # Check if custom best.pt exists
    weights_path = BEST_WEIGHTS if BEST_WEIGHTS.exists() else ROOT_DIR / "backend" / "app" / "ai" / "models" / "best.pt"
    
    val_images = glob.glob(str(ROOT_DIR / "ai-model" / "dataset" / "images" / "val" / "*.*"))
    if not weights_path.exists() or not val_images:
        print("[INFO] Model training not yet executed or validation set empty.")
        data = {
            "status": "Model training not yet executed.",
            "metrics": None,
            "note": "To train model, add dataset images and run `python ai-model/training/train.py`."
        }
        with open(metrics_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print(f"Recorded evaluation status to: {metrics_file}")
        return
        
    print(f"Evaluating model weights at: {weights_path}")
    model = YOLO(str(weights_path))
    results = model.val(data=str(DATASET_YAML))
    
    metrics = {
        "status": "Evaluation Complete",
        "precision": float(results.results_dict.get("metrics/precision(B)", 0)),
        "recall": float(results.results_dict.get("metrics/recall(B)", 0)),
        "mAP50": float(results.results_dict.get("metrics/mAP50(B)", 0)),
        "mAP50-95": float(results.results_dict.get("metrics/mAP50-95(B)", 0))
    }
    
    with open(metrics_file, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
        
    print(f"Saved evaluation metrics to {metrics_file}: {metrics}")

if __name__ == "__main__":
    evaluate_model()
