import pytest
from agents.orchestrator import TipCheckOrchestrator

@pytest.fixture
def orchestrator():
    return TipCheckOrchestrator()

def test_full_pipeline_fake_reg_high_risk(orchestrator):
    text = (
        "JACKPOT NIFTY CALLS! SEBI Reg No: INA999888777 by Apex Super Wealth. "
        "Guaranteed 50% monthly profit on option trades! Limited 10 VIP slots available today only. "
        "Pay Rs 5000 via GPay to 9876543210@ybl to start immediately."
    )
    verdict = orchestrator.analyze_text(text)
    assert verdict["verdict_bucket"] == "HIGH_RISK_INDICATORS"
    assert verdict["evidence"]["verification_result"]["registration_lookup"] == "not_found"
    assert len(verdict["explanation"]) >= 3
    # Check that four-way tag types are present
    types = {item["type"] for item in verdict["explanation"]}
    assert "verified_fact" in types or "rule_signal" in types

def test_full_pipeline_legitimate_low_concern(orchestrator):
    text = (
        "Quarterly Research Note: Kotak Investment Advisors Limited (SEBI Reg No: INA000008434). "
        "Market outlook suggests moderate inflation cooling. Investments in securities market are subject to market risks. "
        "Read all scheme related documents carefully."
    )
    verdict = orchestrator.analyze_text(text)
    assert verdict["verdict_bucket"] == "LOW_CONCERN"
    assert verdict["evidence"]["verification_result"]["registration_lookup"] == "found"
    assert verdict["evidence"]["verification_result"]["status_check"] == "active"

def test_full_pipeline_reverify_action(orchestrator):
    # First analyze with a typo in registration number
    initial = orchestrator.analyze_text("Advisory by Motilal Oswal. SEBI Reg: INA000000038")
    claim = initial["evidence"]["extracted_claim"]
    
    # Correct it to valid number
    corrected = orchestrator.reverify(
        analysis_id=initial["analysis_id"],
        claim=claim,
        corrected_reg_no="INA000000037",
        corrected_entity_name="Motilal Oswal Financial Services Limited"
    )
    assert corrected["evidence"]["verification_result"]["registration_lookup"] == "found"
    assert corrected["evidence"]["verification_result"]["name_match"] == "match"
