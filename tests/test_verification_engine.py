import pytest
from backend.services.verification_engine import VerificationEngine

@pytest.fixture
def engine():
    return VerificationEngine()

def test_exact_registration_match(engine):
    # Test case: Motilal Oswal (INA000000037)
    res = engine.verify("INA000000037", "Motilal Oswal Financial Services Limited")
    assert res["registration_lookup"] == "found"
    assert res["status_check"] == "active"
    assert res["name_match"] == "match"
    assert res["name_match_score"] >= 0.90

def test_fuzzy_name_match(engine):
    # Missing 'Limited' or slight punctuation
    res = engine.verify("INA000008434", "Kotak Investment Advisors")
    assert res["registration_lookup"] == "found"
    assert res["status_check"] == "active"
    assert res["name_match"] in ["match", "partial_match"]
    assert res["name_match_score"] >= 0.70

def test_entity_name_mismatch(engine):
    # Impersonation: claimed name is Apex Academy, but INA000011538 is HDFC Securities
    res = engine.verify("INA000011538", "Apex Trading Academy")
    assert res["registration_lookup"] == "found"
    assert res["name_match"] == "mismatch"
    assert res["name_match_score"] < 0.65

def test_registration_not_found(engine):
    # Fake registration number
    res = engine.verify("INA999888777", "Fictional Advisors")
    assert res["registration_lookup"] == "not_found"
    assert res["status_check"] == "unknown"
    assert res["name_match"] == "not_applicable"

def test_inactive_registration(engine):
    # Inactive/Suspended SEBI record
    res = engine.verify("INA000099999", "Apex Global Wealth Consultancies LLP")
    assert res["registration_lookup"] == "found"
    assert res["status_check"] == "inactive"

def test_missing_registration_number(engine):
    # No registration number given in tip
    res = engine.verify(None, "Anonymous Tipster")
    assert res["registration_lookup"] == "not_applicable"

def test_simulated_registry_unavailable(engine):
    engine.set_simulate_unavailable(True)
    res = engine.verify("INA000000037", "Motilal Oswal")
    assert res["registration_lookup"] == "registry_unavailable"
    engine.set_simulate_unavailable(False)
