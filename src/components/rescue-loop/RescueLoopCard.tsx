import React from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, RotateCcw, Wrench } from 'lucide-react';
import { RescueIssue, RescueReport } from '../../types';
import { useAccessibility } from '../../modules/accessibility-controls/AccessibilityProvider';
import { NeuButton } from '../NeuButton';

interface Props {
  rescueReport: RescueReport;
  onFixFieldInGuided?: (fieldId: string) => void;
  onRetryTransfer?: () => void;
  compact?: boolean;
}

export const RescueLoopCard: React.FC<Props> = ({
  rescueReport,
  onFixFieldInGuided,
  onRetryTransfer,
  compact = false,
}) => {
  const { language } = useAccessibility();
  const ml = language === 'ml';

  if (!rescueReport.hasErrors || rescueReport.issues.length === 0) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className="km-card"
      style={{
        border: '2px solid var(--km-warning)',
        backgroundColor: 'var(--km-warning-surface)',
        borderRadius: 'var(--km-radius-md)',
        padding: compact ? '0.75rem' : '1.15rem',
        marginBottom: '1.25rem',
        boxShadow: '0 4px 12px rgba(138, 82, 0, 0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
        <div style={{ color: 'var(--km-warning)', marginTop: '2px', flexShrink: 0 }}>
          <RotateCcw size={22} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 'var(--km-fs-meta)',
                fontWeight: 700,
                color: 'var(--km-warning)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                padding: '2px 6px',
                borderRadius: 'var(--km-radius-xs)',
                backgroundColor: 'rgba(232, 163, 74, 0.2)',
              }}
            >
              {ml ? 'റെസ്ക്യൂ ലൂപ്പ് (പരിഹാര സഹായി)' : 'Vazhika Rescue Loop'}
            </span>

            <span style={{ fontSize: 'var(--km-fs-meta)', color: 'var(--km-text-muted)', fontWeight: 600 }}>
              {rescueReport.totalErrors} {rescueReport.totalErrors === 1 ? (ml ? 'തെറ്റ് കണ്ടെത്തി' : 'issue detected') : (ml ? 'തെറ്റുകൾ കണ്ടെത്തി' : 'issues detected')}
            </span>
          </div>

          <h3
            style={{
              fontSize: 'var(--km-fs-lead)',
              fontWeight: 700,
              color: 'var(--km-text-primary)',
              margin: '0.35rem 0 0.2rem',
              lineHeight: 1.3,
            }}
          >
            {ml ? 'വെബ്‌സൈറ്റ് അപേക്ഷ നിരസിച്ചു — വഴിക പരിഹാരം സഹായിക്കാം' : 'Submission Rejected by Website — Let Vazhika Rescue You'}
          </h3>

          <p style={{ fontSize: 'var(--km-fs-small)', color: 'var(--km-text-muted)', lineHeight: 1.45, margin: 0 }}>
            {ml
              ? 'യഥാർത്ഥ വെബ്‌സൈറ്റിലെ തെറ്റുകൾ കണ്ടെത്തി. ഓരോ ചോദ്യവും എളുപ്പത്തിൽ തിരുത്താം:'
              : "The original webpage rejected your inputs. Here is plain-language guidance to fix each issue:"}
          </p>
        </div>
      </div>

      {/* Issues list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
        {rescueReport.issues.map((issue) => (
          <div
            key={issue.fieldId}
            style={{
              backgroundColor: 'var(--km-white)',
              borderRadius: 'var(--km-radius-sm)',
              border: '1px solid var(--km-border)',
              borderLeft: '4px solid var(--km-error)',
              padding: '0.75rem 0.9rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div>
                <span style={{ fontSize: 'var(--km-fs-base)', fontWeight: 700, color: 'var(--km-text-primary)' }}>
                  {issue.label}
                </span>

                <div style={{ fontSize: 'var(--km-fs-meta)', color: 'var(--km-error)', fontWeight: 600, marginTop: '0.15rem' }}>
                  {ml ? 'സൈറ്റിലെ പിശക്:' : 'Website Error:'} {issue.rawError}
                </div>
              </div>

              {onFixFieldInGuided && (
                <button
                  type="button"
                  onClick={() => onFixFieldInGuided(issue.fieldId)}
                  className="km-btn km-btn--sm km-btn--secondary"
                  style={{ flexShrink: 0 }}
                  aria-label={`${ml ? 'തിരുത്തുക' : 'Fix in Guided Mode'}: ${issue.label}`}
                >
                  <Wrench size={13} aria-hidden="true" />
                  <span>{ml ? 'തിരുത്തുക' : 'Fix this'}</span>
                </button>
              )}
            </div>

            <div
              style={{
                marginTop: '0.5rem',
                padding: '0.5rem 0.65rem',
                backgroundColor: 'var(--km-mint-tint)',
                borderRadius: 'var(--km-radius-xs)',
                fontSize: 'var(--km-fs-small)',
                color: 'var(--km-text-primary)',
                lineHeight: 1.4,
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--km-forest)' }}>
                💡 {ml ? 'എന്തുകൊണ്ട് ഇത് സംഭവിച്ചു?' : 'Why this was rejected:'}
              </div>
              <div style={{ marginTop: '0.2rem' }}>
                {issue.friendlyExplanation[ml ? 'ml' : 'en']}
              </div>
              {issue.suggestedFix && (
                <div style={{ marginTop: '0.35rem', fontWeight: 600, color: 'var(--km-forest)' }}>
                  👉 {ml ? 'ചെയ്യേണ്ടത്:' : 'How to fix:'} {issue.suggestedFix[ml ? 'ml' : 'en']}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {onRetryTransfer && (
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <NeuButton variant="forest" onClick={onRetryTransfer}>
            <CheckCircle2 size={16} aria-hidden="true" />
            <span>{ml ? 'തിരുത്തിയ വിവരങ്ങൾ വെബ്‌സൈറ്റിലേക്ക് മാറ്റുക' : 'Transfer Fixes to Webpage'}</span>
          </NeuButton>
        </div>
      )}
    </div>
  );
};
