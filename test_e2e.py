"""
CivicVision - Live End-to-End System Test
Tests live HTTP endpoints on both Flask (5000) and Vite Proxy (5173).
"""

import json
import http.cookiejar
import urllib.parse
import urllib.request
import urllib.error
import uuid

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

    # Keep the session cookie for all authenticated API requests.
    cookies = http.cookiejar.CookieJar()
    session = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookies))

    # 3. Register an account
    register_payload = json.dumps({
        "email": f"e2e-{uuid.uuid4().hex}@example.com",
        "password": "civicvision-e2e-password"
    }).encode("utf-8")
    req_register = urllib.request.Request(
        "http://localhost:5173/api/auth/register",
        data=register_payload,
        headers={"Content-Type": "application/json"}
    )
    with session.open(req_register) as resp:
        account_data = json.loads(resp.read().decode())
        assert resp.status == 201
        assert "password_hash" not in account_data["user"]
        print("[3] Account registration and session cookie verified")

    # 4. Dashboard Metrics
    req_dash = urllib.request.Request("http://localhost:5173/api/dashboard")
    with session.open(req_dash) as resp:
        dash_data = json.loads(resp.read().decode())
        summary = dash_data["data"]["summary"]
        print("[4] Dashboard Summary:", summary)
        assert summary["total_hazards"] >= 8

    # 5. AI Image Detection API with Preset
    data = urllib.parse.urlencode({"preset": "manhole"}).encode()
    req_detect = urllib.request.Request("http://localhost:5173/api/detection", data=data)
    with session.open(req_detect) as resp:
        det_data = json.loads(resp.read().decode())
        print("[5] AI Detection Result:", det_data["category"], f"({det_data['detection_source']})", f"conf={det_data['confidence']}")
        assert det_data["category"] == "Open Manhole"
        assert det_data["detection_source"] == "Demonstration Mode"

    # 6. Duplicate Detection Check (Coordinates close to FC Road Open Manhole 18.5285, 73.8521)
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
        session.open(req_dup)
        assert False, "Should have returned 409 Conflict for duplicate hazard!"
    except urllib.error.HTTPError as err:
        assert err.code == 409
        err_data = json.loads(err.read().decode())
        print("[6] Duplicate Detection Alert (409):", err_data["message"][:80] + "...")

    # 7. Create Hazard with force=True
    create_payload = json.dumps({
        "category": "Pothole",
        "severity": "Medium",
        "latitude": 18.5700,
        "longitude": 73.8800,
        "description": "E2E Automated verification pothole",
        "force": True
    }).encode("utf-8")
    req_create = urllib.request.Request("http://localhost:5173/api/hazards", data=create_payload, headers={"Content-Type": "application/json"})
    with session.open(req_create) as resp:
        create_data = json.loads(resp.read().decode())
        new_id = create_data["hazard"]["id"]
        print(f"[7] Created Hazard #{new_id} via API")

    # 8. Modify Status to In Progress
    patch_payload = json.dumps({"status": "In Progress"}).encode("utf-8")
    req_patch = urllib.request.Request(
        f"http://localhost:5173/api/hazards/{new_id}",
        data=patch_payload,
        headers={"Content-Type": "application/json"},
        method="PATCH"
    )
    with session.open(req_patch) as resp:
        patch_data = json.loads(resp.read().decode())
        print(f"[8] Modified Hazard #{new_id} status to:", patch_data["hazard"]["status"])
        assert patch_data["hazard"]["status"] == "In Progress"

    # 9. Delete Hazard
    req_del = urllib.request.Request(
        f"http://localhost:5173/api/hazards/{new_id}",
        headers={"Content-Type": "application/json"},
        method="DELETE"
    )
    with session.open(req_del) as resp:
        del_data = json.loads(resp.read().decode())
        print(f"[9] Deleted Hazard #{new_id}:", del_data["message"])

    # 10. Sign out and confirm the API no longer accepts the session.
    req_logout = urllib.request.Request("http://localhost:5173/api/auth/logout", data=b"", method="POST")
    with session.open(req_logout) as resp:
        assert resp.status == 200
    try:
        session.open(req_dash)
        assert False, "Dashboard should require authentication after logout."
    except urllib.error.HTTPError as err:
        assert err.code == 401
        print("[10] Logout clears session and protected API returns 401")

    # 11. Verify Vite Frontend HTML is returned
    req_vite = urllib.request.Request("http://localhost:5173/")
    with urllib.request.urlopen(req_vite) as resp:
        html = resp.read().decode()
        assert "CivicVision" in html
        print("[11] Vite Frontend Index HTML Verified (contains 'CivicVision')")

    print("\n>>> ALL 11 END-TO-END TESTS PASSED FLAWLESSLY! <<<")

if __name__ == "__main__":
    test_api()
