from typing import Dict, Any, List
from backend.services.rule_engine import RuleEngine

class EvidenceAggregator:
    def __init__(self, rule_engine: RuleEngine):
        self.rule_engine = rule_engine

    def aggregate(
        self,
        extracted_claim: Dict[str, Any],
        verification_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Merges verification and rule evaluation into a validated Evidence object.
        """
        signals = self.rule_engine.evaluate(extracted_claim, verification_result)
        score, bucket = self.rule_engine.compute_score_and_bucket(signals, verification_result)

        return {
            "extracted_claim": extracted_claim,
            "verification_result": verification_result,
            "risk_signals": signals,
            "deterministic_score": score,
            "verdict_bucket": bucket
        }
