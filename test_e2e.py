"""
CivicVision - Live End-to-End System Test
Tests live HTTP endpoints on both Flask (5000) and Vite Proxy (5173).
"""

import json
import urllib.request
import urllib.error

def test_api():
    print("=== Testing CivicVision End-to-End Communication ===")

    # 1. Direct Flask Health Check
    req = urllib.request.Request("http://127.0.0.1:5000/api/health")
    with urllib.request.urlopen(req) as resp:
        health_data = json.loads(resp.read().decode())
        print("[1] Flask Health Check (5000):", health_data["status"], "| AI:", health_data["ai_service"]["mode"])
        assert resp.status == 200

    # 2. Vite Proxy Health Check
    req_proxy = urllib.request.Request("http://localhost:5173/api/health")
    with urllib.request.urlopen(req_proxy) as resp:
        proxy_data = json.loads(resp.read().decode())
        print("[2] Vite Proxy Health Check (5173 -> 5000):", proxy_data["status"])
        assert resp.status == 200

    # 3. Dashboard Metrics
    req_dash = urllib.request.Request("http://localhost:5173/api/dashboard")
    with urllib.request.urlopen(req_dash) as resp:
        dash_data = json.loads(resp.read().decode())
        summary = dash_data["data"]["summary"]
        print("[3] Dashboard Summary:", summary)
        assert summary["total_hazards"] >= 8

    # 4. AI Image Detection API with Preset
    data = urllib.parse.urlencode({"preset": "manhole"}).encode()
    req_detect = urllib.request.Request("http://localhost:5173/api/detection", data=data)
    with urllib.request.urlopen(req_detect) as resp:
        det_data = json.loads(resp.read().decode())
        print("[4] AI Detection Result:", det_data["category"], f"({det_data['detection_source']})", f"conf={det_data['confidence']}")
        assert det_data["category"] == "Open Manhole"
        assert det_data["detection_source"] == "Demonstration Mode"

    # 5. Duplicate Detection Check (Coordinates close to FC Road Open Manhole 18.5285, 73.8521)
    dup_payload = json.dumps({
        "category": "Open Manhole",
        "severity": "Critical",
        "latitude": 18.5286,
        "longitude": 73.8522,
        "description": "Duplicate testing near FC road",
        "force": False
    }).encode("utf-8")
    req_dup = urllib.request.Request("http://localhost:5173/api/hazards", data=dup_payload, headers={"Content-Type": "application/json"})
    try:
        urllib.request.urlopen(req_dup)
        assert False, "Should have returned 409 Conflict for duplicate hazard!"
    except urllib.error.HTTPError as err:
        assert err.code == 409
        err_data = json.loads(err.read().decode())
        print("[5] Duplicate Detection Alert (409):", err_data["message"][:80] + "...")

    # 6. Create Hazard with force=True
    create_payload = json.dumps({
        "category": "Pothole",
        "severity": "Medium",
        "latitude": 18.5700,
        "longitude": 73.8800,
        "description": "E2E Automated verification pothole",
        "force": True
    }).encode("utf-8")
    req_create = urllib.request.Request("http://localhost:5173/api/hazards", data=create_payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req_create) as resp:
        create_data = json.loads(resp.read().decode())
        new_id = create_data["hazard"]["id"]
        print(f"[6] Created Hazard #{new_id} via API")

    # 7. Modify Status to In Progress
    patch_payload = json.dumps({"status": "In Progress"}).encode("utf-8")
    req_patch = urllib.request.Request(
        f"http://localhost:5173/api/hazards/{new_id}",
        data=patch_payload,
        headers={"Content-Type": "application/json"},
        method="PATCH"
    )
    with urllib.request.urlopen(req_patch) as resp:
        patch_data = json.loads(resp.read().decode())
        print(f"[7] Modified Hazard #{new_id} status to:", patch_data["hazard"]["status"])
        assert patch_data["hazard"]["status"] == "In Progress"

    # 8. Delete Hazard
    req_del = urllib.request.Request(
        f"http://localhost:5173/api/hazards/{new_id}",
        headers={"Content-Type": "application/json"},
        method="DELETE"
    )
    with urllib.request.urlopen(req_del) as resp:
        del_data = json.loads(resp.read().decode())
        print(f"[8] Deleted Hazard #{new_id}:", del_data["message"])

    # 9. Verify Vite Frontend HTML is returned
    req_vite = urllib.request.Request("http://localhost:5173/")
    with urllib.request.urlopen(req_vite) as resp:
        html = resp.read().decode()
        assert "CivicVision" in html
        print("[9] Vite Frontend Index HTML Verified (contains 'CivicVision')")

    print("\n>>> ALL 9 END-TO-END TESTS PASSED FLAWLESSLY! <<<")

if __name__ == "__main__":
    test_api()
