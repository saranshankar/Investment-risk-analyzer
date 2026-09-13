from typing import Optional, Dict, Any, List
from backend.services.verification_engine import VerificationEngine

class RegistryTool:
    def __init__(self, verification_engine: VerificationEngine):
        self.verification_engine = verification_engine

    def lookup(
        self,
        registration_number: Optional[str],
        entity_name: Optional[str] = None
    ) -> Dict[str, Any]:
        return self.verification_engine.verify(registration_number, entity_name)

    def search(self, query: str) -> List[Dict[str, Any]]:
        return self.verification_engine.search_registry(query)

    def get_snapshot_date(self) -> str:
        return self.verification_engine.snapshot_date
