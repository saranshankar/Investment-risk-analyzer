import pytest
from backend.services.rule_engine import RuleEngine

@pytest.fixture
def rule_engine():
    return RuleEngine()

def test_reg01_not_found_firing(rule_engine):
    claim = {"registration_number_claimed": "INA999888777"}
    verif = {"registration_lookup": "not_found", "status_check": "unknown", "name_match": "not_applicable"}
    signals = rule_engine.evaluate(claim, verif)
    assert any(s["rule_id"] == "REG-01" and s["score_contribution"] == 30 for s in signals)

def test_override_rule_reg01_and_fin01(rule_engine):
    claim = {
        "registration_number_claimed": "INA999888777",
        "claimed_returns": [{"text": "Guaranteed 40% monthly return", "type": "guaranteed"}]
    }
    verif = {"registration_lookup": "not_found", "status_check": "unknown", "name_match": "not_applicable"}
    signals = rule_engine.evaluate(claim, verif)
    score, bucket = rule_engine.compute_score_and_bucket(signals, verif)
    # Must force HIGH_RISK_INDICATORS per PRD override rule
    assert bucket == "HIGH_RISK_INDICATORS"

def test_legitimate_clean_message_low_concern(rule_engine):
    claim = {
        "registration_number_claimed": "INA000000037",
        "entity_name_claimed": "Motilal Oswal Financial Services Limited",
        "claimed_returns": [],
        "urgency_language": [],
        "exclusivity_language": [],
        "payment_requests": [],
        "contact_info": [{"type": "email", "value": "research@motilaloswal.com"}],
        "links": []
    }
    verif = {
        "registration_lookup": "found",
        "status_check": "active",
        "name_match": "match",
        "name_match_score": 1.0,
        "claimed_name": "Motilal Oswal Financial Services Limited",
        "registered_name": "Motilal Oswal Financial Services Limited"
    }
    signals = rule_engine.evaluate(claim, verif)
    score, bucket = rule_engine.compute_score_and_bucket(signals, verif)
    assert score < 20
    assert bucket == "LOW_CONCERN"

def test_psychological_and_payment_rules(rule_engine):
    claim = {
        "registration_number_claimed": None,
        "urgency_language": ["today only"],
        "exclusivity_language": ["limited VIP slots"],
        "payment_requests": [{"text": "Pay fee to trader@okaxis", "method_hint": "UPI"}],
        "contact_info": [],
        "links": ["https://t.me/super_calls"]
    }
    verif = {"registration_lookup": "not_applicable", "status_check": "unknown", "name_match": "not_applicable"}
    signals = rule_engine.evaluate(claim, verif)
    rule_ids = [s["rule_id"] for s in signals]
    assert "PSY-01" in rule_ids
    assert "PSY-02" in rule_ids
    assert "PAY-01" in rule_ids
    assert "PAY-02" in rule_ids
    assert "COMM-02" in rule_ids
