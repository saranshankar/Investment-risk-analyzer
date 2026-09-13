import { X, Clock, ArrowRight } from 'lucide-react';
import type { FinalVerdict } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: FinalVerdict[];
  onSelectVerdict: (verdict: FinalVerdict) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectVerdict
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.45)',
      zIndex: 50,
      display: 'flex',
      justifyContent: 'flex-end'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        height: '100%',
        backgroundColor: '#ffffff',
        borderLeft: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Drawer Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Session History
            </h3>
          </div>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '6px', borderRadius: '50%' }}
            aria-label="Close history drawer"
          >
            <X size={16} />
          </button>
        </div>

        {/* List of Previous Checks */}
        <div style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {history.length > 0 ? (
            history.map((item) => {
              const isHigh = item.verdict_bucket === 'HIGH_RISK_INDICATORS';
              const isMed = item.verdict_bucket === 'NEEDS_VERIFICATION';
              const statusColor = isHigh ? 'var(--color-danger)' : isMed ? 'var(--color-warning)' : 'var(--color-success)';
              const statusBg = isHigh ? 'var(--color-danger-bg)' : isMed ? 'var(--color-warning-bg)' : 'var(--color-success-bg)';
              const statusBorder = isHigh ? 'var(--color-danger-border)' : isMed ? 'var(--color-warning-border)' : 'var(--color-success-border)';

              return (
                <div
                  key={item.analysis_id}
                  onClick={() => { onSelectVerdict(item); onClose(); }}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-medium)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: statusBg,
                      color: statusColor,
                      border: `1px solid ${statusBorder}`
                    }}>
                      {item.verdict_bucket.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {item.evidence.extracted_claim.entity_name_claimed || item.evidence.extracted_claim.registration_number_claimed || 'Unidentified message'}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span>Reg: {item.evidence.extracted_claim.registration_number_claimed || 'None'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-primary)', fontWeight: 600 }}>
                      <span>View</span>
                      <ArrowRight size={12} />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--text-muted)'
            }}>
              <Clock size={36} style={{ margin: '0 auto 12px auto', color: 'var(--text-muted)' }} />
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                Nothing checked yet
              </h4>
              <p style={{ fontSize: '0.84rem', lineHeight: 1.5 }}>
                Paste an investment message or upload a screenshot to get started. Your checks in this session will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
