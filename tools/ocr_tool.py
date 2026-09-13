import io
import os
import re
from typing import Tuple, Optional
from PIL import Image

class OCRTool:
    def __init__(self):
        self.boto_client = None
        # Check if AWS credentials or region are available
        if os.environ.get("AWS_ACCESS_KEY_ID") and os.environ.get("AWS_REGION"):
            try:
                import boto3
                self.boto_client = boto3.client("textract", region_name=os.environ.get("AWS_REGION", "us-east-1"))
            except Exception as e:
                print(f"[OCRTool] AWS Textract init skipped: {e}")

    def _validate_magic_bytes(self, data: bytes) -> Tuple[bool, str]:
        """Validates that file header matches known image magic numbers."""
        if len(data) < 12:
            return False, "File is too small to be a valid image."
        
        # JPEG: FF D8 FF
        if data[:3] == b"\xff\xd8\xff":
            return True, "JPEG"
        # PNG: 89 50 4E 47 0D 0A 1A 0A
        if data[:8] == b"\x89PNG\r\n\x1a\n":
            return True, "PNG"
        # WebP: RIFF .... WEBP
        if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
            return True, "WEBP"
            
        return False, "Unsupported image header or invalid magic bytes."

    def process_image(self, image_bytes: bytes, filename: str = "upload.png") -> Tuple[bool, str, Optional[str]]:
        """
        Validates image header, strips EXIF metadata, and extracts text.
        Returns (success: bool, text_or_error: str, failure_code: Optional[str])
        """
        # 1. Path traversal & filename sanitation
        safe_filename = os.path.basename(filename).replace("\x00", "").strip()
        if not safe_filename or ".." in safe_filename:
            safe_filename = "upload.png"

        # 2. Size validation (max 5MB, min 100 bytes)
        if len(image_bytes) > 5 * 1024 * 1024:
            return False, "Image size exceeds 5MB limit. Please upload a smaller screenshot.", "FILE_TOO_LARGE"
        if len(image_bytes) < 100:
            return False, "Uploaded file is too small to be a valid screenshot.", "CORRUPT_IMAGE"

        # 3. Magic bytes validation (anti-polyglot/spoofing)
        valid_magic, detected_format = self._validate_magic_bytes(image_bytes)
        if not valid_magic:
            return False, f"Invalid image format: {detected_format}. Please upload JPEG, PNG, or WebP.", "INVALID_FORMAT"

        # 4. Format validation & EXIF stripping via PIL
        try:
            img = Image.open(io.BytesIO(image_bytes))
            if img.format not in ["JPEG", "PNG", "WEBP", "MPO"]:
                return False, f"Unsupported image format: {img.format}. Please upload JPEG or PNG.", "INVALID_FORMAT"

            # Convert image to RGB or RGBA (handles CMYK, Palette, Grayscale cleanly without PNG errors)
            if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
                target_mode = "RGBA"
            else:
                target_mode = "RGB"
            clean_img = img.convert(target_mode)

            # Strip EXIF metadata by re-saving pixel data into clean PNG buffer
            clean_buffer = io.BytesIO()
            clean_img.save(clean_buffer, format="PNG")
            cleaned_bytes = clean_buffer.getvalue()
        except Exception as e:
            return False, f"Corrupt or unreadable image file: {str(e)}", "CORRUPT_IMAGE"

        # 5. Textract execution if configured in production
        if self.boto_client:
            try:
                response = self.boto_client.detect_document_text(
                    Document={'Bytes': cleaned_bytes}
                )
                extracted_lines = []
                for block in response.get("Blocks", []):
                    if block.get("BlockType") == "LINE":
                        extracted_lines.append(block.get("Text", ""))
                extracted_text = "\n".join(extracted_lines).strip()
                if extracted_text:
                    return True, extracted_text, None
            except Exception as e:
                print(f"[OCRTool] AWS Textract failed: {e}")

        # 6. Local OCR fallback via pytesseract if available on host
        try:
            import pytesseract
            text = pytesseract.image_to_string(img)
            if text and len(text.strip()) > 5:
                return True, text.strip(), None
        except Exception:
            pass

        # 7. Local OCR fallback via Windows.Media.Ocr on Windows hosts
        if os.name == "nt":
            try:
                ps_script = os.path.join(os.path.dirname(os.path.abspath(__file__)), "win_ocr.ps1")
                if os.path.exists(ps_script):
                    import tempfile
                    import subprocess
                    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tf:
                        tf.write(cleaned_bytes)
                        tf_path = tf.name
                    try:
                        cmd = ["powershell", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", ps_script, "-ImagePath", tf_path]
                        res = subprocess.run(cmd, capture_output=True, text=True, timeout=12)
                        win_text = res.stdout.strip()
                        if win_text and len(win_text) >= 3:
                            return True, win_text, None
                    finally:
                        if os.path.exists(tf_path):
                            try:
                                os.unlink(tf_path)
                            except Exception:
                                pass
            except Exception as wex:
                print(f"[OCRTool] Windows native OCR error: {wex}")

        # 8. No legible text detected in image
        return False, (
            "Could not extract legible text from this image. "
            "Please ensure the screenshot contains readable text, "
            "or copy and paste the message text directly into the text input tab."
        ), "OCR_FAILED"

