import React, { useState } from 'react';
import { X, Search, AlertCircle, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface RegistryRecord {
  registration_number: string;
  registered_entity_name: string;
  registration_type: string;
  status: string;
  city?: string;
  state?: string;
  snapshot_date: string;
}

interface RegistrySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshotDate: string;
}

export const RegistrySearchModal: React.FC<RegistrySearchModalProps> = ({
  isOpen,
  onClose,
  snapshotDate
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RegistryRecord[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch(`${API_BASE_URL}/registry/search?query=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setIsSearching(false);
    }
  };

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
        maxWidth: 720,
        maxHeight: '85vh',
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
              Demo SEBI Registry Snapshot Directory
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Synthetic benchmark snapshot date: {snapshotDate || '01 Aug 2026'} (Demo mode)
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '6px', borderRadius: '50%' }}
            aria-label="Close search modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Input Bar */}
        <div style={{ padding: '20px 24px 12px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by registration number (e.g. INA000000037) or firm name..."
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 36px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  fontFamily: 'var(--font-sans)'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-medium)'}
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSearching || !query.trim()}
              style={{ padding: '10px 18px', fontSize: '0.88rem' }}
            >
              {isSearching ? <RefreshCw size={15} className="animate-spin" /> : 'Search'}
            </button>
          </form>
        </div>

        {/* Results List */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {results.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Found {results.length} record{results.length > 1 ? 's' : ''} matching "{query}":
              </div>

              {results.map((rec: RegistryRecord) => {
                const isActive = rec.status.toLowerCase() === 'active';
                return (
                  <div
                    key={rec.registration_number}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-surface-subtle)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 12
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-primary)' }}>
                          {rec.registration_number}
                        </span>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: isActive ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                          color: isActive ? 'var(--color-success)' : 'var(--color-danger)',
                          border: `1px solid ${isActive ? 'var(--color-success-border)' : 'var(--color-danger-border)'}`
                        }}>
                          {rec.status.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                        {rec.registered_entity_name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {rec.registration_type} {rec.city && rec.state ? `• ${rec.city}, ${rec.state}` : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : hasSearched ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <AlertCircle size={32} style={{ margin: '0 auto 8px auto', color: 'var(--text-muted)' }} />
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                No records found
              </div>
              <p style={{ fontSize: '0.84rem' }}>
                No advisor matching "{query}" exists in our SEBI snapshot. If someone claiming this number asked for money, proceed with extreme caution.
              </p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <Search size={32} style={{ margin: '0 auto 8px auto', color: 'var(--text-muted)' }} />
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                Search official advisor registrations
              </div>
              <p style={{ fontSize: '0.84rem' }}>
                Type an entity name like "Motilal Oswal", "Kotak", or a registration number starting with INA.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
