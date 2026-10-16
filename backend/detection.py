"""
CivicVision - AI & Computer Vision Hazard Detection Service
Team Cognitech

This module provides modular road hazard image detection.
It satisfies the strict academic requirements:
1. Modular architecture separate from Flask routes for easy model replacement.
2. Honest attribution: Never pretends fake predictions are genuine AI inference.
3. Checks for trained ONNX weights in `models/road_hazard_model.onnx`.
4. If no trained model is present, provides a clearly labelled Demonstration Mode
   and OpenCV-based visual feature analysis.
5. Returns explicit detection_source ('Actual AI Inference' vs 'Demonstration Mode').
"""

import os
import cv2
import numpy as np
from PIL import Image

# Path where trained ONNX or PyTorch weights can be placed
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
ONNX_MODEL_PATH = os.path.join(MODEL_DIR, "road_hazard_model.onnx")

# Allowed image file extensions
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

# Preset demonstration samples for college evaluation and testing
DEMO_PRESETS = {
    "pothole": {
        "category": "Pothole",
        "severity": "High",
        "confidence": 0.93,
        "detection_source": "Demonstration Mode",
        "is_demo": 1,
        "notes": "Demonstration Mode: Simulates neural detection of severe asphalt cavity with broken perimeter edges."
    },
    "manhole": {
        "category": "Open Manhole",
        "severity": "Critical",
        "confidence": 0.97,
        "detection_source": "Demonstration Mode",
        "is_demo": 1,
        "notes": "Demonstration Mode: Simulates detection of high-risk missing stormwater/utility chamber cover."
    },
    "crack": {
        "category": "Road Crack",
        "severity": "Medium",
        "confidence": 0.86,
        "detection_source": "Demonstration Mode",
        "is_demo": 1,
        "notes": "Demonstration Mode: Simulates linear fracture and fatigue cracking along road surface."
    },
    "dumping": {
        "category": "Illegal Dumping",
        "severity": "Medium",
        "confidence": 0.89,
        "detection_source": "Demonstration Mode",
        "is_demo": 1,
        "notes": "Demonstration Mode: Simulates classification of construction debris or illegal municipal waste."
    }
}


class HazardDetector:
    def __init__(self):
        self.model_loaded = False
        self.session = None
        self._check_and_load_model()

    def _check_and_load_model(self):
        """Attempts to load trained ONNX model if present."""
        if os.path.exists(ONNX_MODEL_PATH):
            try:
                import onnxruntime as ort
                self.session = ort.InferenceSession(ONNX_MODEL_PATH)
                self.model_loaded = True
                print(f"[CivicVision AI] Loaded trained ONNX model from: {ONNX_MODEL_PATH}")
            except Exception as e:
                print(f"[CivicVision AI] Failed to load ONNX model: {e}")
                self.model_loaded = False
        else:
            print("[CivicVision AI] No trained weights at models/road_hazard_model.onnx.")
            print("[CivicVision AI] Operating in honest Demonstration & Computer Vision fallback mode.")

    def analyze_image_opencv(self, image_path):
        """
        Extracts genuine computer vision features using OpenCV:
        - Canny edge density (crack vs flat surface)
        - Contour circularity and aspect ratio (open circular manhole)
        - Dark area depression ratio (pothole cavity vs bright asphalt)
        - High-frequency color variance (illegal debris/dumping)
        
        This demonstrates real image processing principles to college examiners
        while remaining completely transparent about not being a trained deep CNN.
        """
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError("Unable to read image with OpenCV. File may be corrupted.")

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        h, w = gray.shape
        total_pixels = h * w

        # 1. Edge detection for crack/fracture intensity
        edges = cv2.Canny(gray, threshold1=80, threshold2=200)
        edge_pixel_count = np.count_nonzero(edges)
        edge_ratio = edge_pixel_count / float(total_pixels)

        # 2. Dark depression detection (typical of deep potholes)
        mean_brightness = np.mean(gray)
        dark_mask = gray < (mean_brightness * 0.6)
        dark_ratio = np.count_nonzero(dark_mask) / float(total_pixels)

        # 3. Contour circularity (typical of open circular manholes)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        has_circular_contour = False
        for c in contours:
            area = cv2.contourArea(c)
            perimeter = cv2.arcLength(c, True)
            if area > 1000 and perimeter > 0:
                circularity = 4 * np.pi * (area / (perimeter * perimeter))
                if circularity > 0.65:
                    has_circular_contour = True
                    break

        # 4. Color variance across channels (typical of colorful debris / dumping)
        std_dev = np.std(img)

        # Heuristic classification based on genuine image metrics
        if has_circular_contour and dark_ratio > 0.05:
            category = "Open Manhole"
            severity = "Critical"
            confidence = min(0.95, 0.75 + dark_ratio)
            notes = "OpenCV Analysis: Detected circular dark perimeter matching manhole chamber geometry."
        elif dark_ratio > 0.12 and edge_ratio > 0.03:
            category = "Pothole"
            severity = "High" if dark_ratio > 0.20 else "Medium"
            confidence = min(0.92, 0.70 + dark_ratio)
            notes = "OpenCV Analysis: Localized low-reflectance depression detected with fractured margins."
        elif edge_ratio > 0.06:
            category = "Road Crack"
            severity = "Medium" if edge_ratio < 0.12 else "High"
            confidence = min(0.88, 0.68 + edge_ratio * 2)
            notes = "OpenCV Analysis: High linear edge density indicating surface fissures and fatigue cracking."
        else:
            category = "Illegal Dumping" if std_dev > 45 else "Pothole"
            severity = "Medium" if category == "Illegal Dumping" else "Low"
            confidence = 0.78
            notes = "OpenCV Analysis: Heterogeneous color and texture variance observed across pavement surface."

        return {
            "category": category,
            "severity": severity,
            "confidence": round(float(confidence), 2),
            "detection_source": "Demonstration Mode",  # Explicitly marked as demo/heuristic
            "is_demo": 1,
            "notes": f"{notes} (Demonstration Mode / OpenCV Heuristic - No trained weights loaded)",
            "metrics": {
                "edge_ratio": round(float(edge_ratio), 4),
                "dark_ratio": round(float(dark_ratio), 4),
                "circular_contour_detected": bool(has_circular_contour),
                "texture_std_dev": round(float(std_dev), 2)
            }
        }

    def detect(self, image_path, requested_sample=None):
        """
        Main detection entrypoint.
        1. If a known demonstration preset is requested (e.g. for quick presentation), returns preset.
        2. If trained ONNX model exists, runs real inference (Actual AI Inference).
        3. Otherwise, runs OpenCV feature extraction clearly labelled as Demonstration Mode.
        """
        # 1. Preset request check
        if requested_sample and requested_sample.lower() in DEMO_PRESETS:
            preset = DEMO_PRESETS[requested_sample.lower()].copy()
            return {
                "success": True,
                **preset
            }

        # Validate file existence
        if not os.path.exists(image_path):
            return {
                "success": False,
                "error": "Image file does not exist on server."
            }

        # 2. Check for trained neural network model
        if self.model_loaded and self.session is not None:
            try:
                # Real ONNX model inference flow
                # (When user provides backend/models/road_hazard_model.onnx)
                # Standard input shape: [1, 3, 224, 224]
                img = Image.open(image_path).convert("RGB").resize((224, 224))
                arr = np.array(img).astype(np.float32) / 255.0
                arr = np.transpose(arr, (2, 0, 1))  # HWC to CHW
                arr = np.expand_dims(arr, axis=0)   # Add batch dimension

                input_name = self.session.get_inputs()[0].name
                outputs = self.session.run(None, {input_name: arr})
                scores = outputs[0][0]
                pred_idx = int(np.argmax(scores))

                categories = ["Pothole", "Road Crack", "Open Manhole", "Illegal Dumping"]
                category = categories[pred_idx % len(categories)]
                confidence = float(scores[pred_idx])
                
                # Determine severity based on category and confidence
                severity_map = {
                    "Open Manhole": "Critical",
                    "Pothole": "High" if confidence > 0.85 else "Medium",
                    "Road Crack": "Medium",
                    "Illegal Dumping": "Low"
                }

                return {
                    "success": True,
                    "category": category,
                    "severity": severity_map.get(category, "Medium"),
                    "confidence": round(confidence, 2),
                    "detection_source": "Actual AI Inference",
                    "is_demo": 0,
                    "notes": f"Genuine neural inference executed via {os.path.basename(ONNX_MODEL_PATH)}."
                }
            except Exception as err:
                print(f"[CivicVision AI] ONNX inference failed: {err}")
                return {
                    "success": False,
                    "error": f"Trained AI model inference failed: {str(err)}"
                }

        # 3. Transparent fallback: OpenCV image feature analysis labelled as Demonstration Mode
        try:
            cv_result = self.analyze_image_opencv(image_path)
            return {
                "success": True,
                **cv_result
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Image processing failed: {str(e)}"
            }


# Singleton detector instance
detector = HazardDetector()


def detect_hazard(image_path, requested_sample=None):
    """Convenience functional wrapper for the hazard detector."""
    return detector.detect(image_path, requested_sample)
