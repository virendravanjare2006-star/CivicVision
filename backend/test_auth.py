"""Authentication API tests using an isolated temporary SQLite database."""

import os
import tempfile
import unittest

import database
from app import app


class AuthenticationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.original_db_path = database.DB_PATH
        app.config.update(TESTING=True, SECRET_KEY="test-only-secret")

    @classmethod
    def tearDownClass(cls):
        database.DB_PATH = cls.original_db_path

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        database.DB_PATH = os.path.join(self.temp_dir.name, "auth_test.db")
        database.init_db()
        self.client = app.test_client()

    def tearDown(self):
        database.DB_PATH = self.original_db_path
        self.temp_dir.cleanup()

    def test_protected_endpoint_rejects_unauthenticated_request(self):
        protected_requests = [
            ("GET", "/api/dashboard"),
            ("GET", "/api/hazards"),
            ("POST", "/api/hazards"),
            ("GET", "/api/hazards/1"),
            ("PATCH", "/api/hazards/1"),
            ("DELETE", "/api/hazards/1"),
            ("POST", "/api/detection"),
            ("GET", "/uploads/demo_pothole_1.jpg"),
        ]
        for method, path in protected_requests:
            response = self.client.open(path, method=method, json={})
            self.assertEqual(response.status_code, 401, f"{method} {path} was not protected")
        self.assertEqual(self.client.get("/api/health").status_code, 200)

    def test_registration_creates_session_and_duplicate_is_rejected(self):
        response = self.client.post(
            "/api/auth/register",
            json={"email": "test@example.com", "password": "secure-pass-123"}
        )
        self.assertEqual(response.status_code, 201)
        self.assertNotIn("password_hash", response.get_json()["user"])
        stored_user = database.get_user_by_email("test@example.com")
        self.assertNotEqual(stored_user["password_hash"], "secure-pass-123")
        cookie = response.headers["Set-Cookie"]
        self.assertIn("HttpOnly", cookie)
        self.assertIn("SameSite=Lax", cookie)
        self.assertEqual(self.client.get("/api/auth/me").status_code, 200)

        duplicate = self.client.post(
            "/api/auth/register",
            json={"email": "TEST@example.com", "password": "secure-pass-123"}
        )
        self.assertEqual(duplicate.status_code, 409)

    def test_registration_validates_email_and_password(self):
        invalid_email = self.client.post(
            "/api/auth/register",
            json={"email": "not-an-email", "password": "secure-pass-123"}
        )
        short_password = self.client.post(
            "/api/auth/register",
            json={"email": "test@example.com", "password": "short"}
        )
        self.assertEqual(invalid_email.status_code, 400)
        self.assertEqual(short_password.status_code, 400)

    def test_login_and_logout(self):
        self.client.post(
            "/api/auth/register",
            json={"email": "test@example.com", "password": "secure-pass-123"}
        )
        self.client.post("/api/auth/logout")

        invalid_login = self.client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "incorrect-password"}
        )
        self.assertEqual(invalid_login.status_code, 401)

        valid_login = self.client.post(
            "/api/auth/login",
            json={"email": " TEST@example.com ", "password": "secure-pass-123"}
        )
        self.assertEqual(valid_login.status_code, 200)
        self.assertEqual(self.client.get("/api/auth/me").status_code, 200)

        self.client.post("/api/auth/logout")
        self.assertEqual(self.client.get("/api/auth/me").status_code, 401)
        self.assertEqual(self.client.get("/api/dashboard").status_code, 401)


if __name__ == "__main__":
    unittest.main()
