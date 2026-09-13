import pytest
from fastapi.testclient import TestClient
from backend.main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_health_endpoint(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}

def test_system_status(client):
    res = client.get("/system/status")
    assert res.status_code == 200
    assert "registry_snapshot_date" in res.json()
    assert res.json()["model_status"] == "ok"

def test_sample_cases(client):
    res = client.get("/api/sample-cases")
    assert res.status_code == 200
    assert len(res.json().get("cases", [])) >= 5

def test_analyze_text_fake_reg(client):
    payload = {
        "text": "Join VIP calls! SEBI Reg No: INA999888777 by Apex Super Wealth. Guaranteed 50% monthly profit on option trades! Pay Rs 5000 via GPay to 9876543210@ybl."
    }
    res = client.post("/analyze/text", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "complete"
    verdict = data["result"]
    assert verdict["verdict_bucket"] == "HIGH_RISK_INDICATORS"
    assert "explanation" in verdict

def test_registry_search(client):
    res = client.get("/registry/search?query=Kotak")
    assert res.status_code == 200
    data = res.json()
    assert len(data["results"]) >= 1
    assert "Kotak" in data["results"][0]["registered_entity_name"]

def test_analyze_unified_endpoint(client):
    payload = {
        "text": "Quarterly Research Note: Kotak Investment Advisors Limited (SEBI Reg No: INA000008434). Market outlook suggests moderate inflation cooling."
    }
    res = client.post("/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "complete"
    assert data["result"]["verdict_bucket"] == "LOW_CONCERN"

def test_ocr_endpoint_unconfigured_provider(client):
    import io
    from PIL import Image
    img = Image.new("RGB", (100, 100), color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    res = client.post("/ocr", files={"file": ("test.png", buf, "image/png")})
    assert res.status_code == 422
    assert "OCR Error" in res.json()["detail"]

def test_ocr_endpoint_with_text(client):
    import io
    from PIL import Image, ImageDraw
    img = Image.new("RGB", (400, 100), color="white")
    d = ImageDraw.Draw(img)
    d.text((10, 40), "SEBI Reg No: INA000008434", fill="black")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    res = client.post("/ocr", files={"file": ("has_text.png", buf, "image/png")})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "extracted_text" in data
    assert len(data["extracted_text"]) > 0

def test_root_serves_frontend(client):
    res = client.get("/")
    assert res.status_code == 200
    assert "text/html" in res.headers.get("content-type", "")
    assert "<html" in res.text

