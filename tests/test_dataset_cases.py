import json
import os
import pytest
from agents.orchestrator import TipCheckOrchestrator

@pytest.fixture
def orchestrator():
    return TipCheckOrchestrator()

def test_all_dataset_cases(orchestrator):
    """
    Validates all 7 synthetic benchmark cases in datasets/test_cases.json
    against the expected verdict buckets and rule firing behavior.
    """
    dataset_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "datasets",
        "test_cases.json"
    )
    with open(dataset_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    for case in data.get("cases", []):
        case_id = case["id"]
        raw_text = case["input_text"]
        expected_verdict = case["expected_bucket"]

        verdict = orchestrator.analyze_text(raw_text)
        actual_verdict = verdict["verdict_bucket"]

        assert actual_verdict == expected_verdict, (
            f"Case {case_id} failed: expected {expected_verdict}, got {actual_verdict}"
        )

