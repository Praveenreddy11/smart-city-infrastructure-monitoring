import os
import cv2
import numpy as np
from pathlib import Path
from typing import Dict, Any, List
from PIL import Image

from backend.app.ai.model_loader import ModelLoader
from backend.app.ai.severity import SeverityCalculator
from backend.app.core.config import settings

# Supported target detection classes
SUPPORTED_CLASSES = ["pothole", "road_crack"]

# Mappings for standard/pretrained model class names to smart city domain classes
CLASS_MAPPINGS = {
    "pothole": "pothole",
    "crack": "road_crack",
    "road_crack": "road_crack",
}

def run_detection(image_path: str) -> Dict[str, Any]:
    """
    Executes YOLOv8 object detection on the given image path.
    Renders bounding boxes and saves annotated output image.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found at {image_path}")

    # Load OpenCV image for drawing
    img_bgr = cv2.imread(image_path)
    if img_bgr is None:
        raise ValueError(f"Could not decode image at {image_path}")

    img_height, img_width = img_bgr.shape[:2]
    img_area = float(img_height * img_width)

    # Get model instance
    model = ModelLoader.get_model()
    results = model.predict(image_path, conf=settings.CONFIDENCE_THRESHOLD)

    detections = []
    annotated_bgr = img_bgr.copy()

    for r in results:
        boxes = r.boxes
        for box in boxes:
            cls_id = int(box.cls[0])
            raw_class_name = str(model.names[cls_id]).lower()
            confidence = float(box.conf[0])
            
            # Map raw class to domain class if applicable
            target_class = CLASS_MAPPINGS.get(raw_class_name, None)
            
            # If using generic pretrained model (e.g. COCO), allow fallback mapping if relevant
            if target_class is None:
                # If model is standard COCO, map relevant road anomalies if any or treat as pothole/road_crack
                if raw_class_name in ["hole", "cavity"]:
                    target_class = "pothole"
                elif raw_class_name in ["fracture", "fissure"]:
                    target_class = "road_crack"

            # Strict domain requirement: Only report pothole or road_crack
            if target_class not in SUPPORTED_CLASSES:
                continue

            xyxy = box.xyxy[0].cpu().numpy()
            x1, y1, x2, y2 = float(xyxy[0]), float(xyxy[1]), float(xyxy[2]), float(xyxy[3])
            
            bbox_w = max(0, x2 - x1)
            bbox_h = max(0, y2 - y1)
            bbox_area = bbox_w * bbox_h
            area_ratio = bbox_area / img_area if img_area > 0 else 0.0

            # Estimate severity for single detection
            det_severity = SeverityCalculator.calculate_detection_severity(
                target_class, area_ratio, confidence
            )

            detection_item = {
                "class_name": target_class,
                "confidence": round(confidence, 4),
                "bbox": {
                    "x1": round(x1, 2),
                    "y1": round(y1, 2),
                    "x2": round(x2, 2),
                    "y2": round(y2, 2)
                },
                "severity": det_severity
            }
            detections.append(detection_item)

            # Draw bounding box & text on annotated image
            color = (0, 0, 255) if target_class == "pothole" else (255, 165, 0)
            if det_severity == "Critical":
                color = (0, 0, 255) # Red
            elif det_severity == "High":
                color = (0, 140, 255) # Orange-Red
            elif det_severity == "Medium":
                color = (0, 215, 255) # Yellow-Orange
            else:
                color = (0, 255, 0) # Green

            cv2.rectangle(annotated_bgr, (int(x1), int(y1)), (int(x2), int(y2)), color, 3)
            
            label_text = f"{target_class} ({det_severity}) {confidence:.2f}"
            (text_w, text_h), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
            
            cv2.rectangle(
                annotated_bgr,
                (int(x1), max(0, int(y1) - text_h - 10)),
                (int(x1) + text_w + 10, int(y1)),
                color,
                -1
            )
            cv2.putText(
                annotated_bgr,
                label_text,
                (int(x1) + 5, max(15, int(y1) - 5)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255, 255, 255),
                2
            )

    # Save annotated image
    base_name = Path(image_path).name
    annotated_filename = f"annotated_{base_name}"
    annotated_save_path = os.path.join(settings.ANNOTATED_UPLOADS, annotated_filename)
    cv2.imwrite(annotated_save_path, annotated_bgr)

    # Compute overall issue severity
    overall_severity = SeverityCalculator.calculate_overall_severity(detections)

    return {
        "detections": detections,
        "overall_severity": overall_severity,
        "annotated_image_path": annotated_save_path,
        "total_detections": len(detections)
    }
