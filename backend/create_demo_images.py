"""
CivicVision - Demonstration Image Generator
Creates realistic visual placeholder images for demonstration hazards
so that demo records and preset tests render cleanly without broken images.
"""

import os
import cv2
import numpy as np

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def create_asphalt_canvas(w=640, h=480):
    """Generates an asphalt texture background."""
    base = np.random.normal(70, 12, (h, w, 3)).clip(40, 110).astype(np.uint8)
    # Add subtle road lane marker
    cv2.line(base, (0, int(h * 0.9)), (w, int(h * 0.9)), (220, 220, 220), 4)
    return base


def generate_pothole_image(filename, label="Severe Pothole"):
    img = create_asphalt_canvas()
    h, w, _ = img.shape
    center = (int(w * 0.5), int(h * 0.55))
    # Draw dark irregular cavity
    cv2.ellipse(img, center, (140, 80), 15, 0, 360, (25, 25, 28), -1)
    cv2.ellipse(img, center, (120, 65), 15, 0, 360, (15, 15, 18), -1)
    # Add rugged fractured edges
    cv2.ellipse(img, center, (148, 88), 15, 0, 360, (110, 105, 95), 4)
    # Add water reflection / puddle nuance
    cv2.ellipse(img, (center[0] - 10, center[1] + 10), (60, 25), 10, 0, 360, (40, 48, 55), -1)
    # Badge banner
    cv2.rectangle(img, (20, 20), (w - 20, 70), (20, 25, 35), -1)
    cv2.putText(img, f"CIVICVISION DEMO: {label}", (35, 52), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 245, 212), 2)
    cv2.imwrite(os.path.join(UPLOAD_DIR, filename), img)


def generate_manhole_image(filename, label="Open Manhole Chamber"):
    img = create_asphalt_canvas()
    h, w, _ = img.shape
    center = (int(w * 0.5), int(h * 0.52))
    # Circular deep black void
    cv2.circle(img, center, 95, (10, 10, 12), -1)
    # Concrete / cast iron rim ring
    cv2.circle(img, center, 105, (120, 125, 130), 8)
    cv2.circle(img, center, 118, (60, 65, 70), 5)
    # Warning perimeter indicator
    cv2.rectangle(img, (20, 20), (w - 20, 70), (20, 25, 35), -1)
    cv2.putText(img, f"CIVICVISION DEMO: {label}", (35, 52), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (244, 63, 94), 2)
    cv2.imwrite(os.path.join(UPLOAD_DIR, filename), img)


def generate_crack_image(filename, label="Surface Fatigue Cracking"):
    img = create_asphalt_canvas()
    h, w, _ = img.shape
    # Draw longitudinal zigzag fissures
    points = [
        (int(w * 0.2), int(h * 0.2)),
        (int(w * 0.35), int(h * 0.4)),
        (int(w * 0.3), int(h * 0.55)),
        (int(w * 0.55), int(h * 0.7)),
        (int(w * 0.7), int(h * 0.85)),
        (int(w * 0.85), int(h * 0.95))
    ]
    for i in range(len(points) - 1):
        cv2.line(img, points[i], points[i+1], (18, 18, 20), 4)
        # Branch crack
        branch_end = (points[i][0] + 50, points[i][1] + 30)
        cv2.line(img, points[i], branch_end, (25, 25, 28), 2)
    # Badge banner
    cv2.rectangle(img, (20, 20), (w - 20, 70), (20, 25, 35), -1)
    cv2.putText(img, f"CIVICVISION DEMO: {label}", (35, 52), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (245, 158, 11), 2)
    cv2.imwrite(os.path.join(UPLOAD_DIR, filename), img)


def generate_dumping_image(filename, label="Debris / Illegal Dumping"):
    img = create_asphalt_canvas()
    h, w, _ = img.shape
    # Draw irregular piles of construction rubble / bricks / plastic
    for _ in range(40):
        rx = int(w * 0.35 + np.random.randint(-120, 120))
        ry = int(h * 0.55 + np.random.randint(-70, 70))
        color = (np.random.randint(40, 190), np.random.randint(60, 180), np.random.randint(80, 200))
        cv2.rectangle(img, (rx, ry), (rx + np.random.randint(15, 45), ry + np.random.randint(10, 30)), color, -1)
    # Badge banner
    cv2.rectangle(img, (20, 20), (w - 20, 70), (20, 25, 35), -1)
    cv2.putText(img, f"CIVICVISION DEMO: {label}", (35, 52), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (56, 189, 248), 2)
    cv2.imwrite(os.path.join(UPLOAD_DIR, filename), img)


if __name__ == "__main__":
    generate_pothole_image("demo_pothole_1.jpg", "University Road Pothole")
    generate_pothole_image("demo_pothole_2.jpg", "Karve Road Metro Pier Pothole")
    generate_manhole_image("demo_manhole_1.jpg", "FC Road Open Drain Chamber")
    generate_manhole_image("demo_manhole_2.jpg", "Aundh Road Missing Cover")
    generate_crack_image("demo_crack_1.jpg", "SB Road Longitudinal Crack")
    generate_crack_image("demo_crack_2.jpg", "Swargate Alligator Cracking")
    generate_dumping_image("demo_dumping_1.jpg", "Shaniwar Wada Debris Dump")
    generate_dumping_image("demo_dumping_2.jpg", "Pune Station Asphalt Scrap")
    print("[CivicVision] Successfully generated 8 demonstration hazard images.")
