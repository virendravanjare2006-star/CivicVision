"""
CivicVision - Backend Unit and Verification Test
Tests database initialization, Haversine duplicate detection,
CRUD operations, and AI detection fallback.
"""

import database
from detection import detect_hazard

def run_tests():
    print("--- 1. Testing Database Initialization ---")
    database.init_db()
    hazards = database.get_all_hazards()
    print(f"Total seeded demo hazards: {len(hazards)}")
    assert len(hazards) >= 8, f"Expected at least 8 seeded records, got {len(hazards)}"

    print("\n--- 2. Testing Dashboard Metrics ---")
    metrics = database.get_dashboard_metrics()
    print("Summary:", metrics["summary"])
    print("Category breakdown:", metrics["by_category"])
    assert metrics["summary"]["total_hazards"] == len(hazards)

    print("\n--- 3. Testing Haversine Duplicate Detection ---")
    # Coordinates very close to FC Road Open Manhole (18.5285, 73.8521)
    # Approx 20 meters away
    duplicates = database.find_possible_duplicates("Open Manhole", 18.5286, 73.8522, radius_meters=50.0)
    print(f"Duplicates found within 50m of Open Manhole: {len(duplicates)}")
    assert len(duplicates) >= 1, "Duplicate detection should have matched FC Road Open Manhole!"
    print(f"Detected duplicate: {duplicates[0]['description']} at {duplicates[0]['distance_meters']}m")

    # Coordinates far away should not trigger duplicate
    duplicates_far = database.find_possible_duplicates("Open Manhole", 18.6000, 73.9000, radius_meters=50.0)
    assert len(duplicates_far) == 0, "Far coordinates should not trigger duplicate detection!"
    print("Far coordinate duplicate check passed (0 duplicates).")

    print("\n--- 4. Testing Hazard Creation & Status Update ---")
    new_h = database.create_hazard(
        category="Pothole",
        severity="High",
        latitude=18.5500,
        longitude=73.8500,
        description="Test verification pothole",
        status="Detected",
        detection_source="Manual Report"
    )
    print(f"Created hazard ID: {new_h['id']}")
    assert new_h["id"] is not None

    # Update status to Verified
    updated_h = database.update_hazard(new_h["id"], {"status": "Verified"})
    assert updated_h["status"] == "Verified", "Status update failed!"
    print(f"Updated status to: {updated_h['status']}")

    # Clean up test hazard
    deleted = database.delete_hazard(new_h["id"])
    assert deleted, "Failed to delete test hazard!"
    print("Deleted test hazard successfully.")

    print("\n--- 5. Testing Detection Service Fallback / Heuristic ---")
    res_preset = detect_hazard("", requested_sample="pothole")
    print("Preset Detection Result:", res_preset)
    assert res_preset["success"] is True
    assert res_preset["category"] == "Pothole"
    assert res_preset["detection_source"] == "Demonstration Mode"

    print("\nALL BACKEND TESTS PASSED SUCCESSFULLY! :)")

if __name__ == "__main__":
    run_tests()
