import os
import glob
import yaml
from pathlib import Path
from PIL import Image

DATASET_DIR = Path(__file__).resolve().parent.parent / "dataset"
IMAGES_DIR = DATASET_DIR / "images"
LABELS_DIR = DATASET_DIR / "labels"
YAML_PATH = DATASET_DIR / "data.yaml"

TARGET_CLASSES = {
    0: "pothole",
    1: "road_crack"
}

def validate_and_format_dataset(remap_manhole: bool = True):
    print(f"--- Validating dataset at: {DATASET_DIR} ---")
    splits = ["train", "val", "test"]
    
    total_images = 0
    total_labels = 0
    corrupted_images = 0
    missing_labels = 0
    invalid_lines = 0
    removed_manholes = 0
    
    for split in splits:
        img_split_dir = IMAGES_DIR / split
        lbl_split_dir = LABELS_DIR / split
        
        if not img_split_dir.exists():
            img_split_dir.mkdir(parents=True, exist_ok=True)
        if not lbl_split_dir.exists():
            lbl_split_dir.mkdir(parents=True, exist_ok=True)
            
        img_files = glob.glob(str(img_split_dir / "*.*"))
        print(f"\nSplit '{split}': Found {len(img_files)} images.")
        
        for img_path in img_files:
            total_images += 1
            # Check image integrity
            try:
                with Image.open(img_path) as img:
                    img.verify()
            except Exception as e:
                print(f"  [CORRUPTED IMAGE] {img_path}: {e}")
                corrupted_images += 1
                continue
            
            # Check corresponding label file
            base_name = Path(img_path).stem
            lbl_path = lbl_split_dir / f"{base_name}.txt"
            
            if not lbl_path.exists():
                missing_labels += 1
                continue
                
            total_labels += 1
            cleaned_lines = []
            
            with open(lbl_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
                
            for line in lines:
                parts = line.strip().split()
                if len(parts) != 5:
                    invalid_lines += 1
                    continue
                
                try:
                    cls_id = int(parts[0])
                    xc, yc, w, h = map(float, parts[1:])
                    
                    # 3-class mapping check: 0=pothole, 1=crack, 2=manhole
                    if cls_id == 2 and remap_manhole:
                        # Exclude manhole class as required
                        removed_manholes += 1
                        continue
                    elif cls_id in [0, 1]:
                        # Valid target class
                        cleaned_lines.append(f"{cls_id} {xc:.6f} {yc:.6f} {w:.6f} {h:.6f}\n")
                    else:
                        invalid_lines += 1
                except ValueError:
                    invalid_lines += 1

            # Rewrite cleaned label file if modified
            with open(lbl_path, "w", encoding="utf-8") as f:
                f.writelines(cleaned_lines)

    # Write standardized data.yaml
    data_yaml = {
        "path": str(DATASET_DIR.as_posix()),
        "train": "images/train",
        "val": "images/val",
        "test": "images/test",
        "names": TARGET_CLASSES
    }
    
    with open(YAML_PATH, "w", encoding="utf-8") as f:
        yaml.dump(data_yaml, f, default_flow_style=False)
        
    print("\n--- Dataset Validation Report ---")
    print(f"Total Images Inspected : {total_images}")
    print(f"Total Labels Inspected : {total_labels}")
    print(f"Missing Labels         : {missing_labels}")
    print(f"Corrupted Images       : {corrupted_images}")
    print(f"Invalid BBox Lines     : {invalid_lines}")
    print(f"Excluded 'manhole' BBoxes: {removed_manholes}")
    print(f"Standardized data.yaml written to: {YAML_PATH}")

if __name__ == "__main__":
    validate_and_format_dataset()
