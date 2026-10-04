import os
import pytest
from fastapi.testclient import TestClient
from PIL import Image
import numpy as np

from backend.app.main import app
from backend.app.core.security import create_access_token

client = TestClient(app)

# Helper to create dummy test image
@pytest.fixture
def sample_image_path(tmp_path):
    img_path = tmp_path / "test_road.jpg"
    img = Image.fromarray(np.uint8(np.random.rand(400, 400, 3) * 255))
    img.save(img_path)
    return str(img_path)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "database" in data
    assert "model" in data

def test_unauthorized_access():
    response = client.get("/api/authority/issues")
    assert response.status_code == 401

def test_public_report_flow(sample_image_path):
    with open(sample_image_path, "rb") as f:
        response = client.post(
            "/api/public/reports",
            files={"image": ("test_road.jpg", f, "image/jpeg")},
            data={
                "latitude": 37.7749,
                "longitude": -122.4194,
                "location_name": "Main St & 5th Ave",
                "description": "Large pothole in right lane"
            }
        )
    assert response.status_code == 200, response.text
    data = response.json()
    assert "report_id" in data
    assert data["status"] == "Reported"
    assert "overall_severity" in data

    # Test track report
    report_id = data["report_id"]
    track_resp = client.get(f"/api/public/track/{report_id}")
    assert track_resp.status_code == 200
    assert track_resp.json()["report_id"] == report_id
