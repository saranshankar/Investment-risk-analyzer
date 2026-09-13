import React, { useState } from 'react';
import { Edit2, Check, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import type { ExtractedClaim } from '../types';

interface ExtractionConfirmationProps {
  claim: ExtractedClaim;
  onReverify: (correctedRegNo: string, correctedEntityName: string) => void;
  isReverifying: boolean;
}

export const ExtractionConfirmation: React.FC<ExtractionConfirmationProps> = ({
  claim,
  onReverify,
  isReverifying
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [regNo, setRegNo] = useState(claim.registration_number_claimed || '');
  const [entityName, setEntityName] = useState(claim.entity_name_claimed || '');

  const handleSave = () => {
    onReverify(regNo.trim(), entityName.trim());
  };

  return (
    <div style={{
      borderTop: '1px solid var(--border-subtle)',
      paddingTop: 16,
      marginTop: 20
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.82rem',
        color: 'var(--text-muted)'
      }}>
        <span>Did we misread something from an image or screenshot?</span>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-primary)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: '0.82rem'
          }}
        >
          <Edit2 size={13} />
          <span>{isOpen ? 'Close editor' : 'Edit extracted details'}</span>
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {isOpen && (
        <div style={{
          backgroundColor: 'var(--bg-surface-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          marginTop: 12,
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
            marginBottom: 12
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                Claimed SEBI Registration No:
              </label>
              <input
                type="text"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value.toUpperCase())}
                placeholder="e.g. INA000000037"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                Claimed Entity / Advisor Name:
              </label>
              <input
                type="text"
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                placeholder="e.g. Motilal Oswal Financial Services"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.85rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              type="button"
              onClick={handleSave}
              className="btn-primary"
              disabled={isReverifying}
              style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            >
              {isReverifying ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
              <span>Re-check with edited details</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
