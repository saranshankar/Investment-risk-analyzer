import React, { useState, useRef } from 'react';
import {
  MessageSquare,
  Upload,
  ArrowRight,
  X,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import type { SampleCase } from '../types';

interface AnalyzerProps {
  inputText: string;
  setInputText: (val: string) => void;
  onAnalyzeText: (text: string) => void;
  onAnalyzeImage: (file: File) => void;
  isProcessing: boolean;
  sampleCases?: SampleCase[];
  onSelectSample?: (sample: SampleCase) => void;
  onClear?: () => void;
}

export const Analyzer: React.FC<AnalyzerProps> = ({
  inputText,
  setInputText,
  onAnalyzeText,
  onAnalyzeImage,
  isProcessing,
  sampleCases = [],
  onSelectSample,
  onClear
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'screenshot'>('text');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAllSamples, setShowAllSamples] = useState(false);
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick Topic Prompts (Section 13)
  const topicExamples = [
    {
      label: 'Guaranteed returns',
      text: 'JACKPOT NIFTY CALLS! SEBI Reg No: INA999888777 by Apex Super Wealth. Guaranteed 50% monthly profit on option trades! Limited 10 VIP slots available today only. Pay Rs 5000 via GPay to 9876543210@ybl to start immediately.'
    },
    {
      label: 'Unknown advisor',
      text: 'Multibagger stock advisory from Sharma Capital Market Consultancies. Join our exclusive options group to double your investment capital in 30 days.'
    },
    {
      label: 'Payment request',
      text: 'Special intraday jackpot calls! Send ₹25,000 to activate your VIP membership account immediately. Contact 9876543210 on WhatsApp.'
    },
    {
      label: 'Check registration',
      text: 'Quarterly Research Note: Kotak Investment Advisors Limited (SEBI Reg No: INA000008434). Market outlook suggests moderate inflation cooling. Investments in securities market are subject to market risks.'
    }
  ];

  // Quick Pre-analysis Detection (Section 14 - lightweight preview)
  const hasRegMatch = /IN[A-Z0-9]{8,10}/i.test(inputText);
  const hasReturnClaim = /(guarantee|assured|profit|100%|return|double|target)/i.test(inputText);
  const hasPaymentDemand = /(pay|fees|gpay|phonepe|upi|₹|rs|send|deposit)/i.test(inputText);
  const hasEntityMention = /(advis|capital|wealth|academy|services|ltd|llp|traders|team|group)/i.test(inputText);

  const handleFileChange = (file: File) => {
    setErrorMessage(null);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMessage('Please upload a standard screenshot (PNG, JPEG, or WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 5MB limit.');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handlePaste = () => {
    setPasteNotice('Message added — ready to check');
    setTimeout(() => {
      setPasteNotice(null);
    }, 4000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return; // Prevent double-submit race conditions
    setErrorMessage(null);
    if (activeTab === 'text') {
      if (!inputText.trim()) {
        setErrorMessage('Please enter or paste the message you want to check.');
        return;
      }
      onAnalyzeText(inputText.trim());
    } else {
      if (!selectedFile) {
        setErrorMessage('Please select or drop in a screenshot to investigate.');
        return;
      }
      onAnalyzeImage(selectedFile);
    }
  };

  const handleClear = () => {
    setInputText('');
    setSelectedFile(null);
    setImagePreview(null);
    setErrorMessage(null);
    setPasteNotice(null);
    onClear?.();
  };

  // Full metadata for all 7 synthetic benchmark cases
  const sampleMeta: Record<string, { label: string; desc: string; tag: string }> = {
    'CASE-A-FAKE-REG': { label: 'High-risk example (A)', desc: 'Guaranteed return promise + fake registration number', tag: 'High risk' },
    'CASE-B-VALID-REG-SUSPICIOUS-CLAIMS': { label: 'Needs verification (B)', desc: 'Valid registration but aggressive return language', tag: 'Caution' },
    'CASE-C-VALID-REG-LEGITIMATE': { label: 'Low-concern example (C)', desc: 'Legitimate advisory update with proper risk disclaimers', tag: 'Normal' },
    'CASE-D-INACTIVE-REG': { label: 'Suspended registration (D)', desc: 'Registration found in SEBI records but status is suspended/inactive', tag: 'Caution' },
    'CASE-E-NAME-MISMATCH': { label: 'Name mismatch / Impersonation (E)', desc: 'Registration belongs to a registered broker but message claims another entity', tag: 'High risk' },
    'CASE-F-HINGLISH-PRESSURE': { label: 'Hinglish pressure tip (F)', desc: 'High-pressure Hindi/Hinglish tip with personal UPI payment', tag: 'High risk' },
    'CASE-G-PROMPT-INJECTION': { label: 'Adversarial prompt injection (G)', desc: 'Security test with prompt injection payload embedded in investment tip', tag: 'High risk' }
  };

  const allDisplaySamples = sampleCases.map((c) => {
    const meta = sampleMeta[c.id] || {
      label: c.id,
      desc: c.scenario,
      tag: c.expected_bucket === 'HIGH_RISK_INDICATORS' ? 'High risk' : c.expected_bucket === 'NEEDS_VERIFICATION' ? 'Caution' : 'Normal'
    };
    return { ...meta, data: c };
  });

  const displaySamples = showAllSamples ? allDisplaySamples : allDisplaySamples.slice(0, 3);

  return (
    <div id="analyzer-section" style={{
      maxWidth: 820,
      margin: '0 auto 48px auto'
    }}>
      {/* Quick Example Topics (Section 13) */}
      <div style={{ marginBottom: 14 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Quick investigation examples:
          </span>
          {pasteNotice && (
            <span style={{
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              <CheckCircle2 size={13} />
              {pasteNotice}
            </span>
          )}
        </div>

        <div className="topic-pills-row">
          {topicExamples.map((item, idx) => (
            <button
              key={idx}
              type="button"
              className="topic-pill-btn"
              onClick={() => {
                setInputText(item.text);
                setErrorMessage(null);
                setActiveTab('text');
              }}
            >
              + {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Investigation Input Container */}
      <div className="clean-card" style={{ overflow: 'hidden', marginBottom: 24 }}>
        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: '#ffffff'
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('text'); setErrorMessage(null); }}
            style={{
              flex: 1,
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: activeTab === 'text' ? '#ffffff' : 'var(--bg-surface-subtle)',
              color: activeTab === 'text' ? 'var(--color-primary)' : 'var(--text-secondary)',
              border: 'none',
              borderBottom: activeTab === 'text' ? '2px solid var(--color-primary)' : '2px solid transparent',
              fontWeight: 600,
              fontSize: '0.92rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <MessageSquare size={17} />
            <span>Paste message</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('screenshot'); setErrorMessage(null); }}
            style={{
              flex: 1,
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: activeTab === 'screenshot' ? '#ffffff' : 'var(--bg-surface-subtle)',
              color: activeTab === 'screenshot' ? 'var(--color-primary)' : 'var(--text-secondary)',
              border: 'none',
              borderBottom: activeTab === 'screenshot' ? '2px solid var(--color-primary)' : '2px solid transparent',
              fontWeight: 600,
              fontSize: '0.92rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Upload size={17} />
            <span>Upload screenshot</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {errorMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              backgroundColor: 'var(--color-danger-bg)',
              border: '1px solid var(--color-danger-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-danger)',
              fontSize: '0.85rem',
              marginBottom: 16
            }}>
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'text' ? (
            <div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onPaste={handlePaste}
                placeholder="Paste the investment message you received on WhatsApp, Telegram, or SMS (e.g. 'Guaranteed 40% returns by Apex Advisory SEBI Reg INA999888777')..."
                rows={5}
                maxLength={10000}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                  fontFamily: 'var(--font-sans)',
                  resize: 'vertical',
                  outline: 'none',
                  lineHeight: 1.6,
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-primary)';
                  e.target.style.boxShadow = '0 0 0 3px var(--color-primary-light)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-medium)';
                  e.target.style.boxShadow = 'none';
                }}
              />

              {/* Character Counter & Privacy Note (Section 13) */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 8,
                fontSize: '0.78rem',
                color: 'var(--text-muted)'
              }}>
                <span>No message storage after analysis • Private & local-first</span>
                <span className="font-mono">{inputText.length} / 10,000</span>
              </div>

              {/* Message Pre-Analysis Preview (Section 14) */}
              {inputText.trim().length > 15 && (
                <div className="preview-box">
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--color-primary)',
                    marginBottom: 8
                  }}>
                    <FileCheck size={14} />
                    <span>Ready to check — initial message indicators</span>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ color: hasEntityMention ? 'var(--color-primary)' : 'var(--text-muted)', fontWeight: 700 }}>•</span>
                      <span>Advisor claim: <strong>{hasEntityMention ? 'Detected' : 'Not detected'}</strong></span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ color: hasRegMatch ? 'var(--color-primary)' : 'var(--color-warning)', fontWeight: 700 }}>•</span>
                      <span>SEBI Reg format: <strong>{hasRegMatch ? 'Detected' : 'None quoted'}</strong></span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ color: hasReturnClaim ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 700 }}>•</span>
                      <span>Return promises: <strong>{hasReturnClaim ? 'Flagged keywords' : 'None detected'}</strong></span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ color: hasPaymentDemand ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 700 }}>•</span>
                      <span>Payment demand: <strong>{hasPaymentDemand ? 'Detected' : 'None detected'}</strong></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Upgraded Screenshot Upload (Section 15) */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                accept="image/png, image/jpeg, image/webp"
                style={{ display: 'none' }}
              />

              {!imagePreview ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragOver ? 'var(--color-primary)' : 'var(--border-medium)'}`,
                    backgroundColor: dragOver ? 'var(--color-primary-light)' : 'var(--bg-surface-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '36px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px auto',
                    color: 'var(--color-primary)'
                  }}>
                    <Upload size={22} />
                  </div>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                    Drop a WhatsApp, Telegram or SMS screenshot here
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Supports PNG, JPEG, or WebP up to 5MB. Photo EXIF and location metadata are stripped automatically.
                  </p>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  backgroundColor: 'var(--bg-surface-subtle)',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <img
                    src={imagePreview}
                    alt="Uploaded screenshot preview"
                    style={{
                      width: 72,
                      height: 72,
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedFile?.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {((selectedFile?.size || 0) / 1024).toFixed(1)} KB • Ready for OCR extraction
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedFile(null); setImagePreview(null); }}
                    className="btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                  >
                    <X size={14} />
                    <span>Remove</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Action Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div>
              {(inputText || selectedFile) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="btn-secondary"
                  disabled={isProcessing}
                >
                  Clear
                </button>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isProcessing || (activeTab === 'text' ? !inputText.trim() : !selectedFile)}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Investigating with Trust Lens...</span>
                </>
              ) : (
                <>
                  <span>Check this message</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Benchmark Sample Cases (Section 6 & 9) */}
      <div id="examples-section">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12
        }}>
          <div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Benchmark test scenarios
            </h4>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Pre-calibrated test cases across SEBI regulatory & manipulation scenarios
            </span>
          </div>

          {allDisplaySamples.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAllSamples(!showAllSamples)}
              className="btn-secondary"
              style={{ fontSize: '0.78rem', padding: '4px 10px' }}
            >
              {showAllSamples ? 'Show 3 featured' : `Show all ${allDisplaySamples.length} benchmark cases`}
            </button>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 12
        }}>
          {displaySamples.map((sample) => (
            <div
              key={sample.data.id}
              onClick={() => onSelectSample?.(sample.data)}
              className="clean-card clean-card-hover"
              style={{
                padding: '14px 16px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 8
              }}
            >
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 6
                }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                    color: sample.tag === 'High risk' ? 'var(--color-danger)' : sample.tag === 'Caution' ? 'var(--color-warning)' : 'var(--color-success)'
                  }}>
                    {sample.tag}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {sample.data.id.split('-')[1] || ''}
                  </span>
                </div>

                <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {sample.label}
                </div>

                <p style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {sample.desc}
                </p>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--color-primary)'
              }}>
                <span>Test this case</span>
                <ArrowRight size={12} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
