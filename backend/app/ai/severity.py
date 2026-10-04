from typing import List, Dict, Any

class SeverityCalculator:
    """
    Rule-based prototype severity estimation based on:
    - Bounding box area relative to image total area
    - Detection confidence
    - Issue type (potholes usually present higher immediate risk than surface cracks)
    - Number of detections in single image
    """
    
    # Thresholds (configurable)
    CRITICAL_AREA_RATIO = 0.15  # >15% of image is damaged area
    HIGH_AREA_RATIO = 0.07      # >7% of image area
    MEDIUM_AREA_RATIO = 0.02    # >2% of image area
    
    @classmethod
    def calculate_detection_severity(cls, class_name: str, bbox_area_ratio: float, confidence: float) -> str:
        # Base level from relative area
        if bbox_area_ratio >= cls.CRITICAL_AREA_RATIO:
            base_severity = "Critical"
        elif bbox_area_ratio >= cls.HIGH_AREA_RATIO:
            base_severity = "High"
        elif bbox_area_ratio >= cls.MEDIUM_AREA_RATIO:
            base_severity = "Medium"
        else:
            base_severity = "Low"
            
        # Potholes with high confidence bump severity up if Medium/Low
        if class_name == "pothole" and confidence > 0.75:
            if base_severity == "Low":
                base_severity = "Medium"
            elif base_severity == "Medium" and bbox_area_ratio > 0.04:
                base_severity = "High"

        return base_severity

    @classmethod
    def calculate_overall_severity(cls, detections: List[Dict[str, Any]]) -> str:
        if not detections:
            return "Low"
            
        severities = [d.get("severity", "Low") for d in detections]
        
        if "Critical" in severities or len(detections) >= 4:
            return "Critical"
        elif "High" in severities or len(detections) >= 2:
            return "High"
        elif "Medium" in severities:
            return "Medium"
        return "Low"
