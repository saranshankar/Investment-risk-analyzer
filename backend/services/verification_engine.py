import json
import os
from pathlib import Path
from typing import Optional, Dict, Any, List
from registry.normalize import normalize_name, normalize_registration_number, calculate_name_similarity

class VerificationEngine:
    def __init__(self, data_file_path: Optional[str] = None):
        if not data_file_path:
            # Look relative to project root
            base_dir = Path(__file__).resolve().parent.parent.parent
            data_file_path = str(base_dir / "registry" / "data" / "sebi_advisers.json")
        self.data_file_path = data_file_path
        self.snapshot_date = "2026-08-01"
        self.records_by_reg: Dict[str, Dict[str, Any]] = {}
        self.all_records: List[Dict[str, Any]] = []
        self._simulate_unavailable = False
        self.load_dataset()

    def set_simulate_unavailable(self, unavailable: bool):
        self._simulate_unavailable = unavailable

    def load_dataset(self):
        try:
            if os.path.exists(self.data_file_path):
                with open(self.data_file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.snapshot_date = data.get("snapshot_date", "2026-08-01")
                    self.all_records = data.get("records", [])
                    for rec in self.all_records:
                        norm_reg = normalize_registration_number(rec["registration_number"])
                        if norm_reg:
                            self.records_by_reg[norm_reg] = rec
        except Exception as e:
            print(f"[VerificationEngine] Error loading registry snapshot: {e}")

    def verify(
        self,
        registration_number_claimed: Optional[str],
        entity_name_claimed: Optional[str]
    ) -> Dict[str, Any]:
        """
        Implements PRD Section 17 algorithm:
        Returns VerificationResult dict.
        """
        if self._simulate_unavailable:
            return {
                "registration_lookup": "registry_unavailable",
                "status_check": "unknown",
                "name_match": "not_applicable",
                "name_match_score": 0.0,
                "claimed_name": entity_name_claimed,
                "registered_name": None,
                "registry_snapshot_date": None
            }

        if not registration_number_claimed:
            return {
                "registration_lookup": "not_applicable",
                "status_check": "unknown",
                "name_match": "not_applicable",
                "name_match_score": 0.0,
                "claimed_name": entity_name_claimed,
                "registered_name": None,
                "registry_snapshot_date": self.snapshot_date
            }

        norm_claimed_reg = normalize_registration_number(registration_number_claimed)
        record = self.records_by_reg.get(norm_claimed_reg) if norm_claimed_reg else None

        if not record:
            return {
                "registration_lookup": "not_found",
                "status_check": "unknown",
                "name_match": "not_applicable",
                "name_match_score": 0.0,
                "claimed_name": entity_name_claimed,
                "registered_name": None,
                "registry_snapshot_date": self.snapshot_date
            }

        status = record.get("status", "active")
        registered_name = record.get("registered_entity_name", "")

        if not entity_name_claimed:
            return {
                "registration_lookup": "found",
                "status_check": status,
                "name_match": "not_applicable",
                "name_match_score": 0.0,
                "claimed_name": None,
                "registered_name": registered_name,
                "registry_snapshot_date": self.snapshot_date
            }

        norm_claimed = normalize_name(entity_name_claimed)
        norm_registered = normalize_name(registered_name)

        if norm_claimed and norm_claimed == norm_registered:
            name_match = "match"
            score = 1.0
        else:
            score = calculate_name_similarity(norm_claimed, norm_registered)
            if score >= 0.88:
                name_match = "match"
            elif score >= 0.65:
                name_match = "partial_match"
            else:
                name_match = "mismatch"

        return {
            "registration_lookup": "found",
            "status_check": status,
            "name_match": name_match,
            "name_match_score": round(score, 2),
            "claimed_name": entity_name_claimed,
            "registered_name": registered_name,
            "registry_snapshot_date": self.snapshot_date
        }

    def search_registry(self, query: str) -> List[Dict[str, Any]]:
        """Search records by reg number or name"""
        q = query.strip().lower()
        results = []
        for r in self.all_records:
            if q in r["registration_number"].lower() or q in r["registered_entity_name"].lower():
                results.append(r)
        return results
