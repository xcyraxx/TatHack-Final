import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, ChevronDown, ChevronUp, Lock, AlertTriangle, ExternalLink } from 'lucide-react';
import { SecurityReport } from '../../types';
import { useAccessibility } from '../../modules/accessibility-controls/AccessibilityProvider';

interface Props {
  report: SecurityReport;
  compact?: boolean;
}

export const SecurityGuardBanner: React.FC<Props> = ({ report, compact = false }) => {
  const { language } = useAccessibility();
  const ml = language === 'ml';
  const [expanded, setExpanded] = useState(false);

  const isSafe = report.riskLevel === 'safe';
  const isWarning = report.riskLevel === 'warning';
  const isDanger = report.riskLevel === 'danger';

  const badgeBg = isSafe
    ? 'rgba(33, 110, 78, 0.12)'
    : isWarning
    ? 'rgba(232, 163, 74, 0.15)'
    : 'rgba(180, 35, 24, 0.15)';

  const badgeBorder = isSafe
    ? 'var(--km-success)'
    : isWarning
    ? 'var(--km-gold)'
    : 'var(--km-error)';

  const badgeText = isSafe
    ? 'var(--km-success)'
    : isWarning
    ? 'var(--km-warning)'
    : 'var(--km-error)';

  return (
    <div
      role="region"
      aria-label={ml ? 'വെബ്‌സൈറ്റ് സുരക്ഷാ പരിശോധന' : 'Portal Trust & Phishing Guard'}
      className="km-card"
      style={{
        border: `1.5px solid ${badgeBorder}`,
        backgroundColor: isDanger ? 'var(--km-error-surface)' : 'var(--km-white)',
        borderRadius: 'var(--km-radius-sm)',
        padding: compact ? '0.65rem 0.85rem' : '0.85rem 1.15rem',
        marginBottom: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', flex: 1 }}>
          <div style={{ color: badgeText, marginTop: '2px', flexShrink: 0 }}>
            {isSafe ? <ShieldCheck size={compact ? 18 : 22} /> : isWarning ? <ShieldAlert size={compact ? 18 : 22} /> : <ShieldX size={compact ? 18 : 22} />}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 'var(--km-fs-meta)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: badgeText,
                  padding: '2px 6px',
                  borderRadius: 'var(--km-radius-xs)',
                  backgroundColor: badgeBg,
                }}
              >
                {isSafe
                  ? ml ? 'സുരക്ഷിതം' : 'Safe Portal'
                  : isWarning
                  ? ml ? 'ജാഗ്രത പാലിക്കുക' : 'Caution Advised'
                  : ml ? 'വ്യാജ വെബ്സൈറ്റ് മുന്നറിയിപ്പ്' : 'Phishing Risk'}
              </span>

              <span style={{ fontSize: 'var(--km-fs-meta)', color: 'var(--km-text-muted)' }}>
                {report.domain}
              </span>
            </div>

            <p
              style={{
                fontSize: compact ? 'var(--km-fs-meta)' : 'var(--km-fs-small)',
                color: isDanger ? 'var(--km-error)' : 'var(--km-text-primary)',
                fontWeight: 600,
                marginTop: '0.25rem',
                lineHeight: 1.35,
              }}
            >
              {report.summary[ml ? 'ml' : 'en']}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="km-btn km-btn--quiet km-btn--sm"
          style={{ padding: '0 0.35rem', alignSelf: 'flex-start', color: 'var(--km-text-muted)' }}
          aria-expanded={expanded}
          aria-label={expanded ? (ml ? 'വിശദാംശങ്ങൾ ചുരുക്കുക' : 'Hide security details') : (ml ? 'കാരണങ്ങൾ കാണുക' : 'Show security details')}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Sensitive field blocked alert */}
      {report.blockedSensitiveFields.length > 0 && (
        <div
          style={{
            marginTop: '0.65rem',
            padding: '0.6rem 0.75rem',
            backgroundColor: 'var(--km-error-surface)',
            border: '1px solid var(--km-error)',
            borderRadius: 'var(--km-radius-xs)',
            fontSize: 'var(--km-fs-small)',
            color: 'var(--km-error)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
          }}
        >
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div>{ml ? 'നിരോധിച്ച വിവരങ്ങൾ ചോദിക്കുന്നു:' : 'Dangerous Credentials Requested:'} {report.blockedSensitiveFields.join(', ')}</div>
            <div style={{ fontSize: 'var(--km-fs-meta)', fontWeight: 400, marginTop: '0.15rem' }}>
              {ml
                ? 'സർക്കാർ അപേക്ഷകൾക്ക് ഒരിക്കലും യു.പി.ഐ പിന്നോ കാർഡ് സി.വി.വിയോ നൽകേണ്ടതില്ല. ഇത് വഞ്ചനയാകാം.'
                : 'Government applications never require your UPI PIN or CVV. Never enter your PIN to receive money.'}
            </div>
          </div>
        </div>
      )}

      {/* Expanded Security Factor Breakdown */}
      {expanded && (
        <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--km-border)' }}>
          <div style={{ fontSize: 'var(--km-fs-meta)', fontWeight: 700, color: 'var(--km-text-muted)', marginBottom: '0.5rem' }}>
            {ml ? 'സുരക്ഷാ പരിശോധനാ ഫലങ്ങൾ:' : "Here's Why (Trust Factors):"}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {report.factors.map((factor) => {
              const factorColor = factor.level === 'safe'
                ? 'var(--km-success)'
                : factor.level === 'warning'
                ? 'var(--km-warning)'
                : 'var(--km-error)';

              return (
                <div
                  key={factor.id}
                  style={{
                    padding: '0.5rem 0.65rem',
                    backgroundColor: 'var(--km-warm-white)',
                    borderRadius: 'var(--km-radius-xs)',
                    fontSize: 'var(--km-fs-meta)',
                    borderLeft: `3px solid ${factorColor}`,
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--km-text-primary)' }}>
                    {factor.title[ml ? 'ml' : 'en']}
                  </div>
                  <div style={{ color: 'var(--km-text-muted)', marginTop: '0.15rem', lineHeight: 1.35 }}>
                    {factor.description[ml ? 'ml' : 'en']}
                  </div>
                  {factor.recommendation && (
                    <div style={{ color: factorColor, fontWeight: 600, marginTop: '0.2rem' }}>
                      👉 {factor.recommendation[ml ? 'ml' : 'en']}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
