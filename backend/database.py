"""
CivicVision - Database Management Module
Team Cognitech

Manages the SQLite database (civicvision.db) for road hazard records.
Includes initialization, demo data seeding (idempotent), CRUD operations,
dashboard metrics calculation, and Haversine-based duplicate detection.
"""

import sqlite3
import os
import math
from datetime import datetime, timezone
from seed_data import get_seed_records

DB_NAME = "civicvision.db"
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), DB_NAME)

VALID_CATEGORIES = ["Pothole", "Road Crack", "Open Manhole", "Illegal Dumping"]
VALID_SEVERITIES = ["Low", "Medium", "High", "Critical"]
VALID_STATUSES = ["Detected", "Verified", "In Progress", "Resolved"]


def get_db_connection():
    """Returns a connection to the SQLite database with Row factory enabled."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """
    Initializes the SQLite database tables and seeds demonstration data
    only on the first run.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Create hazards table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS hazards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            severity TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'Detected',
            detection_source TEXT NOT NULL DEFAULT 'Manual Report',
            confidence REAL,
            image_path TEXT,
            is_demo INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE COLLATE NOCASE,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    # Check if database is empty to insert demo data only once
    cursor.execute("SELECT COUNT(*) FROM hazards")
    count = cursor.fetchone()[0]

    if count == 0:
        print("[CivicVision DB] Database empty. Seeding initial demonstration dataset...")
        seed_records = get_seed_records()
        for rec in seed_records:
            cursor.execute("""
                INSERT INTO hazards (
                    category, severity, latitude, longitude, description,
                    status, detection_source, confidence, image_path,
                    is_demo, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                rec["category"], rec["severity"], rec["latitude"], rec["longitude"],
                rec["description"], rec["status"], rec["detection_source"],
                rec["confidence"], rec["image_path"], rec["is_demo"],
                rec["created_at"], rec["updated_at"]
            ))
        conn.commit()
        print(f"[CivicVision DB] Successfully seeded {len(seed_records)} demonstration records.")
    else:
        print(f"[CivicVision DB] Database already contains {count} records. Skipping seed.")

    conn.close()


def create_user(email, password_hash):
    """Creates an account and returns its public profile."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)",
            (email, password_hash, datetime.now(timezone.utc).isoformat())
        )
        conn.commit()
        user_id = cursor.lastrowid
    finally:
        conn.close()
    return get_user_by_id(user_id)


def get_user_by_email(email):
    """Retrieves an account by its normalized email address."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def get_user_by_id(user_id):
    """Retrieves an account by ID without exposing its password hash."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, email, created_at FROM users WHERE id = ?",
        (user_id,)
    )
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculates the great-circle distance between two GPS coordinates using the Haversine formula.
    
    Formula:
      a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2)
      c = 2 * atan2(√a, √(1−a))
      d = R * c
    Where R is Earth's radius (approx 6,371,000 meters).
    
    Returns:
      Distance in meters (float).
    """
    R = 6371000.0  # Earth's radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return R * c


def find_possible_duplicates(category, lat, lon, radius_meters=50.0):
    """
    Looks for unresolved hazards of the same category within `radius_meters`.
    Returns a list of duplicate candidate dicts with calculated distance.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Query only unresolved hazards with matching category
    cursor.execute("""
        SELECT * FROM hazards
        WHERE category = ? AND status != 'Resolved'
    """, (category,))
    rows = cursor.fetchall()
    conn.close()

    duplicates = []
    for row in rows:
        dist = haversine_distance(lat, lon, row["latitude"], row["longitude"])
        if dist <= radius_meters:
            item = dict(row)
            item["distance_meters"] = round(dist, 1)
            duplicates.append(item)

    # Sort duplicates by distance (closest first)
    duplicates.sort(key=lambda x: x["distance_meters"])
    return duplicates


def get_all_hazards(category=None, severity=None, status=None, search=None):
    """Retrieves all hazards with optional filtering and search."""
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM hazards WHERE 1=1"
    params = []

    if category:
        query += " AND category = ?"
        params.append(category)

    if severity:
        query += " AND severity = ?"
        params.append(severity)

    if status:
        query += " AND status = ?"
        params.append(status)

    if search:
        search_pattern = f"%{search}%"
        query += " AND (description LIKE ? OR category LIKE ? OR CAST(id AS TEXT) LIKE ?)"
        params.extend([search_pattern, search_pattern, search_pattern])

    query += " ORDER BY id DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return [dict(r) for r in rows]


def get_hazard_by_id(hazard_id):
    """Retrieves a single hazard by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM hazards WHERE id = ?", (hazard_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def create_hazard(category, severity, latitude, longitude, description="",
                  status="Detected", detection_source="Manual Report",
                  confidence=None, image_path=None, is_demo=0):
    """Inserts a new road hazard record into SQLite."""
    conn = get_db_connection()
    cursor = conn.cursor()

    now = datetime.now(timezone.utc).isoformat()

    cursor.execute("""
        INSERT INTO hazards (
            category, severity, latitude, longitude, description,
            status, detection_source, confidence, image_path,
            is_demo, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        category, severity, latitude, longitude, description,
        status, detection_source, confidence, image_path,
        is_demo, now, now
    ))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()

    return get_hazard_by_id(new_id)


def update_hazard(hazard_id, updates):
    """
    Updates specified fields of a hazard record.
    Always updates the `updated_at` timestamp.
    """
    allowed_fields = ["category", "severity", "latitude", "longitude",
                      "description", "status", "detection_source",
                      "confidence", "image_path"]

    filtered_updates = {k: v for k, v in updates.items() if k in allowed_fields}
    if not filtered_updates:
        return get_hazard_by_id(hazard_id)

    filtered_updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    set_clause = ", ".join([f"{k} = ?" for k in filtered_updates.keys()])
    values = list(filtered_updates.values())
    values.append(hazard_id)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(f"UPDATE hazards SET {set_clause} WHERE id = ?", values)
    conn.commit()
    conn.close()

    return get_hazard_by_id(hazard_id)


def delete_hazard(hazard_id):
    """Deletes a hazard record by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM hazards WHERE id = ?", (hazard_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted


def get_dashboard_metrics():
    """
    Computes dashboard metrics from SQLite:
    - Total hazards
    - High-severity hazards (High + Critical)
    - Awaiting verification (status == 'Detected')
    - Resolved hazards
    - Breakdown by category
    - Breakdown by severity
    - Recent hazards (last 5)
    - High-priority hazards (Critical or High, unresolved)
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Total hazards
    cursor.execute("SELECT COUNT(*) FROM hazards")
    total_hazards = cursor.fetchone()[0]

    # High severity hazards (High or Critical)
    cursor.execute("SELECT COUNT(*) FROM hazards WHERE severity IN ('High', 'Critical')")
    high_severity_hazards = cursor.fetchone()[0]

    # Awaiting verification
    cursor.execute("SELECT COUNT(*) FROM hazards WHERE status = 'Detected'")
    awaiting_verification = cursor.fetchone()[0]

    # Resolved
    cursor.execute("SELECT COUNT(*) FROM hazards WHERE status = 'Resolved'")
    resolved_hazards = cursor.fetchone()[0]

    # Breakdown by category
    category_counts = {cat: 0 for cat in VALID_CATEGORIES}
    cursor.execute("SELECT category, COUNT(*) FROM hazards GROUP BY category")
    for row in cursor.fetchall():
        if row[0] in category_counts:
            category_counts[row[0]] = row[1]

    # Breakdown by severity
    severity_counts = {sev: 0 for sev in VALID_SEVERITIES}
    cursor.execute("SELECT severity, COUNT(*) FROM hazards GROUP BY severity")
    for row in cursor.fetchall():
        if row[0] in severity_counts:
            severity_counts[row[0]] = row[1]

    # Recent hazards (latest 5)
    cursor.execute("SELECT * FROM hazards ORDER BY id DESC LIMIT 5")
    recent_hazards = [dict(r) for r in cursor.fetchall()]

    # High-priority hazards (unresolved Critical or High)
    cursor.execute("""
        SELECT * FROM hazards 
        WHERE status != 'Resolved' AND severity IN ('Critical', 'High')
        ORDER BY CASE severity WHEN 'Critical' THEN 1 ELSE 2 END, id DESC
        LIMIT 6
    """)
    high_priority_hazards = [dict(r) for r in cursor.fetchall()]

    conn.close()

    return {
        "summary": {
            "total_hazards": total_hazards,
            "high_severity_hazards": high_severity_hazards,
            "awaiting_verification": awaiting_verification,
            "resolved_hazards": resolved_hazards
        },
        "by_category": category_counts,
        "by_severity": severity_counts,
        "recent_hazards": recent_hazards,
        "high_priority_hazards": high_priority_hazards
    }
