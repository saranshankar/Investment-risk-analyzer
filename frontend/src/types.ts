export type SourceType = 'text' | 'screenshot';

export interface ClaimedReturn {
  text: string;
  type: 'guaranteed' | 'projected' | 'unspecified';
}

export interface PaymentRequest {
  text: string;
  method_hint?: string | null;
}

export interface ContactInfo {
  type: 'phone' | 'email' | 'handle' | 'link';
  value: string;
}

export interface ExtractedClaim {
  claim_id: string;
  source_type: SourceType;
  raw_text_hash: string;
  entity_name_claimed: string | null;
  registration_number_claimed: string | null;
  registration_type_claimed: string | null;
  claimed_returns: ClaimedReturn[];
  investment_product: string | null;
  urgency_language: string[];
  exclusivity_language: string[];
  payment_requests: PaymentRequest[];
  contact_info: ContactInfo[];
  links: string[];
  language_detected: 'en' | 'hi' | 'hinglish' | 'other';
  extraction_confidence: number;
  extraction_notes: string[];
}

export interface VerificationResult {
  registration_lookup: 'found' | 'not_found' | 'registry_unavailable' | 'not_applicable';
  status_check: 'active' | 'inactive' | 'unknown';
  name_match: 'match' | 'partial_match' | 'mismatch' | 'not_applicable';
  name_match_score: number;
  claimed_name: string | null;
  registered_name: string | null;
  registry_snapshot_date: string | null;
}

export interface RiskSignal {
  rule_id: string;
  category: 'regulatory' | 'financial' | 'psychological' | 'identity' | 'payment' | 'communication';
  severity: 'low' | 'medium' | 'high';
  triggered: boolean;
  evidence_text: string;
  score_contribution: number;
}

export type VerdictBucket = 'LOW_CONCERN' | 'NEEDS_VERIFICATION' | 'HIGH_RISK_INDICATORS';

export interface Evidence {
  extracted_claim: ExtractedClaim;
  verification_result: VerificationResult;
  risk_signals: RiskSignal[];
  deterministic_score: number;
  verdict_bucket: VerdictBucket;
}

export type TagType = 'verified_fact' | 'extracted_claim' | 'rule_signal' | 'ai_explanation';

export interface ExplanationItem {
  item: string;
  type: TagType;
  text: string;
}

export interface FinalVerdict {
  analysis_id: string;
  verdict_bucket: VerdictBucket;
  evidence: Evidence;
  explanation: ExplanationItem[];
  disclaimer: string;
  registry_snapshot_date: string;
  created_at: string;
}

export interface SampleCase {
  id: string;
  scenario: string;
  category: 'legitimate' | 'suspicious' | 'ambiguous';
  input_type: 'text' | 'screenshot';
  input_text: string;
  expected_claimed_reg?: string | null;
  expected_lookup?: string;
  expected_name_match?: string;
  expected_status?: string;
  expected_bucket: VerdictBucket;
  notes: string;
}
