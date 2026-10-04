import os
import sys
import glob
import argparse
import shutil
from pathlib import Path
from ultralytics import YOLO

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
DATASET_YAML = ROOT_DIR / "ai-model" / "dataset" / "data.yaml"
RUNS_DIR = ROOT_DIR / "ai-model" / "runs"
MODEL_DEPLOY_DIR = ROOT_DIR / "backend" / "app" / "ai" / "models"

def train(args):
    print("--- Starting YOLOv8 Model Training Pipeline ---")
    
    # 1. Check dataset availability
    train_images = glob.glob(str(ROOT_DIR / "ai-model" / "dataset" / "images" / "train" / "*.*"))
    if not train_images:
        print("[WARNING] Dataset training images directory is currently empty!")
        print("Model training cannot be executed without training images.")
        print("Please place annotated dataset images in `ai-model/dataset/images/train/` and `labels/train/`.")
        return False
        
    if not DATASET_YAML.exists():
        print(f"[ERROR] {DATASET_YAML} not found. Run validate_dataset.py first.")
        return False

    # 2. Load Pretrained YOLOv8 Model
    print(f"Loading pretrained model: {args.model}")
    model = YOLO(args.model)
    
    # 3. Execute Training
    print(f"Training parameters: epochs={args.epochs}, imgsz={args.imgsz}, batch={args.batch}, device={args.device}")
    results = model.train(
        data=str(DATASET_YAML),
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        device=args.device,
        workers=args.workers,
        project=str(RUNS_DIR / "detect"),
        name=args.name,
        exist_ok=True
    )
    
    # 4. Copy best.pt to backend deployment path
    best_weights = RUNS_DIR / "detect" / args.name / "weights" / "best.pt"
    if best_weights.exists():
        MODEL_DEPLOY_DIR.mkdir(parents=True, exist_ok=True)
        target_pt = MODEL_DEPLOY_DIR / "best.pt"
        shutil.copy(str(best_weights), str(target_pt))
        print(f"[SUCCESS] Model training complete. Deployed best.pt to: {target_pt}")
        return True
    else:
        print("[WARNING] Training finished but best.pt weight file was not found.")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Configurable YOLOv8 Fine-Tuning Script")
    parser.add_argument("--model", type=str, default="yolov8n.pt", help="Pretrained model (default: yolov8n.pt)")
    parser.add_argument("--epochs", type=int, default=10, help="Number of training epochs")
    parser.add_argument("--batch", type=int, default=16, help="Batch size")
    parser.add_argument("--imgsz", type=int, default=640, help="Image size")
    parser.add_argument("--device", type=str, default="cpu", help="Device (cpu or 0 for CUDA)")
    parser.add_argument("--workers", type=int, default=2, help="Number of dataloader workers")
    parser.add_argument("--name", type=str, default="train", help="Run name")
    
    args = parser.parse_args()
    train(args)
