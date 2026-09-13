import json
import logging
import os
import time
import uuid
from collections import defaultdict
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, HTTPException, Request, Response, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from agents.orchestrator import TipCheckOrchestrator

# Configure secure server logger (do NOT log sensitive user messages)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("tipcheck.api")

app = FastAPI(
    title="TipCheck API",
    description="AI-assisted evidence engine verifying investment tips against SEBI registry records",
    version="1.0.0"
)

# 1. CORS Configuration (Support both local development and cloud production deployments)
allowed_origins_env = os.environ.get("ALLOWED_ORIGINS", "").strip()
if allowed_origins_env:
    if allowed_origins_env == "*":
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=False,
            allow_methods=["GET", "POST", "OPTIONS"],
            allow_headers=["*"],
        )
    else:
        allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
        app.add_middleware(
            CORSMiddleware,
            allow_origins=allowed_origins,
            allow_credentials=True,
            allow_methods=["GET", "POST", "OPTIONS"],
            allow_headers=["*"],
        )
else:
    # Default: allow all origins so deployed frontends and local dev work with zero CORS friction
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )

# 2. Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# 3. In-memory Rate Limiter (60 requests per minute per IP)
RATE_LIMIT_PER_MINUTE = int(os.environ.get("RATE_LIMIT_PER_MINUTE", "60"))
ip_request_timestamps = defaultdict(list)

@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    # Bypass health check, docs, and static assets from rate limits
    if request.url.path in ("/health", "/docs", "/openapi.json") or request.url.path.startswith("/assets"):
        return await call_next(request)
        
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
    else:
        client_ip = request.client.host if request.client else "unknown"

    now = time.time()
    
    # Prune timestamps older than 60s
    timestamps = [ts for ts in ip_request_timestamps[client_ip] if now - ts < 60.0]
    if len(timestamps) >= RATE_LIMIT_PER_MINUTE:
        logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please slow down and try again in a moment."}
        )
    
    timestamps.append(now)
    ip_request_timestamps[client_ip] = timestamps
    return await call_next(request)

# 4. Global Exception Handler (Prevent internal stack trace leaks)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url.path}: {type(exc).__name__}: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred while processing your request. Please try again later."}
    )

# In-memory storage for analysis results (mimics DynamoDB AnalysisRequests table)
analysis_store: Dict[str, Dict[str, Any]] = {}
orchestrator = TipCheckOrchestrator()

class AnalyzeTextRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000, description="Raw pasted message text")
    session_id: Optional[str] = None

class VerificationUpdateRequest(BaseModel):
    analysis_id: str
    corrected_registration_number: Optional[str] = None
    corrected_entity_name: Optional[str] = None

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/system/status")
def system_status():
    bedrock_configured = bool(os.environ.get("BEDROCK_MODEL_ID_EXTRACTION") and os.environ.get("AWS_REGION"))
    return {
        "registry_snapshot_date": orchestrator.verification_engine.snapshot_date,
        "model_status": "ok",
        "llm_provider": "AWS Bedrock (Production Mode)" if bedrock_configured else "Strands Deterministic Engine (Local Mode)",
        "ocr_provider": "Amazon Textract" if orchestrator.ocr_tool.boto_client else "Built-in Image Parser",
        "degraded_reasons": []
    }

@app.get("/api/sample-cases")
def get_sample_cases():
    dataset_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "datasets", "test_cases.json")
    if os.path.exists(dataset_path):
        with open(dataset_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"cases": []}

@app.post("/analyze/text", status_code=status.HTTP_200_OK)
def analyze_text(payload: AnalyzeTextRequest):
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    
    analysis_id = str(uuid.uuid4())
    try:
        verdict = orchestrator.analyze_text(payload.text, analysis_id=analysis_id)
        analysis_store[analysis_id] = {
            "status": "complete",
            "result": verdict
        }
        return {
            "analysis_id": analysis_id,
            "status": "complete",
            "result": verdict
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Pipeline error during text analysis: {type(e).__name__}: {str(e)}")
        analysis_store[analysis_id] = {
            "status": "failed",
            "error": "Analysis pipeline failed"
        }
        raise HTTPException(status_code=500, detail="Analysis pipeline failed to process this message.")

@app.post("/analyze", status_code=status.HTTP_200_OK)
def analyze_unified(payload: AnalyzeTextRequest):
    """Primary unified text analysis endpoint (alias for /analyze/text)."""
    return analyze_text(payload)

@app.post("/ocr", status_code=status.HTTP_200_OK)
async def extract_ocr(file: UploadFile = File(...)):
    """Independent OCR endpoint extracting legible text from screenshot images."""
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds 5MB size limit.")
    if len(contents) < 50:
        raise HTTPException(status_code=400, detail="Uploaded file is empty or too small.")

    safe_name = os.path.basename(file.filename or "upload.png").replace("\x00", "").strip()
    if not safe_name or ".." in safe_name:
        safe_name = "upload.png"

    success, text_or_err, err_code = orchestrator.ocr_tool.process_image(contents, filename=safe_name)
    if not success:
        raise HTTPException(status_code=422, detail=f"OCR Error ({err_code}): {text_or_err}")

    return {
        "status": "success",
        "filename": safe_name,
        "extracted_text": text_or_err,
        "character_count": len(text_or_err)
    }

@app.post("/analyze/image", status_code=status.HTTP_200_OK)
async def analyze_image(
    file: UploadFile = File(...),
    session_id: Optional[str] = Form(None)
):
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds 5MB size limit.")
    if len(contents) < 50:
        raise HTTPException(status_code=400, detail="Uploaded file is empty or too small.")

    safe_name = os.path.basename(file.filename or "upload.png").replace("\x00", "").strip()
    if not safe_name or ".." in safe_name:
        safe_name = "upload.png"

    analysis_id = str(uuid.uuid4())
    try:
        verdict = orchestrator.analyze_image(contents, filename=safe_name, analysis_id=analysis_id)
        analysis_store[analysis_id] = {
            "status": "complete",
            "result": verdict
        }
        return {
            "analysis_id": analysis_id,
            "status": "complete",
            "result": verdict
        }
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        logger.error(f"Image processing error: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process image.")

@app.get("/analysis/{analysis_id}")
def get_analysis(analysis_id: str):
    if analysis_id not in analysis_store:
        raise HTTPException(status_code=404, detail="Analysis record not found.")
    data = analysis_store[analysis_id]
    return {
        "analysis_id": analysis_id,
        "status": data.get("status", "complete"),
        "result": data.get("result")
    }

@app.post("/verification")
def update_verification(payload: VerificationUpdateRequest):
    if payload.analysis_id not in analysis_store:
        raise HTTPException(status_code=404, detail="Analysis ID not found.")
    
    entry = analysis_store[payload.analysis_id]
    prev_result = entry.get("result")
    if not prev_result:
        raise HTTPException(status_code=400, detail="Previous analysis result not available.")
    
    claim = prev_result["evidence"]["extracted_claim"]
    updated_verdict = orchestrator.reverify(
        analysis_id=payload.analysis_id,
        claim=claim,
        corrected_reg_no=payload.corrected_registration_number,
        corrected_entity_name=payload.corrected_entity_name
    )
    analysis_store[payload.analysis_id] = {
        "status": "complete",
        "result": updated_verdict
    }
    return updated_verdict

@app.get("/registry/search")
def search_registry(query: str = ""):
    results = orchestrator.verification_engine.search_registry(query)
    return {
        "query": query,
        "results": results,
        "snapshot_date": orchestrator.verification_engine.snapshot_date,
        "total": len(results)
    }

# 5. Serve Built Frontend (SPA) in Production / Unified Deployment
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    API_PREFIXES = ("api/", "analyze", "system/", "verification", "registry/", "ocr", "health", "docs", "openapi.json")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if any(full_path.startswith(prefix) for prefix in API_PREFIXES):
            raise HTTPException(status_code=404, detail="API endpoint not found")
            
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Page not found")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    logger.info(f"Starting TipCheck server on {host}:{port}")
    uvicorn.run(app, host=host, port=port)

