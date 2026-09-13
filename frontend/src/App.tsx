import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { PipelineSteps } from './components/PipelineSteps';
import { Analyzer } from './components/Analyzer';
import { VerdictView } from './components/VerdictView';
import { RegistrySearchModal } from './components/RegistrySearchModal';
import { MethodologyModal } from './components/MethodologyModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import type { FinalVerdict, SampleCase } from './types';
import { API_BASE_URL } from './config';
import { AlertCircle } from 'lucide-react';

const FALLBACK_SAMPLE_CASES: SampleCase[] = [
  {
    id: "CASE-A-FAKE-REG",
    scenario: "A — Fake registration number with guaranteed returns and urgency",
    category: "suspicious",
    input_type: "text",
    input_text: "JACKPOT NIFTY CALLS! SEBI Reg No: INA999888777 by Apex Super Wealth. Guaranteed 50% monthly profit on option trades! Limited 10 VIP slots available today only. Pay Rs 5000 via GPay to 9876543210@ybl to start immediately.",
    expected_claimed_reg: "INA999888777",
    expected_lookup: "not_found",
    expected_bucket: "HIGH_RISK_INDICATORS",
    notes: "Triggers REG-01, FIN-01, FIN-02, PSY-01, PSY-02, PAY-01, PAY-02. Mandatory HIGH-RISK override applies."
  },
  {
    id: "CASE-B-VALID-REG-SUSPICIOUS-CLAIMS",
    scenario: "B — Valid registration number but suspicious guaranteed return language",
    category: "ambiguous",
    input_type: "text",
    input_text: "Market Advisory from Motilal Oswal Financial Services Limited. SEBI Reg No: INA000000037. We promise 40% guaranteed returns on smallcap portfolio. Contact our WhatsApp VIP team.",
    expected_claimed_reg: "INA000000037",
    expected_lookup: "found",
    expected_bucket: "NEEDS_VERIFICATION",
    notes: "Registration is valid and active, but guaranteed return claim FIN-01 triggers cautionary flag."
  },
  {
    id: "CASE-C-VALID-REG-LEGITIMATE",
    scenario: "C — Fully legitimate registered advisory communication",
    category: "legitimate",
    input_type: "text",
    input_text: "Quarterly Research Note: Kotak Investment Advisors Limited (SEBI Reg No: INA000008434). Market outlook suggests moderate inflation cooling. Investments in securities market are subject to market risks. Read all scheme related documents carefully.",
    expected_claimed_reg: "INA000008434",
    expected_lookup: "found",
    expected_bucket: "LOW_CONCERN",
    notes: "Valid registration, active status, matching legal entity, no manipulation language."
  }
];

const formatApiError = (err: any, fallbackMessage: string): string => {
  if (!err) return fallbackMessage;
  const msg = (err.message || '').toString();
  if (
    msg.toLowerCase().includes('failed to fetch') ||
    msg.toLowerCase().includes('networkerror') ||
    msg.toLowerCase().includes('load failed') ||
    msg.toLowerCase().includes('connection refused')
  ) {
    return 'Unable to connect to the TipCheck API server. Please ensure the backend server is running and accessible.';
  }
  return msg || fallbackMessage;
};

export const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [currentVerdict, setCurrentVerdict] = useState<FinalVerdict | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReverifying, setIsReverifying] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0); // 0: idle, 1: reading, 2: claims, 3: checking, 4: warning signs, 5: putting together, 6: done
  const [sampleCases, setSampleCases] = useState<SampleCase[]>(FALLBACK_SAMPLE_CASES);
  const [history, setHistory] = useState<FinalVerdict[]>([]);
  const [snapshotDate, setSnapshotDate] = useState('01 Aug 2026');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [isRegistryOpen, setIsRegistryOpen] = useState(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const verdictRef = useRef<HTMLDivElement>(null);
  const analyzerRef = useRef<HTMLDivElement>(null);

  // Load sample cases and system status on mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/system/status`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data.registry_snapshot_date) {
          setSnapshotDate(data.registry_snapshot_date);
        }
      })
      .catch(err => {
        console.warn('TipCheck API status endpoint unreachable:', err?.message || err);
      });

    fetch(`${API_BASE_URL}/api/sample-cases`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data.cases && Array.isArray(data.cases) && data.cases.length > 0) {
          setSampleCases(data.cases);
        }
      })
      .catch(err => {
        console.warn('TipCheck API sample cases endpoint unreachable, using fallback cases:', err?.message || err);
      });
  }, []);

  const runPipelineAnimation = async () => {
    setPipelineStep(1);
    await new Promise(r => setTimeout(r, 450));
    setPipelineStep(2);
    await new Promise(r => setTimeout(r, 600));
    setPipelineStep(3);
    await new Promise(r => setTimeout(r, 550));
    setPipelineStep(4);
    await new Promise(r => setTimeout(r, 450));
    setPipelineStep(5);
    await new Promise(r => setTimeout(r, 500));
    setPipelineStep(6);
  };

  const handleAnalyzeText = async (text: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setCurrentVerdict(null);

    const animPromise = runPipelineAnimation();
    try {
      const res = await fetch(`${API_BASE_URL}/analyze/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!res.ok) {
        let errDetail = 'We could not finish checking this message.';
        try {
          const errData = await res.json();
          if (errData.detail) errDetail = errData.detail;
        } catch {}
        throw new Error(errDetail);
      }

      const data = await res.json();
      await animPromise;

      const verdict: FinalVerdict = data.result;
      setCurrentVerdict(verdict);
      setHistory(prev => [verdict, ...prev]);

      setTimeout(() => {
        verdictRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } catch (err: any) {
      console.error('Analyze text error:', err);
      setErrorMessage(formatApiError(err, "We couldn't finish checking this message. Please check your connection and try again."));
      setPipelineStep(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnalyzeImage = async (file: File) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setCurrentVerdict(null);

    const animPromise = runPipelineAnimation();
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE_URL}/analyze/image`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        let errDetail = 'Could not extract text from this screenshot.';
        try {
          const errData = await res.json();
          if (errData.detail) errDetail = errData.detail;
        } catch {}
        throw new Error(errDetail);
      }

      const data = await res.json();
      await animPromise;

      const verdict: FinalVerdict = data.result;
      setCurrentVerdict(verdict);
      setHistory(prev => [verdict, ...prev]);

      setTimeout(() => {
        verdictRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } catch (err: any) {
      console.error('Analyze image error:', err);
      setErrorMessage(formatApiError(err, "We couldn't read the text in this image. Please try pasting the message text directly."));
      setPipelineStep(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReverify = async (correctedRegNo: string, correctedEntityName: string) => {
    if (!currentVerdict) return;
    setIsReverifying(true);
    try {
      const res = await fetch(`${API_BASE_URL}/verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_id: currentVerdict.analysis_id,
          corrected_registration_number: correctedRegNo,
          corrected_entity_name: correctedEntityName
        })
      });

      if (!res.ok) {
        throw new Error('Re-verification failed.');
      }

      const updatedVerdict: FinalVerdict = await res.json();
      setCurrentVerdict(updatedVerdict);
      setHistory(prev => prev.map(h => h.analysis_id === updatedVerdict.analysis_id ? updatedVerdict : h));
    } catch (err: any) {
      console.error('Re-verification error:', err);
      setErrorMessage(formatApiError(err, "Unable to update verification with the edited details. Please try again."));
    } finally {
      setIsReverifying(false);
    }
  };

  const handleClearAll = () => {
    setInputText('');
    setCurrentVerdict(null);
    setErrorMessage(null);
    setPipelineStep(0);
  };

  const handleSelectSample = (sample: SampleCase) => {
    setInputText(sample.input_text);
    handleAnalyzeText(sample.input_text);
  };

  const scrollToInput = () => {
    const el = document.getElementById('analyzer-section');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToExamples = () => {
    const el = document.getElementById('examples-section');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="app-container">
      <Navbar
        snapshotDate={snapshotDate}
        onOpenRegistrySearch={() => setIsRegistryOpen(true)}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
        onNavigateToInput={scrollToInput}
        onNavigateToExamples={scrollToExamples}
      />

      <main className="main-content">
        <Hero currentVerdict={currentVerdict} />

        {/* Humanized Error State */}
        {errorMessage && (
          <div style={{
            maxWidth: 820,
            margin: '0 auto 24px auto',
            backgroundColor: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <AlertCircle size={20} color="var(--color-danger)" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-danger)', marginBottom: 2 }}>
                  We couldn't finish checking this message
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {errorMessage}
                </p>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Progress Pipeline Steps */}
        {(isProcessing || pipelineStep > 0) && (
          <PipelineSteps
            currentStep={pipelineStep}
            isProcessing={isProcessing}
          />
        )}

        {/* Main Check Input */}
        <div ref={analyzerRef}>
          <Analyzer
            inputText={inputText}
            setInputText={setInputText}
            onAnalyzeText={handleAnalyzeText}
            onAnalyzeImage={handleAnalyzeImage}
            isProcessing={isProcessing}
            sampleCases={sampleCases}
            onSelectSample={handleSelectSample}
            onClear={handleClearAll}
          />
        </div>

        {/* Results View */}
        <div ref={verdictRef}>
          {currentVerdict && (
            <VerdictView
              verdict={currentVerdict}
              onReverify={handleReverify}
              isReverifying={isReverifying}
              onCheckAnother={handleClearAll}
            />
          )}
        </div>
      </main>

      {/* Modals & Drawers */}
      <RegistrySearchModal
        isOpen={isRegistryOpen}
        onClose={() => setIsRegistryOpen(false)}
        snapshotDate={snapshotDate}
      />

      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectVerdict={(v) => {
          setCurrentVerdict(v);
          setTimeout(() => {
            verdictRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
      />
    </div>
  );
};

export default App;
