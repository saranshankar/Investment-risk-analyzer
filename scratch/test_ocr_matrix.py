import io
import sys
from PIL import Image, ImageDraw
from tools.ocr_tool import OCRTool
from fastapi.testclient import TestClient
from backend.main import app

def main():
    ocr = OCRTool()
    client = TestClient(app)
    
    print("=== 1. CREATING READABLE IMAGE ===")
    img = Image.new("RGB", (600, 150), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    # Default PIL bitmap font is small, let's draw large clear text or use default
    d.text((20, 30), "KOTAK SECURITIES REGISTRATION INA000008434", fill=(0, 0, 0))
    d.text((20, 70), "GUARANTEED 40% MONTHLY RETURN INVEST NOW", fill=(0, 0, 0))
    
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    readable_bytes = buf.getvalue()
    
    success, text, code = ocr.process_image(readable_bytes, "kotak_promo.png")
    print(f"Readable Image Direct OCR: success={success}, code={code}")
    print(f"Extracted Text:\n{text}\n")
    
    # Test POST /ocr with readable image
    res_ocr = client.post("/ocr", files={"file": ("kotak_promo.png", readable_bytes, "image/png")})
    print(f"POST /ocr on readable image: status_code={res_ocr.status_code}")
    print(f"Response: {res_ocr.json()}\n")
    
    # Test POST /analyze/image with readable image
    res_analyze_img = client.post("/analyze/image", files={"file": ("kotak_promo.png", readable_bytes, "image/png")})
    print(f"POST /analyze/image on readable image: status_code={res_analyze_img.status_code}")
    if res_analyze_img.status_code == 200:
        res_data = res_analyze_img.json()["result"]
        print(f"Result keys: {list(res_data.keys())}")
        verdict = res_data.get("verdict") or res_data.get("final_verdict")
        score = res_data.get("risk_score") or res_data.get("score")
        print(f"Analysis Verdict: {verdict}, Score: {score}\n")
    else:
        print(f"Analysis Failed: {res_analyze_img.text}\n")

    print("=== 2. TESTING BLANK IMAGE ===")
    blank_img = Image.new("RGB", (300, 300), color=(255, 255, 255))
    b_buf = io.BytesIO()
    blank_img.save(b_buf, format="PNG")
    blank_bytes = b_buf.getvalue()
    
    res_blank = client.post("/ocr", files={"file": ("blank.png", blank_bytes, "image/png")})
    print(f"POST /ocr on blank image: status_code={res_blank.status_code} (Expected 422)")
    print(f"Detail: {res_blank.json().get('detail')}\n")

    print("=== 3. TESTING CORRUPT IMAGE ===")
    corrupt_bytes = b"\x89PNG\r\n\x1a\n" + b"Corrupted garbage data not a valid image payload"
    res_corrupt = client.post("/ocr", files={"file": ("corrupt.png", corrupt_bytes, "image/png")})
    print(f"POST /ocr on corrupt image: status_code={res_corrupt.status_code} (Expected 422)")
    print(f"Detail: {res_corrupt.json().get('detail')}\n")

    print("=== 4. TESTING OVERSIZED FILE ===")
    oversized_bytes = b"\x89PNG\r\n\x1a\n" + b"0" * (6 * 1024 * 1024)
    res_oversized = client.post("/ocr", files={"file": ("oversized.png", oversized_bytes, "image/png")})
    print(f"POST /ocr on oversized file: status_code={res_oversized.status_code} (Expected 400)")
    print(f"Detail: {res_oversized.json().get('detail')}\n")

    print("=== 5. TESTING UNSUPPORTED / EXECUTABLE FILE ===")
    exe_bytes = b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00" + b"some executable code"
    res_exe = client.post("/ocr", files={"file": ("malware.exe", exe_bytes, "application/octet-stream")})
    print(f"POST /ocr on executable: status_code={res_exe.status_code} (Expected 422 or 400)")
    print(f"Detail: {res_exe.json().get('detail')}\n")

    print("=== 6. TESTING CMYK IMAGE ===")
    cmyk_img = Image.new("CMYK", (400, 100), color=(0, 0, 0, 0))
    d_cmyk = ImageDraw.Draw(cmyk_img)
    d_cmyk.text((20, 30), "CMYK IMAGE TEST TEXT", fill=(0, 0, 0, 255))
    c_buf = io.BytesIO()
    cmyk_img.save(c_buf, format="JPEG")
    cmyk_bytes = c_buf.getvalue()
    success_cmyk, text_cmyk, code_cmyk = ocr.process_image(cmyk_bytes, "cmyk.jpg")
    print(f"CMYK Image OCR: success={success_cmyk}, code={code_cmyk}")

    print("=== 7. TESTING GRAYSCALE IMAGE ===")
    gray_img = Image.new("L", (400, 100), color=255)
    d_gray = ImageDraw.Draw(gray_img)
    d_gray.text((20, 30), "GRAYSCALE IMAGE TEST TEXT", fill=0)
    g_buf = io.BytesIO()
    gray_img.save(g_buf, format="PNG")
    gray_bytes = g_buf.getvalue()
    success_gray, text_gray, code_gray = ocr.process_image(gray_bytes, "gray.png")
    print(f"Grayscale Image OCR: success={success_gray}, code={code_gray}")

if __name__ == "__main__":
    main()
