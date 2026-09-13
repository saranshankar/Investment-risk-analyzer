import re
from typing import Dict, Any, List, Tuple, Optional

DENYLIST_PATTERNS = [
    re.compile(r"\b(confirmed\s+scam|definitely\s+a\s+scam|proven\s+fraud|criminal|jail|arrest)\b", re.IGNORECASE),
    re.compile(r"\b(you\s+(?:must|should|ought\s+to)\s+(?:buy|sell|invest|short|exit))\b", re.IGNORECASE),
    re.compile(r"\b(sebi\s+has\s+declared\s+this\s+illegal|guaranteed\s+fraud)\b", re.IGNORECASE),
    re.compile(r"\b(we\s+guarantee\s+this\s+is\s+fake)\b", re.IGNORECASE)
]

class SafetyAgent:
    def __init__(self):
        self.denylist = DENYLIST_PATTERNS

    def check(self, evidence: Dict[str, Any], draft_explanation: List[Dict[str, Any]]) -> Tuple[bool, Optional[str], List[Dict[str, Any]]]:
        """
        Reviews draft explanation items for overreach, advice, or legal overstepping.
        Returns: (is_approved: bool, reason: Optional[str], sanitized_explanation: List[Dict])
        """
        sanitized = []
        violations = []

        for item in draft_explanation:
            text = item.get("text", "")
            modified_text = text

            # Check denylist patterns
            for pattern in self.denylist:
                if pattern.search(text):
                    violations.append(f"Forbidden phrase detected matching: {pattern.pattern}")
                    # Sanitize by replacing with cautious phrasing
                    modified_text = pattern.sub("[high-risk signal flagged]", modified_text)

            # Ensure non-alarmist phrasing
            if "scammer" in modified_text.lower():
                modified_text = re.sub(r"\bscammer\b", "unverified sender", modified_text, flags=re.IGNORECASE)
            if "guaranteed scam" in modified_text.lower():
                modified_text = re.sub(r"\bguaranteed scam\b", "severe risk indicator", modified_text, flags=re.IGNORECASE)

            sanitized.append({
                "item": item.get("item", "Signal"),
                "type": item.get("type", "ai_explanation"),
                "text": modified_text
            })

        is_approved = len(violations) == 0
        reason = "; ".join(violations) if violations else None
        return is_approved, reason, sanitized
