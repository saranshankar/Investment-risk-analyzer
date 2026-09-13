import re
from difflib import SequenceMatcher

LEGAL_SUFFIXES_PATTERN = re.compile(
    r"\b(pvt\.?\s*ltd\.?|private\s+limited|limited|ltd\.?|llp|inc\.?|corp\.?|co\.?|brokerage|broking)\b",
    re.IGNORECASE
)

def normalize_registration_number(reg_no: str | None) -> str | None:
    if not reg_no:
        return None
    # Strip spaces, hyphens, slashes, uppercase
    cleaned = re.sub(r"[\s\-\/\:\.]+", "", reg_no).upper()
    return cleaned if cleaned else None

def normalize_name(name: str | None) -> str:
    if not name:
        return ""
    # Lowercase
    cleaned = name.lower()
    # Strip legal entity suffixes
    cleaned = LEGAL_SUFFIXES_PATTERN.sub("", cleaned)
    # Strip all non-alphanumeric except whitespace
    cleaned = re.sub(r"[^\w\s]", " ", cleaned)
    # Collapse multiple whitespaces
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned

def calculate_name_similarity(name1: str, name2: str) -> float:
    """Calculates normalized string similarity score between 0.0 and 1.0"""
    n1 = normalize_name(name1)
    n2 = normalize_name(name2)
    if not n1 or not n2:
        return 0.0
    if n1 == n2:
        return 1.0
    # Also test substring containment if one is a significant portion of the other
    if n1 in n2 or n2 in n1:
        shorter = min(len(n1), len(n2))
        longer = max(len(n1), len(n2))
        if shorter >= 4 and (shorter / longer) >= 0.6:
            base_score = SequenceMatcher(None, n1, n2).ratio()
            return max(base_score, 0.85)
    return SequenceMatcher(None, n1, n2).ratio()
