import os
import shutil
import random
import yaml
from pathlib import Path
from PIL import Image

SOURCE_DIR = Path(r"C:\Users\kurva\Downloads\cracks_pathholes\data")
SOURCE_IMAGES_DIR = SOURCE_DIR / "images"
SOURCE_LABELS_DIR = SOURCE_DIR / "labels-YOLO"

PROJECT_DATASET_DIR = Path(__file__).resolve().parent.parent / "dataset"
DEST_IMAGES_DIR = PROJECT_DATASET_DIR / "images"
DEST_LABELS_DIR = PROJECT_DATASET_DIR / "labels"
YAML_PATH = PROJECT_DATASET_DIR / "data.yaml"

TARGET_CLASSES = {
    0: "pothole",
    1: "road_crack"
}

def prepare_and_validate_dataset(seed: int = 42):
    print("==================================================")
    print("     PREPARING & SPLITTING REAL ROAD DATASET     ")
    print("==================================================")
    print(f"Source Dataset Path: {SOURCE_DIR}")
    print(f"Project Target Path: {PROJECT_DATASET_DIR}")
    print(f"Random Seed        : {seed}\n")

    if not SOURCE_DIR.exists():
        raise FileNotFoundError(f"Source dataset directory not found at: {SOURCE_DIR}")

    # 1. Inspect source files
    image_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    source_images = [f for f in SOURCE_IMAGES_DIR.iterdir() if f.is_file() and f.suffix.lower() in image_extensions]
    original_image_count = len(source_images)
    print(f"Original Image Count Found : {original_image_count}")

    usable_dataset = [] # List of tuples: (image_path, base_name, cleaned_label_lines)
    excluded_manhole_only_count = 0
    missing_label_count = 0
    total_processed_potholes = 0
    total_processed_cracks = 0
    total_removed_manholes = 0
    invalid_coord_count = 0

    for img_path in source_images:
        base_name = img_path.stem
        lbl_path = SOURCE_LABELS_DIR / f"{base_name}.txt"

        if not lbl_path.exists():
            missing_label_count += 1
            continue

        cleaned_lines = []
        with open(lbl_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

        for line in lines:
            parts = line.strip().split()
            if len(parts) != 5:
                continue

            try:
                cls_id = int(parts[0])
                xc, yc, w, h = map(float, parts[1:])

                # Validate coordinates range
                if not (0.0 <= xc <= 1.0 and 0.0 <= yc <= 1.0 and 0.0 <= w <= 1.0 and 0.0 <= h <= 1.0):
                    invalid_coord_count += 1

                if cls_id == 2:
                    # Remove class 2 (manhole)
                    total_removed_manholes += 1
                    continue
                elif cls_id == 0:
                    cleaned_lines.append(f"0 {xc:.6f} {yc:.6f} {w:.6f} {h:.6f}\n")
                    total_processed_potholes += 1
                elif cls_id == 1:
                    cleaned_lines.append(f"1 {xc:.6f} {yc:.6f} {w:.6f} {h:.6f}\n")
                    total_processed_cracks += 1
            except ValueError:
                continue

        if len(cleaned_lines) == 0:
            # Image contained only class 2 (manhole) or no valid annotations
            excluded_manhole_only_count += 1
        else:
            usable_dataset.append((img_path, base_name, cleaned_lines))

    final_usable_count = len(usable_dataset)
    print(f"Images Excluded (Manhole Only / No Annotations) : {excluded_manhole_only_count}")
    print(f"Final Usable Image Count                        : {final_usable_count}")
    print(f"Total Processed 'pothole' (0) Annotations       : {total_processed_potholes}")
    print(f"Total Processed 'road_crack' (1) Annotations     : {total_processed_cracks}")
    print(f"Total Removed 'manhole' (2) Bounding Boxes       : {total_removed_manholes}\n")

    # 2. Shuffle reproducibly & split into 80% train, 10% val, 10% test
    random.seed(seed)
    random.shuffle(usable_dataset)

    train_end = int(final_usable_count * 0.80)
    val_end = train_end + int(final_usable_count * 0.10)

    train_set = usable_dataset[:train_end]
    val_set = usable_dataset[train_end:val_end]
    test_set = usable_dataset[val_end:]

    print(f"Train Set Count      : {len(train_set)}")
    print(f"Validation Set Count : {len(val_set)}")
    print(f"Test Set Count       : {len(test_set)}")
    print(f"Total Split Sum      : {len(train_set) + len(val_set) + len(test_set)}\n")

    # 3. Prepare clean destination project directory structure
    def clear_folder(folder_path: Path):
        folder_path.mkdir(parents=True, exist_ok=True)
        for item in folder_path.iterdir():
            if item.is_file() or item.is_symlink():
                try:
                    item.unlink()
                except Exception as e:
                    pass
            elif item.is_dir():
                shutil.rmtree(item, ignore_errors=True)

    for split in ["train", "val", "test"]:
        img_dir = DEST_IMAGES_DIR / split
        lbl_dir = DEST_LABELS_DIR / split
        clear_folder(img_dir)
        clear_folder(lbl_dir)

    # 4. Copy images and write label files
    splits = [("train", train_set), ("val", val_set), ("test", test_set)]

    for split_name, items in splits:
        img_dest_folder = DEST_IMAGES_DIR / split_name
        lbl_dest_folder = DEST_LABELS_DIR / split_name

        for src_img_path, base_name, label_lines in items:
            # Copy image file
            target_img_path = img_dest_folder / src_img_path.name
            shutil.copy2(src_img_path, target_img_path)

            # Write clean YOLO label file
            target_lbl_path = lbl_dest_folder / f"{base_name}.txt"
            with open(target_lbl_path, "w", encoding="utf-8") as f:
                f.writelines(label_lines)

    # 5. Write standardized data.yaml
    data_yaml_content = {
        "path": PROJECT_DATASET_DIR.as_posix(),
        "train": "images/train",
        "val": "images/val",
        "test": "images/test",
        "names": TARGET_CLASSES
    }

    with open(YAML_PATH, "w", encoding="utf-8") as f:
        yaml.dump(data_yaml_content, f, default_flow_style=False, sort_keys=False)

    print(f"Written clean data.yaml to: {YAML_PATH}\n")

    # 6. Comprehensive Validation Audit
    print("==================================================")
    print("        RUNNING FINAL DATASET VALIDATION          ")
    print("==================================================")

    class2_detected = False
    invalid_labels = False
    mismatched_files = False
    total_labels_written = 0

    for split_name in ["train", "val", "test"]:
        img_folder = DEST_IMAGES_DIR / split_name
        lbl_folder = DEST_LABELS_DIR / split_name

        images_in_split = list(img_folder.glob("*.*"))
        labels_in_split = list(lbl_folder.glob("*.txt"))

        if len(images_in_split) != len(labels_in_split):
            print(f"[FAIL] Split '{split_name}' count mismatch: {len(images_in_split)} images vs {len(labels_in_split)} labels.")
            mismatched_files = True

        for lbl_file in labels_in_split:
            total_labels_written += 1
            with open(lbl_file, "r", encoding="utf-8") as f:
                l_lines = f.readlines()

            if len(l_lines) == 0:
                print(f"[FAIL] Empty label file found in processed dataset: {lbl_file}")
                invalid_labels = True

            for l_line in l_lines:
                p = l_line.strip().split()
                c_id = int(p[0])
                if c_id not in [0, 1]:
                    print(f"[FAIL] Invalid class ID {c_id} found in {lbl_file}")
                    class2_detected = True

    validation_passed = (not class2_detected) and (not invalid_labels) and (not mismatched_files)

    print(f"Total Processed Label Files Written : {total_labels_written}")
    print(f"Class 2 (Manhole) Completely Removed : {'YES (PASSED)' if not class2_detected else 'NO (FAILED)'}")
    print(f"Image & Label Counts Matched        : {'YES (PASSED)' if not mismatched_files else 'NO (FAILED)'}")
    print(f"No Empty Label Files                : {'YES (PASSED)' if not invalid_labels else 'NO (FAILED)'}")
    print(f"Overall Validation Result           : {'PASSED' if validation_passed else 'FAILED'}")
    print("==================================================\n")

    return {
        "original_image_count": original_image_count,
        "excluded_manhole_only_count": excluded_manhole_only_count,
        "final_usable_count": final_usable_count,
        "train_count": len(train_set),
        "val_count": len(val_set),
        "test_count": len(test_set),
        "total_labels_written": total_labels_written,
        "class2_removed": not class2_detected,
        "dataset_path": str(PROJECT_DATASET_DIR),
        "validation_passed": validation_passed
    }

if __name__ == "__main__":
    prepare_and_validate_dataset()
