import json
import os
import re
from typing import Dict, Any, List
from agents.safety_agent import SafetyAgent

EXPLANATION_SYSTEM_PROMPT = """ROLE: You explain an already-computed Evidence object to a non-expert user in
plain language. You do not have access to the original message text. You do
not add, infer, or guess any fact that is not present in the Evidence object
provided to you.

RULES:
- For each risk_signal in the input, write one short, plain-language sentence
  describing exactly that signal and its evidence_text.
- Never state a legal or factual conclusion beyond the verdict_bucket already
  computed (never say 'this is a scam' or 'this person is a fraud').
- Never provide investment advice (never say 'you should/shouldn't invest').
- Use cautious phrasing such as 'could not be verified', 'red flag detected',
  'identity mismatch', 'unverified claim' — never 'confirmed fraud'.
- Return ONLY a JSON array of objects with {item, type, text}, where type is one of:
  'verified_fact', 'extracted_claim', 'rule_signal', 'ai_explanation'.
"""

class TemplatedExplainer:
    def explain(self, evidence: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        High-reliability deterministic template generator ensuring 100% grounded explanations
        with the four-way tag system.
        """
        items: List[Dict[str, Any]] = []
        claim = evidence.get("extracted_claim", {})
        verif = evidence.get("verification_result", {})
        signals = evidence.get("risk_signals", [])
        bucket = evidence.get("verdict_bucket", "NEEDS_VERIFICATION")

        # 1. Extracted Claim Summary
        reg_claimed = claim.get("registration_number_claimed")
        entity_claimed = claim.get("entity_name_claimed")
        if reg_claimed:
            items.append({
                "item": "Claimed Registration",
                "type": "extracted_claim",
                "text": f"The message asserts SEBI registration number '{reg_claimed}'."
            })
        if entity_claimed:
            items.append({
                "item": "Claimed Advisor/Firm",
                "type": "extracted_claim",
                "text": f"The message claims association with '{entity_claimed}'."
            })

        # 2. Verified Facts (from SEBI Registry)
        lookup = verif.get("registration_lookup")
        status = verif.get("status_check")
        name_match = verif.get("name_match")
        registered_name = verif.get("registered_name")
        snapshot_date = verif.get("registry_snapshot_date", "recent")

        if lookup == "found":
            if status == "active":
                items.append({
                    "item": "Registry Status",
                    "type": "verified_fact",
                    "text": f"Registration number '{reg_claimed}' exists in the SEBI registry snapshot ({snapshot_date}) with Active status."
                })
            else:
                items.append({
                    "item": "Registry Status",
                    "type": "verified_fact",
                    "text": f"Registration number '{reg_claimed}' exists in the SEBI registry but is listed as '{status.upper()}'."
                })

            if name_match == "match":
                items.append({
                    "item": "Identity Match",
                    "type": "verified_fact",
                    "text": f"Registered entity matches: '{registered_name}'."
                })
            elif name_match == "partial_match":
                items.append({
                    "item": "Identity Partial Match",
                    "type": "verified_fact",
                    "text": f"Registered entity '{registered_name}' only partially matches claimed name '{entity_claimed}'."
                })
            elif name_match == "mismatch":
                items.append({
                    "item": "Identity Mismatch",
                    "type": "verified_fact",
                    "text": f"Number '{reg_claimed}' officially belongs to '{registered_name}', NOT '{entity_claimed}'."
                })
        elif lookup == "not_found":
            items.append({
                "item": "Registry Lookup",
                "type": "verified_fact",
                "text": f"Registration number '{reg_claimed}' was NOT FOUND in the SEBI registry snapshot (dated {snapshot_date})."
            })
        elif lookup == "registry_unavailable":
            items.append({
                "item": "Registry Availability",
                "type": "verified_fact",
                "text": "SEBI registry service was temporarily unavailable during this lookup."
            })

        # 3. Rule Signals
        for sig in signals:
            if sig.get("triggered", False):
                items.append({
                    "item": sig.get("rule_id", "Risk Signal"),
                    "type": "rule_signal",
                    "text": sig.get("evidence_text", "")
                })

        # 4. Synthesized Plain-Language AI Explanation
        if bucket == "HIGH_RISK_INDICATORS":
            summary_text = "This message exhibits critical risk indicators: unverified or mismatched credentials combined with aggressive promotional or upfront payment pressure."
        elif bucket == "NEEDS_VERIFICATION":
            summary_text = "While some credentials or attributes appear plausible, cautionary indicators were detected. Independent manual verification is strongly recommended."
        else:
            summary_text = "The claimed registration was verified in the official SEBI directory with active status, and no high-risk manipulation patterns were flagged."

        items.append({
            "item": "Synthesis & Next Steps",
            "type": "ai_explanation",
            "text": summary_text
        })

        return items

class ExplanationAgent:
    def __init__(self, safety_agent: SafetyAgent):
        self.safety_agent = safety_agent
        self.fallback = TemplatedExplainer()

    def explain(self, evidence: Dict[str, Any]) -> List[Dict[str, Any]]:
        # Try Bedrock LLM explanation if configured
        draft = self._try_bedrock_explain(evidence)
        if not draft:
            draft = self.fallback.explain(evidence)

        # Pass through Safety Guardrail Agent
        is_approved, reason, sanitized = self.safety_agent.check(evidence, draft)
        if not is_approved:
            print(f"[ExplanationAgent] Safety Guardrail flagged items ({reason}). Sanitized version applied.")

        return sanitized

    def _try_bedrock_explain(self, evidence: Dict[str, Any]) -> Any:
        bedrock_model_id = os.environ.get("BEDROCK_MODEL_ID_EXPLANATION")
        if not bedrock_model_id or not os.environ.get("AWS_REGION"):
            return None
        try:
            import boto3
            client = boto3.client("bedrock-runtime", region_name=os.environ.get("AWS_REGION", "us-east-1"))
            payload = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 1500,
                "system": EXPLANATION_SYSTEM_PROMPT,
                "messages": [
                    {"role": "user", "content": f"Generate explanation items for this evidence object:\n{json.dumps(evidence, indent=2)}"}
                ]
            }
            response = client.invoke_model(
                modelId=bedrock_model_id,
                body=json.dumps(payload)
            )
            body = json.loads(response["body"].read().decode("utf-8"))
            content = body["content"][0]["text"].strip()
            if content.startswith("```"):
                content = re.sub(r"^```[a-z]*\n", "", content)
                content = re.sub(r"\n```$", "", content)
            parsed = json.loads(content)
            if isinstance(parsed, list):
                return parsed
        except Exception as e:
            print(f"[ExplanationAgent] Bedrock explanation skipped: {e}")
        return None
