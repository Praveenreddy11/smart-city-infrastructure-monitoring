import sys
import argparse
from pathlib import Path
from ultralytics import YOLO

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
BEST_WEIGHTS = ROOT_DIR / "ai-model" / "runs" / "detect" / "train" / "weights" / "best.pt"

def test_inference(image_path: str):
    weights = str(BEST_WEIGHTS) if BEST_WEIGHTS.exists() else "yolov8n.pt"
    print(f"Running test inference with model: {weights} on image: {image_path}")
    
    model = YOLO(weights)
    results = model.predict(image_path, conf=0.25)
    
    for r in results:
        boxes = r.boxes
        print(f"Total detections: {len(boxes)}")
        for box in boxes:
            cls_id = int(box.cls[0])
            name = model.names[cls_id]
            conf = float(box.conf[0])
            xyxy = box.xyxy[0].tolist()
            print(f"  - Class: {name} (ID: {cls_id}), Confidence: {conf:.2f}, Box: {xyxy}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", type=str, required=True, help="Path to input image for testing")
    args = parser.parse_args()
    test_inference(args.image)
