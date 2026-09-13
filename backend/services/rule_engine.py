import re
import os
from pathlib import Path
from typing import Dict, Any, List, Optional
import yaml

class RuleEngine:
    def __init__(self, rules_config_path: Optional[str] = None):
        if not rules_config_path:
            base_dir = Path(__file__).resolve().parent.parent.parent
            rules_config_path = str(base_dir / "rules" / "rules.yaml")
        self.rules_config_path = rules_config_path
        self.config: Dict[str, Any] = {}
        self.rules: List[Dict[str, Any]] = []
        self.load_rules()

    def load_rules(self):
        try:
            with open(self.rules_config_path, "r", encoding="utf-8") as f:
                self.config = yaml.safe_load(f)
                self.rules = self.config.get("rules", [])
        except Exception as e:
            print(f"[RuleEngine] Error loading rules YAML: {e}")

    def evaluate(
        self,
        extracted_claim: Dict[str, Any],
        verification_result: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Deterministically evaluates all rules against ExtractedClaim and VerificationResult.
        Returns list of RiskSignal objects.
        """
        signals = []

        # 1. REG-01: Not found
        reg_lookup = verification_result.get("registration_lookup", "not_applicable")
        if reg_lookup == "not_found":
            signals.append({
                "rule_id": "REG-01",
                "category": "regulatory",
                "severity": "high",
                "triggered": True,
                "evidence_text": f"Claimed registration number '{extracted_claim.get('registration_number_claimed')}' not found in SEBI registry snapshot.",
                "score_contribution": 30
            })

        # 2. REG-02: Inactive status
        status_check = verification_result.get("status_check", "unknown")
        if status_check == "inactive":
            signals.append({
                "rule_id": "REG-02",
                "category": "regulatory",
                "severity": "high",
                "triggered": True,
                "evidence_text": f"SEBI registration '{extracted_claim.get('registration_number_claimed')}' is listed as Inactive, Suspended, or Cancelled.",
                "score_contribution": 25
            })

        # 3. REG-03: Registry unavailable
        if reg_lookup == "registry_unavailable":
            signals.append({
                "rule_id": "REG-03",
                "category": "regulatory",
                "severity": "low",
                "triggered": True,
                "evidence_text": "SEBI registry service was temporarily unreachable during lookup.",
                "score_contribution": 0
            })

        # 3b. REG-04: Missing registration number
        claimed_entity = extracted_claim.get("entity_name_claimed")
        claimed_reg = extracted_claim.get("registration_number_claimed")
        if claimed_entity and not claimed_reg:
            signals.append({
                "rule_id": "REG-04",
                "category": "regulatory",
                "severity": "medium",
                "triggered": True,
                "evidence_text": f"Investment advisory claims made by '{claimed_entity}' without stating a mandatory SEBI registration number.",
                "score_contribution": 20
            })

        # 4. ID-01: Name mismatch
        name_match = verification_result.get("name_match", "not_applicable")
        if name_match == "mismatch":
            claimed = verification_result.get("claimed_name") or extracted_claim.get("entity_name_claimed") or "Unknown"
            registered = verification_result.get("registered_name") or "Unknown"
            signals.append({
                "rule_id": "ID-01",
                "category": "identity",
                "severity": "high",
                "triggered": True,
                "evidence_text": f"Claimed entity '{claimed}' does not match official registered name '{registered}'.",
                "score_contribution": 30
            })

        # 5. ID-02: Partial match
        if name_match == "partial_match":
            claimed = verification_result.get("claimed_name") or extracted_claim.get("entity_name_claimed") or "Unknown"
            registered = verification_result.get("registered_name") or "Unknown"
            signals.append({
                "rule_id": "ID-02",
                "category": "identity",
                "severity": "medium",
                "triggered": True,
                "evidence_text": f"Claimed name '{claimed}' partially matches registered name '{registered}' (score: {verification_result.get('name_match_score', 0)}).",
                "score_contribution": 10
            })

        # 6. ID-03: Cross-Registration Swapping (if flagged in extraction notes or multiple entities)
        extraction_notes = " ".join(extracted_claim.get("extraction_notes", [])).lower()
        if "swapped" in extraction_notes or "cross_swapped" in extraction_notes:
            signals.append({
                "rule_id": "ID-03",
                "category": "identity",
                "severity": "high",
                "triggered": True,
                "evidence_text": "Entity name or credential belongs to a different known institution than claimed.",
                "score_contribution": 25
            })

        # 7. FIN-01: Guaranteed Return Language
        claimed_returns = extracted_claim.get("claimed_returns", [])
        has_guarantee = any(r.get("type") == "guaranteed" for r in claimed_returns)
        fin1_rule = next((r for r in self.rules if r["id"] == "FIN-01"), None)
        guarantee_phrases = fin1_rule.get("match_phrases", []) if fin1_rule else []
        
        # Check text in claimed returns
        return_texts = [r.get("text", "") for r in claimed_returns]
        matching_fin1_text = ""
        for rt in return_texts:
            for phrase in guarantee_phrases:
                if phrase.lower() in rt.lower():
                    has_guarantee = True
                    matching_fin1_text = rt
                    break
            if has_guarantee and matching_fin1_text:
                break

        if has_guarantee:
            evidence = matching_fin1_text if matching_fin1_text else (return_texts[0] if return_texts else "Guaranteed return language detected.")
            signals.append({
                "rule_id": "FIN-01",
                "category": "financial",
                "severity": "high",
                "triggered": True,
                "evidence_text": f"Guaranteed or risk-free return promised: \"{evidence}\"",
                "score_contribution": 20
            })

        # 8. FIN-02: Unrealistic Return Magnitude
        unrealistic_match = False
        unrealistic_text = ""
        for rt in return_texts:
            # Check for numbers like 30%, 40%, 100%, 200%, 500% or "double"
            pct_matches = re.findall(r"(\d+)\s*%", rt)
            for m in pct_matches:
                if int(m) >= 25:
                    unrealistic_match = True
                    unrealistic_text = rt
                    break
            if "double" in rt.lower() or "triple" in rt.lower() or "10x" in rt.lower():
                unrealistic_match = True
                unrealistic_text = rt
                break

        if unrealistic_match:
            signals.append({
                "rule_id": "FIN-02",
                "category": "financial",
                "severity": "high",
                "triggered": True,
                "evidence_text": f"Unrealistic return promise detected: \"{unrealistic_text}\"",
                "score_contribution": 20
            })

        # 9. FIN-03: Unverifiable Past Performance
        for rt in return_texts:
            if any(term in rt.lower() for term in ["past record", "track record", "historical accuracy", "100% strike", "jackpot"]):
                signals.append({
                    "rule_id": "FIN-03",
                    "category": "financial",
                    "severity": "medium",
                    "triggered": True,
                    "evidence_text": f"Unsubstantiated past performance claim: \"{rt}\"",
                    "score_contribution": 10
                })
                break

        # 10. PSY-01: Artificial Urgency
        urgency_list = extracted_claim.get("urgency_language", [])
        if urgency_list:
            signals.append({
                "rule_id": "PSY-01",
                "category": "psychological",
                "severity": "medium",
                "triggered": True,
                "evidence_text": f"Urgency language detected: \"{urgency_list[0]}\"",
                "score_contribution": 10
            })

        # 11. PSY-02: Scarcity & Exclusivity
        exclusivity_list = extracted_claim.get("exclusivity_language", [])
        if exclusivity_list:
            signals.append({
                "rule_id": "PSY-02",
                "category": "psychological",
                "severity": "medium",
                "triggered": True,
                "evidence_text": f"Scarcity/exclusivity framing detected: \"{exclusivity_list[0]}\"",
                "score_contribution": 10
            })

        # 12. PSY-03: Social proof pressure
        notes_and_claims = " ".join(extracted_claim.get("extraction_notes", []) + urgency_list).lower()
        if any(term in notes_and_claims for term in ["everyone earning", "all members", "already joined", "group profit"]):
            signals.append({
                "rule_id": "PSY-03",
                "category": "psychological",
                "severity": "low",
                "triggered": True,
                "evidence_text": "Social proof pressure language detected in message context.",
                "score_contribution": 5
            })

        # 13. PAY-01: Upfront payment
        payment_requests = extracted_claim.get("payment_requests", [])
        if payment_requests:
            signals.append({
                "rule_id": "PAY-01",
                "category": "payment",
                "severity": "high",
                "triggered": True,
                "evidence_text": f"Upfront fee / payment requested: \"{payment_requests[0].get('text', '')}\"",
                "score_contribution": 20
            })

        # 14. PAY-02: Personal UPI / unofficial channel
        personal_upi = False
        upi_text = ""
        for pr in payment_requests:
            t = pr.get("text", "")
            method = pr.get("method_hint") or ""
            combined = f"{t} {method}".lower()
            if any(handle in combined for handle in ["@ok", "@ybl", "@paytm", "gpay", "phonepe", "upi", "personal account"]):
                personal_upi = True
                upi_text = t
                break

        # Also check contact_info for UPI
        for c in extracted_claim.get("contact_info", []):
            val = c.get("value", "").lower()
            if any(handle in val for handle in ["@ok", "@ybl", "@paytm", "upi"]):
                personal_upi = True
                upi_text = c.get("value")
                break

        if personal_upi:
            signals.append({
                "rule_id": "PAY-02",
                "category": "payment",
                "severity": "high",
                "triggered": True,
                "evidence_text": f"Payment requested via personal UPI/handle: \"{upi_text}\"",
                "score_contribution": 20
            })

        # 15. COMM-01: Informal messaging only
        contacts = extracted_claim.get("contact_info", [])
        has_email_or_domain = any(c.get("type") == "email" or "@" in c.get("value", "") and not any(u in c.get("value", "") for u in ["@ok", "@ybl", "@paytm"]) for c in contacts)
        has_phone_or_handle = any(c.get("type") in ["phone", "handle"] for c in contacts)
        if has_phone_or_handle and not has_email_or_domain and not extracted_claim.get("entity_name_claimed"):
            signals.append({
                "rule_id": "COMM-01",
                "category": "communication",
                "severity": "low",
                "triggered": True,
                "evidence_text": "Tip originates exclusively from an informal personal phone or Telegram handle with no institutional contact.",
                "score_contribution": 5
            })

        # 16. COMM-02: Shortened or unverified link
        links = extracted_claim.get("links", [])
        shortened_link = None
        for l in links:
            if any(domain in l.lower() for domain in ["bit.ly", "tinyurl.com", "t.me", "wa.me", "chat.whatsapp.com", "is.gd"]):
                shortened_link = l
                break

        if shortened_link:
            signals.append({
                "rule_id": "COMM-02",
                "category": "communication",
                "severity": "medium",
                "triggered": True,
                "evidence_text": f"Shortened or unverified invite link: \"{shortened_link}\"",
                "score_contribution": 10
            })

        return signals

    def compute_score_and_bucket(
        self,
        signals: List[Dict[str, Any]],
        verification_result: Dict[str, Any]
    ) -> tuple[int, str]:
        """
        Calculates total score and assigns verdict bucket:
        - 0-19: LOW_CONCERN
        - 20-49: NEEDS_VERIFICATION
        - 50+: HIGH_RISK_INDICATORS

        OVERRIDE RULE:
        If registration_lookup == "not_found" AND (any FIN-* or any PAY-* rule fires),
        force HIGH_RISK_INDICATORS regardless of score.
        """
        total_score = sum(s["score_contribution"] for s in signals if s.get("triggered", False))

        if total_score >= 50:
            bucket = "HIGH_RISK_INDICATORS"
        elif total_score >= 20:
            bucket = "NEEDS_VERIFICATION"
        else:
            bucket = "LOW_CONCERN"

        # Check override rule:
        reg_lookup = verification_result.get("registration_lookup")
        has_fin = any(s["rule_id"].startswith("FIN-") and s.get("triggered") for s in signals)
        has_pay = any(s["rule_id"].startswith("PAY-") and s.get("triggered") for s in signals)
        has_reg04 = any(s["rule_id"] == "REG-04" and s.get("triggered") for s in signals)

        if (reg_lookup == "not_found" or has_reg04) and (has_fin or has_pay):
            bucket = "HIGH_RISK_INDICATORS"

        return total_score, bucket
