import React from 'react';
import {
  ShieldCheck,
  CheckCircle,
  MessageSquare,
  FileSearch,
  AlertTriangle,
  FileText,
  ArrowRight,
  Database
} from 'lucide-react';
import { Orb } from './Orb';
import type { FinalVerdict } from '../types';

interface HeroProps {
  currentVerdict?: FinalVerdict | null;
}

export const Hero: React.FC<HeroProps> = ({ currentVerdict }) => {
  // Dynamic Orb coloration matching React Bits aesthetic & Trust Lens state
  let orbHue = 180;
  let orbGlow = 'radial-gradient(circle, rgba(15, 118, 110, 0.35) 0%, rgba(20, 184, 166, 0.18) 50%, transparent 70%)';
  let orbLabel = 'Trust Lens Active';
  let orbLabelColor = 'var(--color-primary)';

  if (currentVerdict) {
    if (currentVerdict.verdict_bucket === 'HIGH_RISK_INDICATORS') {
      orbHue = 345;
      orbGlow = 'radial-gradient(circle, rgba(185, 28, 28, 0.38) 0%, rgba(239, 68, 68, 0.18) 50%, transparent 70%)';
      orbLabel = 'High Risk Detected';
      orbLabelColor = 'var(--color-danger)';
    } else if (currentVerdict.verdict_bucket === 'NEEDS_VERIFICATION') {
      orbHue = 35;
      orbGlow = 'radial-gradient(circle, rgba(180, 83, 9, 0.38) 0%, rgba(245, 158, 11, 0.18) 50%, transparent 70%)';
      orbLabel = 'Needs Verification';
      orbLabelColor = 'var(--color-warning)';
    } else if (currentVerdict.verdict_bucket === 'LOW_CONCERN') {
      orbHue = 135;
      orbGlow = 'radial-gradient(circle, rgba(21, 128, 61, 0.38) 0%, rgba(34, 197, 94, 0.18) 50%, transparent 70%)';
      orbLabel = 'Low Concern Verified';
      orbLabelColor = 'var(--color-success)';
    }
  }

  return (
    <section style={{
      textAlign: 'center',
      padding: '36px 16px 20px 16px',
      maxWidth: 820,
      margin: '0 auto',
      position: 'relative'
    }}>
      {/* Interactive Trust Lens Orb (React Bits Theme) */}
      <div style={{
        position: 'relative',
        width: 150,
        height: 150,
        margin: '0 auto 18px auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Ambient Halo */}
        <div style={{
          position: 'absolute',
          inset: -16,
          borderRadius: '50%',
          background: orbGlow,
          filter: 'blur(20px)',
          opacity: 0.6,
          pointerEvents: 'none',
          transition: 'all 0.6s ease'
        }} />

        {/* Orb Lens Housing */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.08)',
          backgroundColor: '#ffffff',
          cursor: 'grab'
        }}>
          <Orb
            hue={orbHue}
            hoverIntensity={0.35}
            rotateOnHover={true}
            backgroundColor="#ffffff"
          />
        </div>

        {/* Status Pill on Orb */}
        <div style={{
          position: 'absolute',
          bottom: -10,
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
          borderRadius: '9999px',
          padding: '2px 10px',
          fontSize: '0.68rem',
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: orbLabelColor,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          zIndex: 2,
          transition: 'all 0.3s ease'
        }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: orbLabelColor,
            flexShrink: 0
          }} />
          <span>{orbLabel}</span>
        </div>
      </div>

      {/* Credibility & Regulatory Badge */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '5px 14px',
        borderRadius: '9999px',
        backgroundColor: 'var(--color-primary-light)',
        border: '1px solid var(--color-primary-border)',
        color: 'var(--color-primary)',
        fontSize: '0.8rem',
        fontWeight: 600,
        marginBottom: 16
      }}>
        <ShieldCheck size={14} />
        <span>SEBI-Aligned Verification Workflow</span>
        <span style={{ color: 'var(--border-strong)' }}>•</span>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
          <Database size={12} />
          <span>Demo SEBI Registry Snapshot</span>
        </div>
      </div>

      <h1 style={{
        fontSize: 'clamp(1.9rem, 4vw, 2.6rem)',
        fontWeight: 800,
        color: 'var(--text-primary)',
        lineHeight: 1.2,
        marginBottom: 14,
        letterSpacing: '-0.025em'
      }}>
        Check an investment message before you act on it.
      </h1>

      <p style={{
        fontSize: 'clamp(0.96rem, 1.8vw, 1.08rem)',
        color: 'var(--text-secondary)',
        lineHeight: 1.6,
        maxWidth: 680,
        margin: '0 auto 18px auto'
      }}>
        Received an unsolicited stock tip, trading group invite, or guaranteed-return promise?
        Paste the text or drop a screenshot to investigate claims, check registration numbers, and spot risk signals before transferring money.
      </p>

      {/* Product Process Visualization */}
      <div className="process-flow">
        <div className="process-step">
          <MessageSquare size={13} color="var(--color-primary)" />
          <span>Message</span>
        </div>
        <div className="process-arrow">
          <ArrowRight size={12} />
        </div>
        <div className="process-step">
          <FileSearch size={13} color="var(--color-primary)" />
          <span>Extract</span>
        </div>
        <div className="process-arrow">
          <ArrowRight size={12} />
        </div>
        <div className="process-step">
          <ShieldCheck size={13} color="var(--color-primary)" />
          <span>Verify</span>
        </div>
        <div className="process-arrow">
          <ArrowRight size={12} />
        </div>
        <div className="process-step">
          <AlertTriangle size={13} color="var(--color-warning)" />
          <span>Check Signals</span>
        </div>
        <div className="process-arrow">
          <ArrowRight size={12} />
        </div>
        <div className="process-step">
          <FileText size={13} color="var(--color-primary)" />
          <span>Explain</span>
        </div>
      </div>

      {/* Trust Indicators */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 16,
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircle size={13} color="var(--color-primary)" />
          <span>Evidence based</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircle size={13} color="var(--color-primary)" />
          <span>Rule-driven risk checks</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircle size={13} color="var(--color-primary)" />
          <span>Registration verification</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircle size={13} color="var(--color-primary)" />
          <span>No message storage after analysis</span>
        </div>
      </div>
    </section>
  );
};
