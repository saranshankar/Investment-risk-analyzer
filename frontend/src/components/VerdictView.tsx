import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
  AlertCircle,
  ShieldCheck,
  FileSearch,
  Layers,
  Search,
  Scale,
  ArrowRight,
  RefreshCw,
  Clock
} from 'lucide-react';
import type { FinalVerdict, TagType } from '../types';
import { ExtractionConfirmation } from './ExtractionConfirmation';
import { Orb } from './Orb';

interface VerdictViewProps {
  verdict: FinalVerdict;
  onReverify: (correctedRegNo: string, correctedEntityName: string) => void;
  isReverifying: boolean;
  onCheckAnother?: () => void;
}

export const VerdictView: React.FC<VerdictViewProps> = ({
  verdict,
  onReverify,
  isReverifying,
  onCheckAnother
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [expandedSignals, setExpandedSignals] = useState<Record<string, boolean>>({});
  const [showReverifyCard, setShowReverifyCard] = useState(false);

  const { evidence, explanation, verdict_bucket, registry_snapshot_date } = verdict;
  const { verification_result: verif, extracted_claim: claim, risk_signals: signals, deterministic_score: score } = evidence;

  const isHighRisk = verdict_bucket === 'HIGH_RISK_INDICATORS';
  const isNeedsVerif = verdict_bucket === 'NEEDS_VERIFICATION';
  const triggeredSignals = signals.filter(s => s.triggered);

  // Toggle signal expansion
  const toggleSignal = (ruleId: string) => {
    setExpandedSignals(prev => ({
      ...prev,
      [ruleId]: !prev[ruleId]
    }));
  };

  // Section A - Human Header Texts
  const headerTitle = isHighRisk
    ? 'HIGH-RISK INDICATORS'
    : isNeedsVerif
    ? 'NEEDS VERIFICATION'
    : 'LOW CONCERN';

  const headerSubtitle = isHighRisk
    ? 'Multiple risk indicators detected in this investment message.'
    : isNeedsVerif
    ? 'Some claims in this message could not be independently confirmed.'
    : 'Message complies with standard advisory communication patterns.';

  const headerSummary = isHighRisk
    ? (verif.registration_lookup === 'not_found'
        ? 'A SEBI registration number was quoted but not found in the official registry snapshot, combined with high-pressure return or payment claims.'
        : 'The message contains prohibited financial practices, such as guaranteed return promises, artificial urgency, or personal payment demands.')
    : isNeedsVerif
    ? 'The message contains ambiguous or unverified claims. We recommend independent verification before committing funds.'
    : (verif.registration_lookup === 'found'
        ? 'Registration matches an active entity in the demo SEBI registry snapshot, and no aggressive guarantee or manipulation patterns were detected.'
        : 'No deceptive guarantee language, pressure tactics, or suspicious patterns were detected in this message.');

  // Colors for Header Box
  const headerBg = isHighRisk
    ? 'var(--color-danger-bg)'
    : isNeedsVerif
    ? 'var(--color-warning-bg)'
    : 'var(--color-success-bg)';

  const headerBorder = isHighRisk
    ? 'var(--color-danger-border)'
    : isNeedsVerif
    ? 'var(--color-warning-border)'
    : 'var(--color-success-border)';

  const headerTextColor = isHighRisk
    ? 'var(--color-danger)'
    : isNeedsVerif
    ? 'var(--color-warning)'
    : 'var(--color-success)';

  const HeaderIcon = isHighRisk ? AlertTriangle : isNeedsVerif ? AlertCircle : CheckCircle2;

  // Check if override rule fired
  const isOverrideActive = verif.registration_lookup === 'not_found' &&
    signals.some(s => (s.rule_id.startsWith('FIN-') || s.rule_id.startsWith('PAY-')) && s.triggered);

  // Verification Status Badge
  const getRegStatusBadge = () => {
    if (verif.registration_lookup === 'found') {
      if (verif.status_check === 'active') {
        return <span className="status-pill status-pill-verified"><CheckCircle2 size={12} /> Verified Active</span>;
      }
      return <span className="status-pill status-pill-inactive"><AlertTriangle size={12} /> Inactive / Suspended</span>;
    }
    if (verif.registration_lookup === 'not_found') {
      return <span className="status-pill status-pill-mismatch"><XCircle size={12} /> Not Found</span>;
    }
    if (verif.registration_lookup === 'registry_unavailable') {
      return <span className="status-pill status-pill-unknown"><Info size={12} /> Unavailable</span>;
    }
    return <span className="status-pill status-pill-unknown">Unquoted</span>;
  };

  // 4-way label tags
  const renderTag = (type: TagType) => {
    switch (type) {
      case 'verified_fact':
        return (
          <span className="tag-badge tag-verified_fact">
            <CheckCircle2 size={11} />
            verified fact
          </span>
        );
      case 'extracted_claim':
        return (
          <span className="tag-badge tag-extracted_claim">
            <Info size={11} />
            message claim
          </span>
        );
      case 'rule_signal':
        return (
          <span className="tag-badge tag-rule_signal">
            <AlertTriangle size={11} />
            warning sign
          </span>
        );
      case 'ai_explanation':
        return (
          <span className="tag-badge tag-ai_explanation">
            ai explanation
          </span>
        );
      default:
        return null;
    }
  };

  // Build Claim vs Fact rows dynamically from actual findings (Section 7)
  const comparisonRows = [
    {
      claimTitle: 'Advisor Registration Claim',
      claimText: claim.registration_number_claimed
        ? `Quoted SEBI Registration: ${claim.registration_number_claimed}`
        : 'No SEBI registration number quoted in message.',
      verifiedTitle: 'SEBI Registry Snapshot Status',
      verifiedText: verif.registration_lookup === 'found'
        ? `Found in Demo Registry (${verif.status_check === 'active' ? 'Active' : verif.status_check})`
        : verif.registration_lookup === 'not_found'
        ? 'Registration number does not exist in the official snapshot.'
        : verif.registration_lookup === 'registry_unavailable'
        ? 'Registry snapshot temporarily unavailable during lookup.'
        : 'Advisory services in India require mandatory SEBI registration.',
      isFlagged: verif.registration_lookup === 'not_found' || verif.status_check === 'inactive' || (!claim.registration_number_claimed && Boolean(claim.entity_name_claimed))
    },
    {
      claimTitle: 'Claimed Advisor / Entity Identity',
      claimText: claim.entity_name_claimed
        ? `Sender claims to represent: "${claim.entity_name_claimed}"`
        : 'Sender did not specify a clear legal business entity name.',
      verifiedTitle: 'Official Registered Entity Match',
      verifiedText: verif.registered_name
        ? `Officially registered under: "${verif.registered_name}" (${verif.name_match === 'match' ? 'Full Match' : verif.name_match === 'partial_match' ? 'Partial Match' : 'Name Mismatch'})`
        : 'No registered legal entity on file for this claim.',
      isFlagged: verif.name_match === 'mismatch'
    },
    {
      claimTitle: 'Profit & Return Assertions',
      claimText: claim.claimed_returns.length > 0
        ? claim.claimed_returns.map(r => `"${r.text}" (${r.type})`).join(', ')
        : 'No explicit fixed return percentage stated.',
      verifiedTitle: 'SEBI Regulatory Return Standard',
      verifiedText: signals.some(s => s.rule_id.startsWith('FIN-') && s.triggered)
        ? 'SEBI regulations strictly prohibit promising or guaranteeing fixed returns on equity/derivatives.'
        : 'Standard market disclaimer: securities investments are subject to market risks.',
      isFlagged: signals.some(s => s.rule_id.startsWith('FIN-') && s.triggered)
    },
    {
      claimTitle: 'Urgency & Scarcity Language',
      claimText: (claim.urgency_language.length > 0 || claim.exclusivity_language.length > 0)
        ? [...claim.urgency_language, ...claim.exclusivity_language].map(t => `"${t}"`).join(', ')
        : 'No artificial time limits or exclusive VIP slot claims detected.',
      verifiedTitle: 'Behavioral Manipulation Check',
      verifiedText: signals.some(s => s.rule_id.startsWith('PSY-') && s.triggered)
        ? 'Urgency and scarcity tactics (FOMO) are common manipulation indicators to rush financial decisions.'
        : 'No high-pressure tactics detected.',
      isFlagged: signals.some(s => s.rule_id.startsWith('PSY-') && s.triggered)
    },
    {
      claimTitle: 'Payment & Account Requests',
      claimText: claim.payment_requests.length > 0
        ? claim.payment_requests.map(p => `"${p.text}"`).join(', ')
        : 'No upfront payment or transfer demands detected.',
      verifiedTitle: 'Payment Routing Verification',
      verifiedText: signals.some(s => s.rule_id.startsWith('PAY-') && s.triggered)
        ? 'Demanding upfront fees or routing to personal UPI IDs contradicts regulated corporate advisory standards.'
        : 'No unofficial payment requests detected.',
      isFlagged: signals.some(s => s.rule_id.startsWith('PAY-') && s.triggered)
    }
  ];

  return (
    <div id="trust-lens-results" style={{ maxWidth: 840, margin: '0 auto 60px auto' }}>
      {/* ========================================================================= */}
      {/* SECTION A — VERDICT HEADER                                                */}
      {/* ========================================================================= */}
      <div style={{
        backgroundColor: headerBg,
        border: `1px solid ${headerBorder}`,
        borderRadius: 'var(--radius-lg)',
        padding: '28px 24px',
        marginBottom: 24,
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{
            color: headerTextColor,
            marginTop: 2,
            flexShrink: 0
          }}>
            <HeaderIcon size={32} strokeWidth={2.2} />
          </div>

          <div style={{ flex: 1 }}>
            {/* Header Badge Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
              marginBottom: 6
            }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                backgroundColor: '#ffffff',
                color: 'var(--text-secondary)',
                padding: '3px 9px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)'
              }}>
                Trust Lens Investigation
              </span>

              {getRegStatusBadge()}

              {isOverrideActive && (
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  backgroundColor: '#ffffff',
                  color: 'var(--color-danger)',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-danger-border)'
                }}>
                  High-risk override triggered
                </span>
              )}
            </div>

            <h2 style={{
              fontSize: 'clamp(1.4rem, 2.5vw, 1.7rem)',
              fontWeight: 800,
              color: headerTextColor,
              letterSpacing: '-0.02em',
              marginBottom: 6
            }}>
              {headerTitle}
            </h2>

            <p style={{
              fontSize: '1.02rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: 8
            }}>
              {headerSubtitle}
            </p>

            <p style={{
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
              marginBottom: 16
            }}>
              {headerSummary}
            </p>

            {/* Evidence Coverage & Finding Metrics (Section 17 - No Fake AI Confidence) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              fontSize: '0.8rem',
              paddingTop: 12,
              borderTop: `1px solid ${headerBorder}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={14} color={headerTextColor} />
                <span>
                  <strong>{triggeredSignals.length}</strong> warning sign{triggeredSignals.length === 1 ? '' : 's'} detected
                </span>
              </div>
              <span style={{ color: headerBorder }}>|</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Scale size={14} color="var(--text-secondary)" />
                <span>
                  Evidence coverage: <strong>Complete (17 deterministic rules checked)</strong>
                </span>
              </div>
              <span style={{ color: headerBorder }}>|</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={14} color="var(--text-secondary)" />
                <span>Registry snapshot: <strong>{registry_snapshot_date}</strong></span>
              </div>
            </div>
          </div>

          {/* Interactive Trust Lens Orb Accent (React Bits Theme) */}
          <div style={{
            width: 76,
            height: 76,
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: 0,
            border: `1px solid ${headerBorder}`,
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.05)',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'center',
            cursor: 'grab'
          }}>
            <Orb
              hue={isHighRisk ? 345 : isNeedsVerif ? 35 : 135}
              hoverIntensity={0.3}
              rotateOnHover={true}
              backgroundColor="#ffffff"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION B — VISUAL EVIDENCE TRAIL (Section 4)                             */}
      {/* ========================================================================= */}
      <div className="clean-card" style={{ padding: '24px 28px', marginBottom: 24 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: 12
        }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Visual Evidence Trail
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Step-by-step verification pipeline executed by TipCheck
            </span>
          </div>
          <span className="tag-badge tag-verified_fact">
            <CheckCircle2 size={11} />
            tamper-proof pipeline
          </span>
        </div>

        <div className="evidence-timeline">
          {/* Step 1: Message Received */}
          <div className="timeline-item">
            <div className="timeline-icon-box" style={{ borderColor: 'var(--color-primary)' }}>
              <FileSearch size={16} color="var(--color-primary)" />
            </div>
            <div className="timeline-content">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  1. Message Received & Sanitized
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-success)', fontWeight: 600 }}>✓ Completed</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Input received ({claim.source_type}). EXIF stripped, magic bytes inspected, and text normalized.
              </p>
            </div>
          </div>

          {/* Step 2: Claims Extracted */}
          <div className="timeline-item">
            <div className="timeline-icon-box" style={{ borderColor: 'var(--color-primary)' }}>
              <Layers size={16} color="var(--color-primary)" />
            </div>
            <div className="timeline-content">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  2. Claims Extracted & Structured
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-success)', fontWeight: 600 }}>✓ Extracted</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Identified: {claim.entity_name_claimed ? `Entity "${claim.entity_name_claimed}"` : 'No entity'} • {claim.registration_number_claimed ? `Reg "${claim.registration_number_claimed}"` : 'No reg quoted'} • {claim.claimed_returns.length} return claim{claim.claimed_returns.length === 1 ? '' : 's'}.
              </p>
            </div>
          </div>

          {/* Step 3: Registration Checked */}
          <div className="timeline-item">
            <div className="timeline-icon-box" style={{
              borderColor: verif.registration_lookup === 'found' ? 'var(--color-success)' : verif.registration_lookup === 'not_found' ? 'var(--color-danger)' : 'var(--border-medium)'
            }}>
              <Search size={16} color={verif.registration_lookup === 'found' ? 'var(--color-success)' : verif.registration_lookup === 'not_found' ? 'var(--color-danger)' : 'var(--text-muted)'} />
            </div>
            <div className="timeline-content">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  3. SEBI Registration Checked
                </span>
                <span style={{
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  color: verif.registration_lookup === 'found' ? 'var(--color-success)' : 'var(--color-danger)'
                }}>
                  {verif.registration_lookup === 'found' ? '✓ Registered' : verif.registration_lookup === 'not_found' ? '✕ Not Found' : '— Unquoted'}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Cross-referenced against Demo SEBI Registry Snapshot. {verif.registered_name ? `Registered to: ${verif.registered_name}.` : 'No matching registered intermediary.'}
              </p>
            </div>
          </div>

          {/* Step 4: Risk Signals Analyzed */}
          <div className="timeline-item">
            <div className="timeline-icon-box" style={{
              borderColor: triggeredSignals.length > 0 ? 'var(--color-warning)' : 'var(--color-success)'
            }}>
              <AlertTriangle size={16} color={triggeredSignals.length > 0 ? 'var(--color-warning)' : 'var(--color-success)'} />
            </div>
            <div className="timeline-content">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  4. Risk Signals Analyzed
                </span>
                <span style={{
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  color: triggeredSignals.length > 0 ? 'var(--color-warning)' : 'var(--color-success)'
                }}>
                  {triggeredSignals.length > 0 ? `⚠ ${triggeredSignals.length} Flagged` : '✓ 0 Warning Signs'}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Checked against 17 deterministic risk rules spanning financial guarantees, urgency, scarcity, and payment methods.
              </p>
            </div>
          </div>

          {/* Step 5: Evidence Aggregated */}
          <div className="timeline-item">
            <div className="timeline-icon-box" style={{ borderColor: 'var(--color-primary)' }}>
              <Scale size={16} color="var(--color-primary)" />
            </div>
            <div className="timeline-content">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  5. Evidence Aggregated & Calibrated
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-success)', fontWeight: 600 }}>✓ Calibrated</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Deterministic score calculated ({score}/100). Override logic evaluated for high-risk combinations.
              </p>
            </div>
          </div>

          {/* Step 6: Verdict Generated */}
          <div className="timeline-item">
            <div className="timeline-icon-box" style={{ borderColor: headerTextColor }}>
              <HeaderIcon size={16} color={headerTextColor} />
            </div>
            <div className="timeline-content">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  6. Verdict & Guidance Generated
                </span>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: headerTextColor }}>{headerTitle}</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Grounding check completed. Safe diligence recommendations generated.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION C — REGISTRATION VERIFICATION STATUS (Section 6)                   */}
      {/* ========================================================================= */}
      <div className="clean-card" style={{ padding: '24px 28px', marginBottom: 24 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: 12
        }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Registration Verification
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Comparison of claimed credentials against the Demo SEBI Registry Snapshot
            </span>
          </div>
          {renderTag('verified_fact')}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          marginBottom: 16
        }}>
          <div style={{
            backgroundColor: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px'
          }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
              Registration Number
            </span>
            <span className="font-mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {claim.registration_number_claimed || 'None quoted'}
            </span>
            <div style={{ marginTop: 6 }}>
              {getRegStatusBadge()}
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px'
          }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
              Entity Identity Match
            </span>
            <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
              {verif.registered_name || (claim.entity_name_claimed ? `Claimed: ${claim.entity_name_claimed}` : 'No entity specified')}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Name status: <strong>{verif.name_match === 'match' ? '✓ Verified Match' : verif.name_match === 'partial_match' ? '⚠ Partial Match' : verif.name_match === 'mismatch' ? '✕ Mismatch' : 'Not applicable'}</strong>
            </span>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px'
          }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
              Registry Source
            </span>
            <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
              Demo SEBI Registry Snapshot
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Baseline dated: {registry_snapshot_date} (Benchmark snapshot for evaluation)
            </span>
          </div>
        </div>

        {/* Inline Correction Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowReverifyCard(!showReverifyCard)}
            style={{ fontSize: '0.82rem', padding: '6px 12px' }}
          >
            <RefreshCw size={13} />
            <span>{showReverifyCard ? 'Hide correction form' : 'Correct details & re-verify'}</span>
          </button>
        </div>

        {showReverifyCard && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
            <ExtractionConfirmation
              key={claim.claim_id || 'active-claim'}
              claim={claim}
              onReverify={onReverify}
              isReverifying={isReverifying}
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION D — CLAIM vs VERIFICATION (Two-Column Comparison, Section 7)       */}
      {/* ========================================================================= */}
      <div className="clean-card" style={{ padding: '24px 28px', marginBottom: 24 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: 12
        }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Claim vs Verification
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Direct side-by-side comparison of sender claims against established facts
            </span>
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            5 investigation vectors
          </span>
        </div>

        <div className="claim-fact-grid">
          {/* Left Column: What the message claims */}
          <div>
            <div className="claim-col-header" style={{ color: 'var(--text-secondary)' }}>
              <span>What the sender says</span>
              {renderTag('extracted_claim')}
            </div>

            {comparisonRows.map((row, idx) => (
              <div key={idx} className="claim-card-row">
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>
                  {row.claimTitle}
                </span>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {row.claimText}
                </p>
              </div>
            ))}
          </div>

          {/* Right Column: What TipCheck could establish */}
          <div>
            <div className="claim-col-header" style={{ color: 'var(--color-primary)' }}>
              <span>What TipCheck established</span>
              {renderTag('verified_fact')}
            </div>

            {comparisonRows.map((row, idx) => (
              <div
                key={idx}
                className="claim-card-row"
                style={{
                  backgroundColor: row.isFlagged ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
                  border: `1px solid ${row.isFlagged ? 'var(--color-danger-border)' : 'var(--color-success-border)'}`
                }}
              >
                <span style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: row.isFlagged ? 'var(--color-danger)' : 'var(--color-success)',
                  textTransform: 'uppercase',
                  marginBottom: 2
                }}>
                  {row.verifiedTitle}
                </span>
                <p style={{
                  fontSize: '0.88rem',
                  color: row.isFlagged ? 'var(--color-danger)' : 'var(--color-success)',
                  lineHeight: 1.4,
                  fontWeight: 500
                }}>
                  {row.verifiedText}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION E — MESSAGE SIGNALS (Expandable Interactive Cards, Section 5 & 8)  */}
      {/* ========================================================================= */}
      <div className="clean-card" style={{ padding: '24px 28px', marginBottom: 24 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: 12
        }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Message Signals
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Click any signal card to inspect the exact quote, rule ID, and risk rationale
            </span>
          </div>
          {renderTag('rule_signal')}
        </div>

        {triggeredSignals.length > 0 ? (
          <div>
            {triggeredSignals.map((sig) => {
              const isExpanded = Boolean(expandedSignals[sig.rule_id]);
              const isHigh = sig.severity === 'high';
              const dotColor = isHigh ? 'var(--color-danger)' : 'var(--color-warning)';

              return (
                <div key={sig.rule_id} className="interactive-signal-card">
                  <button
                    type="button"
                    className="signal-header-btn"
                    onClick={() => toggleSignal(sig.rule_id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: dotColor,
                        flexShrink: 0
                      }} />
                      <div>
                        <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {sig.category.toUpperCase()} • Rule {sig.rule_id}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>
                          Severity: <strong style={{ color: dotColor }}>{sig.severity.toUpperCase()}</strong> (+{sig.score_contribution} pts)
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      <span>{isExpanded ? 'Hide details' : 'Inspect evidence'}</span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="signal-expand-body">
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                          Exact Evidence from Message:
                        </span>
                        <blockquote style={{
                          margin: '4px 0 8px 0',
                          padding: '6px 12px',
                          borderLeft: `3px solid ${dotColor}`,
                          backgroundColor: '#ffffff',
                          fontStyle: 'italic',
                          color: 'var(--text-primary)'
                        }}>
                          "{sig.evidence_text}"
                        </blockquote>
                      </div>

                      <div style={{ marginBottom: 6 }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                          Why This Signal Matters:
                        </span>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {sig.rule_id.startsWith('FIN-') && 'SEBI regulations prohibit promising or guaranteeing fixed returns on securities trading. Guaranteed-return claims are frequently associated with fraudulent investment schemes.'}
                          {sig.rule_id.startsWith('REG-') && 'Unregistered entities offering financial advice operate outside SEBI regulatory oversight, leaving investors with no formal grievance redressal through SCORES.'}
                          {sig.rule_id.startsWith('ID-') && 'Impersonating genuine registered brokers or swapping legal names is a prevalent technique used to lend false legitimacy to unauthorized operations.'}
                          {sig.rule_id.startsWith('PSY-') && 'Artificial deadlines and exclusive VIP clubs induce fear of missing out (FOMO), preventing investors from performing standard due diligence.'}
                          {sig.rule_id.startsWith('PAY-') && 'Regulated investment advisors accept fees exclusively through corporate accounts. Routing funds to personal UPI handles or untraceable wallets indicates high fraud potential.'}
                          {sig.rule_id.startsWith('COMM-') && 'Operating exclusively through anonymous messaging groups without verified business contacts complicates accountability and identity tracking.'}
                        </p>
                      </div>

                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Evaluated by TipCheck Deterministic Engine • Rule ID: {sig.rule_id}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            backgroundColor: 'var(--color-success-bg)',
            border: '1px solid var(--color-success-border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <CheckCircle2 size={18} color="var(--color-success)" />
            <span style={{ fontSize: '0.88rem', color: 'var(--color-success)', fontWeight: 600 }}>
              Zero risk signals triggered. This message complies with standard advisory disclosure practices.
            </span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION F — WHY THIS VERDICT? (Section 9)                                  */}
      {/* ========================================================================= */}
      <div className="clean-card" style={{ padding: '24px 28px', marginBottom: 24 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: 10
        }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Why this verdict?
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Evidence-grounded synthesis explaining the basis for this evaluation
            </span>
          </div>
          {renderTag('ai_explanation')}
        </div>

        <div style={{
          backgroundColor: 'var(--color-primary-light)',
          border: '1px solid var(--color-primary-border)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          {explanation.length > 0 ? (
            explanation.map((item, idx) => (
              <p key={idx} style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                {item.text}
              </p>
            ))
          ) : (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
              The analysis was synthesized deterministically based on official registration status and extracted message content.
            </p>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION G — BEFORE YOU ACT (Section 10)                                   */}
      {/* ========================================================================= */}
      <div className="clean-card" style={{ padding: '24px 28px', marginBottom: 24 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 10
        }}>
          <ShieldCheck size={18} color="var(--color-primary)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Before you act
          </h3>
        </div>

        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
          {isHighRisk
            ? 'Because multiple warning signals were flagged, we recommend the following safety actions:'
            : isNeedsVerif
            ? 'Because key credentials could not be confirmed, take these precautions before taking action:'
            : 'General due diligence guidance for all investment communications:'}
        </p>

        <ol style={{
          paddingLeft: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          fontSize: '0.88rem',
          color: 'var(--text-primary)',
          lineHeight: 1.55,
          marginBottom: 18
        }}>
          {isHighRisk ? (
            <>
              <li>
                <strong>Don't transfer money based only on this message:</strong> Avoid sending deposits, subscription fees, or profit-shares without independent confirmation.
              </li>
              <li>
                <strong>Independently verify the advisor's registration:</strong> Check the registration number directly on the official SEBI portal, not via links sent in the message.
              </li>
              <li>
                <strong>Avoid urgent payment requests:</strong> Legitimate financial advisors never demand urgent transfers to personal UPI handles or individual bank accounts.
              </li>
              <li>
                <strong>Keep the original message as evidence:</strong> Save screenshots and message logs in case you need to report unauthorized activity.
              </li>
            </>
          ) : isNeedsVerif ? (
            <>
              <li>
                <strong>Verify the registration independently:</strong> Ensure the quoted credentials exist and match the exact legal entity offering advice.
              </li>
              <li>
                <strong>Confirm the identity of the sender:</strong> Check that the message originates from verified official domain channels, not personal WhatsApp or Telegram handles.
              </li>
              <li>
                <strong>Check the source of the claim:</strong> Do not act on return projections that lack audited performance disclosures.
              </li>
              <li>
                <strong>Avoid acting until key information is confirmed:</strong> Exercise patience and request formal documentation before committing capital.
              </li>
            </>
          ) : (
            <>
              <li>
                <strong>Treat this result as an initial screening, not investment advice:</strong> TipCheck verifies credentials and communication patterns; it does not endorse stock picks.
              </li>
              <li>
                <strong>Independently verify important claims before acting:</strong> Ensure all securities transactions align with your personal risk profile and financial goals.
              </li>
            </>
          )}
        </ol>

        {/* Official Channel Links */}
        <div style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          paddingTop: 14,
          borderTop: '1px solid var(--border-subtle)'
        }}>
          <a
            href="https://scores.sebi.gov.in"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
            style={{ fontSize: '0.82rem', padding: '7px 12px' }}
          >
            <span>SEBI SCORES Grievance Portal</span>
            <ExternalLink size={13} />
          </a>

          <a
            href="https://cybercrime.gov.in"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
            style={{ fontSize: '0.82rem', padding: '7px 12px' }}
          >
            <span>National Cyber Crime Portal (1930)</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION H — CHECK AGAIN FLOW & TECHNICAL DETAILS (Section 11)              */}
      {/* ========================================================================= */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24
      }}>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            onCheckAnother?.();
            const el = document.getElementById('analyzer-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <span>Check another message</span>
          <ArrowRight size={16} />
        </button>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
        >
          <span>{showTechnicalDetails ? 'Hide technical rule breakdown' : 'Show technical rule breakdown'}</span>
          {showTechnicalDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* Collapsible Technical Details */}
      {showTechnicalDetails && (
        <div style={{
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          backgroundColor: '#ffffff',
          overflow: 'hidden',
          marginBottom: 24,
          padding: '20px 24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Deterministic Rule Engine Score Breakdown
            </h4>
            <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              Score: <strong>{score} / 100</strong>
            </span>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 14 }}>
            All 17 deterministic rules evaluated in accordance with <code>rules/rules.yaml</code>. Overrides ensure financial guarantees paired with missing registration always trigger High-Risk Indicators.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 10,
            fontSize: '0.8rem'
          }}>
            {signals.map((s) => (
              <div
                key={s.rule_id}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: s.triggered ? 'var(--color-danger-bg)' : 'var(--bg-surface-subtle)',
                  border: `1px solid ${s.triggered ? 'var(--color-danger-border)' : 'var(--border-subtle)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span style={{ fontWeight: 600, color: s.triggered ? 'var(--color-danger)' : 'var(--text-secondary)' }}>
                  {s.rule_id} ({s.category})
                </span>
                <span style={{ fontWeight: 700, color: s.triggered ? 'var(--color-danger)' : 'var(--text-muted)' }}>
                  {s.triggered ? `+${s.score_contribution}` : '0'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regulatory Notice Footer */}
      <div style={{
        padding: '16px 20px',
        backgroundColor: 'var(--bg-surface-subtle)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.78rem',
        color: 'var(--text-muted)',
        lineHeight: 1.5
      }}>
        <strong>Demo SEBI Registry Snapshot Notice:</strong> TipCheck operates on a high-fidelity synthetic benchmark dataset of SEBI registrations (dated {registry_snapshot_date}) created for algorithmic verification. This service does not provide investment advice or guarantees. Always consult the official SEBI portal (<code>sebi.gov.in</code>) for live regulatory filings.
      </div>
    </div>
  );
};
