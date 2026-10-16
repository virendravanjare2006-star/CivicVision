"""
CivicVision - Demonstration Seed Data
Team Cognitech

This module provides a realistic, curated demonstration dataset of road hazards.
All records are explicitly marked with `is_demo=1` and clear demo notices so they
are never mistaken for verified real-world incidents.
"""

from datetime import datetime, timezone, timedelta

# Base coordinates for metropolitan smart city demonstration (Pune / Mumbai corridor)
DEMO_HAZARDS = [
    {
        "category": "Pothole",
        "severity": "High",
        "latitude": 18.5314,
        "longitude": 73.8446,
        "description": "[DEMO DATA] Severe pothole near University Junction causing traffic slowdown and two-wheeler hazard.",
        "status": "Detected",
        "detection_source": "Demonstration Mode",
        "confidence": 0.92,
        "image_path": "demo_pothole_1.jpg",
        "is_demo": 1,
        "days_ago": 1
    },
    {
        "category": "Open Manhole",
        "severity": "Critical",
        "latitude": 18.5285,
        "longitude": 73.8521,
        "description": "[DEMO DATA] Missing drainage cover on busy pedestrian pathway along FC Road. Urgent safety hazard.",
        "status": "Verified",
        "detection_source": "Demonstration Mode",
        "confidence": 0.96,
        "image_path": "demo_manhole_1.jpg",
        "is_demo": 1,
        "days_ago": 2
    },
    {
        "category": "Road Crack",
        "severity": "Medium",
        "latitude": 18.5362,
        "longitude": 73.8398,
        "description": "[DEMO DATA] Longitudinal structural fatigue cracks expanding along the right lane of Senapati Bapat Road.",
        "status": "In Progress",
        "detection_source": "Demonstration Mode",
        "confidence": 0.84,
        "image_path": "demo_crack_1.jpg",
        "is_demo": 1,
        "days_ago": 4
    },
    {
        "category": "Illegal Dumping",
        "severity": "Low",
        "latitude": 18.5208,
        "longitude": 73.8554,
        "description": "[DEMO DATA] Construction debris and unattended gravel obstructing cycle lane near Shaniwar Wada.",
        "status": "Resolved",
        "detection_source": "Demonstration Mode",
        "confidence": 0.88,
        "image_path": "demo_dumping_1.jpg",
        "is_demo": 1,
        "days_ago": 7
    },
    {
        "category": "Pothole",
        "severity": "Critical",
        "latitude": 18.5165,
        "longitude": 73.8412,
        "description": "[DEMO DATA] Deep water-filled pothole on Karve Road beneath the metro flyover causing sudden braking.",
        "status": "Detected",
        "detection_source": "Demonstration Mode",
        "confidence": 0.94,
        "image_path": "demo_pothole_2.jpg",
        "is_demo": 1,
        "days_ago": 1
    },
    {
        "category": "Open Manhole",
        "severity": "High",
        "latitude": 18.5420,
        "longitude": 73.8290,
        "description": "[DEMO DATA] Displaced stormwater chamber lid creating dangerous tire trap near Aundh road junction.",
        "status": "In Progress",
        "detection_source": "Demonstration Mode",
        "confidence": 0.91,
        "image_path": "demo_manhole_2.jpg",
        "is_demo": 1,
        "days_ago": 3
    },
    {
        "category": "Road Crack",
        "severity": "Low",
        "latitude": 18.5089,
        "longitude": 73.8530,
        "description": "[DEMO DATA] Minor alligator cracking pattern emerging on secondary lane near Swargate.",
        "status": "Resolved",
        "detection_source": "Demonstration Mode",
        "confidence": 0.79,
        "image_path": "demo_crack_2.jpg",
        "is_demo": 1,
        "days_ago": 9
    },
    {
        "category": "Illegal Dumping",
        "severity": "Medium",
        "latitude": 18.5240,
        "longitude": 73.8610,
        "description": "[DEMO DATA] Discarded asphalt scrap and broken curbs dumped adjacent to bus stop at Pune Station road.",
        "status": "Detected",
        "detection_source": "Demonstration Mode",
        "confidence": 0.87,
        "image_path": "demo_dumping_2.jpg",
        "is_demo": 1,
        "days_ago": 0
    }
]


def get_seed_records():
    """Generates demonstration records with ISO timestamps relative to now."""
    records = []
    now = datetime.now(timezone.utc)
    for item in DEMO_HAZARDS:
        created_time = now - timedelta(days=item["days_ago"], hours=item["days_ago"] * 3)
        updated_time = created_time + timedelta(hours=2)
        records.append({
            "category": item["category"],
            "severity": item["severity"],
            "latitude": item["latitude"],
            "longitude": item["longitude"],
            "description": item["description"],
            "status": item["status"],
            "detection_source": item["detection_source"],
            "confidence": item["confidence"],
            "image_path": item["image_path"],
            "is_demo": item["is_demo"],
            "created_at": created_time.isoformat(),
            "updated_at": updated_time.isoformat(),
        })
    return records
