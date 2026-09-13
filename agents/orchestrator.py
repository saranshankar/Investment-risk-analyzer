import time
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from tools.ocr_tool import OCRTool
from agents.extraction_agent import ExtractionAgent
from agents.safety_agent import SafetyAgent
from agents.explanation_agent import ExplanationAgent
from backend.services.verification_engine import VerificationEngine
from backend.services.rule_engine import RuleEngine
from backend.services.evidence_aggregator import EvidenceAggregator

DISCLAIMER_TEXT = (
    "TipCheck provides regulatory claim verification and pattern detection signals based on "
    "authoritative public datasets. TipCheck is not an investment adviser, does not assess investment "
    "merit, and does not provide financial or legal advice. Always independently verify registrations "
    "directly at sebi.gov.in."
)

class TipCheckOrchestrator:
    def __init__(
        self,
        verification_engine: Optional[VerificationEngine] = None,
        rule_engine: Optional[RuleEngine] = None
    ):
        self.ocr_tool = OCRTool()
        self.extraction_agent = ExtractionAgent()
        self.safety_agent = SafetyAgent()
        self.explanation_agent = ExplanationAgent(self.safety_agent)
        self.verification_engine = verification_engine or VerificationEngine()
        self.rule_engine = rule_engine or RuleEngine()
        self.evidence_aggregator = EvidenceAggregator(self.rule_engine)
        self.audit_logs = []

    def log_step(self, analysis_id: str, step: str, status: str, duration_ms: int, error_detail: Optional[str] = None):
        log_entry = {
            "log_id": str(uuid.uuid4()),
            "analysis_id": analysis_id,
            "step": step,
            "status": status,
            "duration_ms": duration_ms,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "error_detail": error_detail
        }
        self.audit_logs.append(log_entry)

    def analyze_text(self, text: str, analysis_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes end-to-end agentic workflow on raw text.
        """
        aid = analysis_id or str(uuid.uuid4())
        start_time = time.time()

        # Step 1: Input Validation
        step_start = time.time()
        if not text or len(text.strip()) == 0:
            raise ValueError("Submitted message text cannot be empty.")
        if len(text) > 10000:
            raise ValueError("Message text exceeds 10,000 character limit.")
        self.log_step(aid, "input_validation", "success", int((time.time() - step_start) * 1000))

        # Step 2: Extraction Agent (LLM / Schema-constrained)
        step_start = time.time()
        try:
            claim = self.extraction_agent.extract(text, source_type="text")
            self.log_step(aid, "extraction", "success", int((time.time() - step_start) * 1000))
        except Exception as e:
            self.log_step(aid, "extraction", "failure", int((time.time() - step_start) * 1000), str(e))
            raise e

        # Step 3: Deterministic Registry Verification
        step_start = time.time()
        verif = self.verification_engine.verify(
            registration_number_claimed=claim.get("registration_number_claimed"),
            entity_name_claimed=claim.get("entity_name_claimed")
        )
        self.log_step(aid, "verification", "success", int((time.time() - step_start) * 1000))

        # Step 4 & 5: Rule Engine & Evidence Aggregation
        step_start = time.time()
        evidence = self.evidence_aggregator.aggregate(claim, verif)
        self.log_step(aid, "rule_engine", "success", int((time.time() - step_start) * 1000))

        # Step 6 & 7: Explanation & Safety Agent
        step_start = time.time()
        explanation = self.explanation_agent.explain(evidence)
        self.log_step(aid, "explanation", "success", int((time.time() - step_start) * 1000))

        # Final Verdict Assembly
        final_verdict = {
            "analysis_id": aid,
            "verdict_bucket": evidence["verdict_bucket"],
            "evidence": evidence,
            "explanation": explanation,
            "disclaimer": DISCLAIMER_TEXT,
            "registry_snapshot_date": verif.get("registry_snapshot_date") or self.verification_engine.snapshot_date,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        return final_verdict

    def analyze_image(self, image_bytes: bytes, filename: str = "screenshot.png", analysis_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes end-to-end workflow starting from screenshot OCR.
        """
        aid = analysis_id or str(uuid.uuid4())
        step_start = time.time()

        success, ocr_text, err_code = self.ocr_tool.process_image(image_bytes, filename)
        if not success:
            self.log_step(aid, "ocr", "failure", int((time.time() - step_start) * 1000), ocr_text)
            raise ValueError(f"OCR Error ({err_code}): {ocr_text}")

        self.log_step(aid, "ocr", "success", int((time.time() - step_start) * 1000))
        verdict = self.analyze_text(ocr_text, analysis_id=aid)
        verdict["evidence"]["extracted_claim"]["source_type"] = "screenshot"
        return verdict

    def reverify(
        self,
        analysis_id: str,
        claim: Dict[str, Any],
        corrected_reg_no: Optional[str] = None,
        corrected_entity_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Allows user to update extracted fields and re-run deterministic verification & explanation.
        """
        updated_claim = dict(claim)
        if corrected_reg_no is not None:
            updated_claim["registration_number_claimed"] = corrected_reg_no.strip() or None
        if corrected_entity_name is not None:
            updated_claim["entity_name_claimed"] = corrected_entity_name.strip() or None

        verif = self.verification_engine.verify(
            registration_number_claimed=updated_claim.get("registration_number_claimed"),
            entity_name_claimed=updated_claim.get("entity_name_claimed")
        )

        evidence = self.evidence_aggregator.aggregate(updated_claim, verif)
        explanation = self.explanation_agent.explain(evidence)

        return {
            "analysis_id": analysis_id,
            "verdict_bucket": evidence["verdict_bucket"],
            "evidence": evidence,
            "explanation": explanation,
            "disclaimer": DISCLAIMER_TEXT,
            "registry_snapshot_date": verif.get("registry_snapshot_date") or self.verification_engine.snapshot_date,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
