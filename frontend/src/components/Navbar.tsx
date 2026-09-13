import React from 'react';
import { Shield, BookOpen, Clock, Search } from 'lucide-react';

interface NavbarProps {
  snapshotDate: string;
  onOpenRegistrySearch: () => void;
  onOpenMethodology: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  onNavigateToInput?: () => void;
  onNavigateToExamples?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  snapshotDate,
  onOpenRegistrySearch,
  onOpenMethodology,
  onOpenHistory,
  historyCount,
  onNavigateToInput,
  onNavigateToExamples
}) => {
  return (
    <header style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)'
    }}>
      <div style={{
        maxWidth: 1040,
        margin: '0 auto',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        {/* Brand Logo */}
        <div
          onClick={onNavigateToInput}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-primary-light)',
            border: '1px solid var(--color-primary-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)'
          }}>
            <Shield size={18} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontSize: '1.2rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em'
              }}>
                TipCheck
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1 }}>
              Check before you trust
            </p>
          </div>
        </div>

        {/* Navigation Actions */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {onNavigateToInput && (
            <button
              onClick={onNavigateToInput}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            >
              Check a tip
            </button>
          )}

          <div style={{
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 8px',
            backgroundColor: 'var(--bg-surface-subtle)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }}>
            <span>Demo Registry:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {snapshotDate || '01 Aug 2026'}
            </span>
          </div>

          {onNavigateToExamples && (
            <button
              onClick={onNavigateToExamples}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            >
              Examples
            </button>
          )}

          <button
            onClick={onOpenRegistrySearch}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            title="Search SEBI Official Registry"
          >
            <Search size={14} />
            <span>Registry Search</span>
          </button>

          <button
            onClick={onOpenMethodology}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            title="How TipCheck works"
          >
            <BookOpen size={14} />
            <span>How it works</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.82rem', position: 'relative' }}
            title="View checks from this session"
          >
            <Clock size={14} />
            <span>History</span>
            {historyCount > 0 && (
              <span style={{
                backgroundColor: 'var(--color-primary)',
                color: '#ffffff',
                fontSize: '0.65rem',
                fontWeight: 700,
                borderRadius: '9999px',
                padding: '1px 6px',
                marginLeft: 2
              }}>
                {historyCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};
