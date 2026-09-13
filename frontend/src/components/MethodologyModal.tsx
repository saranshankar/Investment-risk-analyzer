import { X, ArrowDown } from 'lucide-react';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: 16
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: 640,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              How TipCheck Works
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Evidence-first verification without AI hallucinations
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '6px', borderRadius: '50%' }}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Simple 4-step Visual Flow */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            {/* Step 1 */}
            <div style={{
              display: 'flex',
              gap: 14,
              padding: '14px',
              backgroundColor: 'var(--bg-surface-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
                flexShrink: 0
              }}>
                1
              </div>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                  Read
                </h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  We identify the important claims in the message: claimed registration numbers, advisor names, promised returns, urgency phrases, and payment handles.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ArrowDown size={16} color="var(--text-muted)" />
            </div>

            {/* Step 2 */}
            <div style={{
              display: 'flex',
              gap: 14,
              padding: '14px',
              backgroundColor: 'var(--bg-surface-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
                flexShrink: 0
              }}>
                2
              </div>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                  Verify
                </h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  We deterministically cross-check claimed numbers and legal entity names against an authoritative snapshot of SEBI-registered advisors. No AI model guesses whether a registration is valid.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ArrowDown size={16} color="var(--text-muted)" />
            </div>

            {/* Step 3 */}
            <div style={{
              display: 'flex',
              gap: 14,
              padding: '14px',
              backgroundColor: 'var(--bg-surface-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
                flexShrink: 0
              }}>
                3
              </div>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                  Check warning signs
                </h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  A fixed set of 16 deterministic risk rules evaluates manipulative language patterns, such as guaranteed return promises, artificial deadlines, and personal payment requests.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ArrowDown size={16} color="var(--text-muted)" />
            </div>

            {/* Step 4 */}
            <div style={{
              display: 'flex',
              gap: 14,
              padding: '14px',
              backgroundColor: 'var(--bg-surface-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
                flexShrink: 0
              }}>
                4
              </div>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                  Explain
                </h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  We present the computed evidence in plain, calm language, clearly labeling what was verified in registry records and what was claimed in the message.
                </p>
              </div>
            </div>
          </div>

          {/* Key Principle Note */}
          <div style={{
            backgroundColor: 'var(--color-primary-light)',
            border: '1px solid var(--color-primary-border)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            fontSize: '0.84rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5
          }}>
            <strong style={{ color: 'var(--color-primary)' }}>Why this matters: </strong>
            TipCheck does not ask an AI chatbot "is this a scam?" Generic AI bots hallucinate without evidence. TipCheck checks factual registry data and fixed manipulation rules so you get verifiable answers.
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button onClick={onClose} className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
