"""
CivicVision - Flask REST API Backend
Team Cognitech
Tagline: "Detect Hazards. Map Risks. Build Safer Roads."

REST API for road hazard detection, management, dashboard metrics,
and geographic duplicate detection.
"""

import os
import re
import sqlite3
import uuid
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory, session
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename

import database
from detection import detect_hazard, ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES, detector

# Initialize Flask application
app = Flask(__name__)
CORS_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "CIVICVISION_CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]
CORS(app, resources={r"/api/*": {"origins": CORS_ORIGINS}}, supports_credentials=True)

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = MAX_FILE_SIZE_BYTES
app.config.update(
    SECRET_KEY=os.environ.get("CIVICVISION_SECRET_KEY") or os.urandom(32),
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=os.environ.get("CIVICVISION_COOKIE_SECURE", "").lower() == "true",
)

# Ensure database is initialized with demonstration data on first start
database.init_db()


def login_required(view):
    """Require a valid authenticated account for an API or upload endpoint."""
    @wraps(view)
    def wrapped(*args, **kwargs):
        user_id = session.get("user_id")
        user = database.get_user_by_id(user_id) if user_id else None
        if user is None:
            session.clear()
            return jsonify({"success": False, "error": "Authentication required."}), 401
        return view(*args, **kwargs)
    return wrapped


def is_allowed_file(filename):
    """Checks if file has an approved image extension."""
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_EXTENSIONS


# ---------------------------------------------------------
# Authentication API
# ---------------------------------------------------------
@app.route("/api/auth/register", methods=["POST"])
def register():
    """Creates an account and starts an authenticated session."""
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"success": False, "error": "Request body must be JSON."}), 400

    email = data.get("email", "")
    password = data.get("password", "")
    if not isinstance(email, str) or not isinstance(password, str):
        return jsonify({"success": False, "error": "Email and password must be strings."}), 400
    email = email.strip().lower()
    if len(email) > 254 or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        return jsonify({"success": False, "error": "Enter a valid email address."}), 400
    if len(password) < 8:
        return jsonify({"success": False, "error": "Password must be at least 8 characters."}), 400
    if len(password) > 128:
        return jsonify({"success": False, "error": "Password must be no more than 128 characters."}), 400

    try:
        user = database.create_user(email, generate_password_hash(password))
    except sqlite3.IntegrityError:
        return jsonify({"success": False, "error": "An account with this email already exists."}), 409

    session.clear()
    session["user_id"] = user["id"]
    return jsonify({"success": True, "user": user}), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    """Verifies account credentials and starts an authenticated session."""
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"success": False, "error": "Request body must be JSON."}), 400

    email = data.get("email", "")
    password = data.get("password", "")
    if not isinstance(email, str) or not isinstance(password, str):
        return jsonify({"success": False, "error": "Email and password must be strings."}), 400
    if len(email) > 254 or len(password) > 128:
        return jsonify({"success": False, "error": "Invalid email or password."}), 401

    user = database.get_user_by_email(email.strip().lower())
    if user is None or not check_password_hash(user["password_hash"], password):
        return jsonify({"success": False, "error": "Invalid email or password."}), 401

    session.clear()
    session["user_id"] = user["id"]
    return jsonify({
        "success": True,
        "user": {"id": user["id"], "email": user["email"], "created_at": user["created_at"]}
    }), 200


@app.route("/api/auth/me", methods=["GET"])
@login_required
def current_user():
    """Returns the authenticated account profile."""
    user = database.get_user_by_id(session["user_id"])
    return jsonify({"success": True, "user": user}), 200


@app.route("/api/auth/logout", methods=["POST"])
def logout():
    """Ends the current session."""
    session.clear()
    return jsonify({"success": True}), 200


# ---------------------------------------------------------
# Health Check Endpoint
# ---------------------------------------------------------
@app.route("/api/health", methods=["GET"])
def health_check():
    """Returns backend system status and AI module capabilities."""
    return jsonify({
        "status": "healthy",
        "project": "CivicVision",
        "team": "Cognitech",
        "tagline": "Detect Hazards. Map Risks. Build Safer Roads.",
        "database": "SQLite (civicvision.db connected)",
        "ai_service": {
            "model_configured": detector.model_loaded,
            "mode": "Actual AI Inference" if detector.model_loaded else "Demonstration Mode / OpenCV Analysis",
            "opencv_enabled": True
        }
    }), 200


# ---------------------------------------------------------
# Static Uploads Serving
# ---------------------------------------------------------
@app.route("/uploads/<path:filename>", methods=["GET"])
@login_required
def serve_upload(filename):
    """Serves uploaded or demonstration road hazard images."""
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


# ---------------------------------------------------------
# Dashboard Metrics API
# ---------------------------------------------------------
@app.route("/api/dashboard", methods=["GET"])
@login_required
def get_dashboard():
    """
    Returns computed summary stats, category counts, severity distribution,
    and recent hazard reports directly from SQLite.
    """
    try:
        metrics = database.get_dashboard_metrics()
        return jsonify({
            "success": True,
            "data": metrics
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to retrieve dashboard metrics: {str(e)}"
        }), 500


# ---------------------------------------------------------
# Hazards CRUD Endpoints
# ---------------------------------------------------------
@app.route("/api/hazards", methods=["GET"])
@login_required
def list_hazards():
    """
    Retrieves all hazards with optional filtering by category, severity,
    status, or search keyword.
    """
    category = request.args.get("category")
    severity = request.args.get("severity")
    status = request.args.get("status")
    search = request.args.get("search")

    try:
        hazards = database.get_all_hazards(category, severity, status, search)
        return jsonify({
            "success": True,
            "count": len(hazards),
            "hazards": hazards
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to fetch hazards: {str(e)}"
        }), 500


@app.route("/api/hazards/<int:hazard_id>", methods=["GET"])
@login_required
def get_hazard(hazard_id):
    """Retrieves full details for a single hazard by ID."""
    hazard = database.get_hazard_by_id(hazard_id)
    if not hazard:
        return jsonify({
            "success": False,
            "error": f"Hazard with ID {hazard_id} not found."
        }), 404

    return jsonify({
        "success": True,
        "hazard": hazard
    }), 200


@app.route("/api/hazards", methods=["POST"])
@login_required
def add_hazard():
    """
    Creates a new hazard report.
    Validates input fields and performs Haversine duplicate checking
    within 50 meters unless `force=true`.
    """
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "Request body must be JSON."}), 400

    category = data.get("category")
    severity = data.get("severity")
    latitude = data.get("latitude")
    longitude = data.get("longitude")
    description = data.get("description", "").strip()
    status = data.get("status", "Detected")
    detection_source = data.get("detection_source", "Manual Report")
    confidence = data.get("confidence")
    image_path = data.get("image_path")
    is_demo = 1 if data.get("is_demo") else 0
    force_create = data.get("force", False)

    # 1. Validation
    if not category or category not in database.VALID_CATEGORIES:
        return jsonify({
            "success": False,
            "error": f"Invalid category. Must be one of: {', '.join(database.VALID_CATEGORIES)}"
        }), 400

    if not severity or severity not in database.VALID_SEVERITIES:
        return jsonify({
            "success": False,
            "error": f"Invalid severity. Must be one of: {', '.join(database.VALID_SEVERITIES)}"
        }), 400

    if status not in database.VALID_STATUSES:
        return jsonify({
            "success": False,
            "error": f"Invalid status. Must be one of: {', '.join(database.VALID_STATUSES)}"
        }), 400

    try:
        lat = float(latitude)
        lon = float(longitude)
        if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lon <= 180.0):
            return jsonify({
                "success": False,
                "error": "Coordinates out of bounds (-90 <= lat <= 90, -180 <= lon <= 180)."
            }), 400
    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "error": "Valid numeric latitude and longitude are required."
        }), 400

    # 2. Duplicate Detection (Section 10)
    # If not forcing creation, check for unresolved hazard of same category within 50 meters
    if not force_create:
        duplicates = database.find_possible_duplicates(category, lat, lon, radius_meters=50.0)
        if duplicates:
            closest = duplicates[0]
            return jsonify({
                "success": False,
                "duplicate_detected": True,
                "message": (
                    f"Possible duplicate detected! An unresolved '{category}' already exists "
                    f"{closest['distance_meters']} meters away (Hazard #{closest['id']}). "
                    "You can associate your observation with the existing hazard or submit anyway."
                ),
                "existing_hazard": closest,
                "duplicates_count": len(duplicates)
            }), 409

    # 3. Insert into SQLite
    try:
        created = database.create_hazard(
            category=category,
            severity=severity,
            latitude=lat,
            longitude=lon,
            description=description,
            status=status,
            detection_source=detection_source,
            confidence=confidence,
            image_path=image_path,
            is_demo=is_demo
        )
        return jsonify({
            "success": True,
            "message": "Hazard created successfully.",
            "hazard": created
        }), 201
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Database insertion failed: {str(e)}"
        }), 500


@app.route("/api/hazards/<int:hazard_id>", methods=["PATCH"])
@login_required
def modify_hazard(hazard_id):
    """
    Updates hazard information or status.
    Guarantees persistence in SQLite.
    """
    existing = database.get_hazard_by_id(hazard_id)
    if not existing:
        return jsonify({"success": False, "error": f"Hazard #{hazard_id} not found."}), 404

    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "Request body must be JSON."}), 400

    # Validate status if being updated
    if "status" in data and data["status"] not in database.VALID_STATUSES:
        return jsonify({
            "success": False,
            "error": f"Invalid status '{data['status']}'. Must be one of: {', '.join(database.VALID_STATUSES)}"
        }), 400

    # Validate severity if being updated
    if "severity" in data and data["severity"] not in database.VALID_SEVERITIES:
        return jsonify({
            "success": False,
            "error": f"Invalid severity '{data['severity']}'. Must be one of: {', '.join(database.VALID_SEVERITIES)}"
        }), 400

    try:
        updated = database.update_hazard(hazard_id, data)
        return jsonify({
            "success": True,
            "message": f"Hazard #{hazard_id} updated successfully.",
            "hazard": updated
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to update hazard: {str(e)}"
        }), 500


@app.route("/api/hazards/<int:hazard_id>", methods=["DELETE"])
@login_required
def remove_hazard(hazard_id):
    """Deletes a hazard record after confirmed action."""
    existing = database.get_hazard_by_id(hazard_id)
    if not existing:
        return jsonify({"success": False, "error": f"Hazard #{hazard_id} not found."}), 404

    try:
        database.delete_hazard(hazard_id)
        return jsonify({
            "success": True,
            "message": f"Hazard #{hazard_id} deleted successfully."
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to delete hazard: {str(e)}"
        }), 500


# ---------------------------------------------------------
# AI Image Detection API (Section 6)
# ---------------------------------------------------------
@app.route("/api/detection", methods=["POST"])
@login_required
def detect_image():
    """
    Accepts road image upload or preset demo request.
    Validates file type and size.
    Processes detection via separate detection module.
    Returns prediction with transparent AI vs Demo attribution.
    """
    preset = request.form.get("preset")

    # If preset demo is requested without physical upload
    if preset:
        result = detect_hazard("", requested_sample=preset)
        # Assign demo image filename for preview
        demo_img_map = {
            "pothole": "demo_pothole_1.jpg",
            "manhole": "demo_manhole_1.jpg",
            "crack": "demo_crack_1.jpg",
            "dumping": "demo_dumping_1.jpg"
        }
        result["image_path"] = demo_img_map.get(preset.lower(), "sample_hazard.jpg")
        result["image_url"] = f"/uploads/{result['image_path']}"
        return jsonify(result), 200

    # Physical file upload check
    if "image" not in request.files:
        return jsonify({"success": False, "error": "No image file provided in request."}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"success": False, "error": "No selected file."}), 400

    if not is_allowed_file(file.filename):
        return jsonify({
            "success": False,
            "error": f"Unsupported file format. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}"
        }), 400

    # Save with secure unique filename
    ext = os.path.splitext(file.filename)[1].lower()
    unique_filename = f"upload_{uuid.uuid4().hex[:10]}{ext}"
    saved_path = os.path.join(app.config["UPLOAD_FOLDER"], unique_filename)

    try:
        file.save(saved_path)
    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to save image: {str(e)}"}), 500

    # Run detection service
    try:
        detection_result = detect_hazard(saved_path)
        if not detection_result.get("success", False):
            return jsonify(detection_result), 422

        detection_result["image_path"] = unique_filename
        detection_result["image_url"] = f"/uploads/{unique_filename}"
        return jsonify(detection_result), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Detection processing error: {str(e)}"
        }), 500


if __name__ == "__main__":
    print("==================================================")
    print("  CivicVision - Road Hazard Detection Backend    ")
    print("  Team: Cognitech                                ")
    print("  REST API running on http://127.0.0.1:5000       ")
    print("==================================================")
    app.run(host="0.0.0.0", port=5000, debug=True)
