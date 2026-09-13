import React from 'react';
import { Check, Loader2 } from 'lucide-react';

interface PipelineStepsProps {
  currentStep: number; // 0: idle, 1: reading, 2: claims, 3: checking, 4: warning signs, 5: putting together, 6: done
  isProcessing: boolean;
}

const HUMAN_STEPS = [
  { id: 1, label: 'Reading the message' },
  { id: 2, label: 'Finding the claims' },
  { id: 3, label: 'Checking official details' },
  { id: 4, label: 'Looking for warning signs' },
  { id: 5, label: 'Putting everything together' }
];

export const PipelineSteps: React.FC<PipelineStepsProps> = ({ currentStep, isProcessing }) => {
  if (!isProcessing && currentStep === 0) return null;

  return (
    <div style={{
      maxWidth: 820,
      margin: '0 auto 28px auto',
      backgroundColor: '#ffffff',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px 24px',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Loader2 size={16} className="animate-spin" color="var(--color-primary)" />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Checking your message...
          </span>
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Takes about 5–10 seconds
        </span>
      </div>

      {/* Progress Steps List */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 10
      }}>
        {HUMAN_STEPS.map((step) => {
          const isDone = currentStep > step.id || currentStep === 6;
          const isCurrent = isProcessing && currentStep === step.id;

          return (
            <div
              key={step.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: isCurrent ? 'var(--color-primary-light)' : isDone ? 'var(--color-success-bg)' : 'var(--bg-surface-subtle)',
                border: `1px solid ${isCurrent ? 'var(--color-primary-border)' : isDone ? 'var(--color-success-border)' : 'var(--border-subtle)'}`,
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isDone ? 'var(--color-success)' : isCurrent ? 'var(--color-primary)' : 'var(--bg-surface-muted)',
                color: '#ffffff',
                fontSize: '0.7rem',
                flexShrink: 0
              }}>
                {isDone ? (
                  <Check size={12} strokeWidth={3} />
                ) : isCurrent ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{step.id}</span>
                )}
              </div>

              <span style={{
                fontSize: '0.78rem',
                fontWeight: isCurrent ? 600 : 500,
                color: isCurrent ? 'var(--color-primary)' : isDone ? 'var(--color-success)' : 'var(--text-muted)',
                lineHeight: 1.2
              }}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
