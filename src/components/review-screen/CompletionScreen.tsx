import React from 'react';
import { TransferResult } from '../../types';
import { useAccessibility } from '../../modules/accessibility-controls/AccessibilityProvider';
import { CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  result: TransferResult;
  onRestart: () => void;
}

export const CompletionScreen: React.FC<Props> = ({ result, onRestart }) => {
  const { language } = useAccessibility();

  const failed = result.failedFields ?? [];
  const isPreview = result.notice.toLowerCase().includes('demo');

  return (
    <div>
      {/* What actually happened */}
      <div className="km-notice km-notice--success" role="status">
        <CheckCircle2 size={17} aria-hidden="true" />
        <div>
          <strong className="km-notice__title">
            {language === 'ml'
              ? `${result.transferredCount} ഉത്തരങ്ങൾ ഫോമിൽ നിറച്ചു`
              : `${result.transferredCount} of ${result.totalFields} answers transferred`}
          </strong>
          {language === 'ml'
            ? 'ഉത്തരങ്ങൾ യഥാർത്ഥ പേജിലെ കോളങ്ങളിൽ നിറച്ചു.'
            : 'The values are now in the original page controls.'}
        </div>
      </div>

      {/* What still needs a person */}
      {failed.length > 0 && (
        <div className="km-notice km-notice--warning" style={{ marginTop: '0.75rem' }}>
          <AlertTriangle size={17} aria-hidden="true" />
          <div>
            <strong className="km-notice__title">
              {language === 'ml'
                ? `${failed.length} കോളങ്ങൾക്ക് കൈകൊണ്ട് ശ്രദ്ധ വേണം`
                : `${failed.length} ${failed.length === 1 ? 'field needs' : 'fields need'} manual attention`}
            </strong>
            <ul style={{ margin: '0.3rem 0 0', paddingLeft: '1.1rem' }}>
              {failed.map((f) => (
                <li key={f.fieldId}>
                  <strong>{f.label}</strong> — {f.reason}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* What will never happen automatically */}
      <div className="km-notice" style={{ marginTop: '0.75rem' }}>
        <div>
          <strong className="km-notice__title">
            {language === 'ml' ? 'ഫോം ഇതുവരെ സമർപ്പിച്ചിട്ടില്ല' : 'The form has not been submitted'}
          </strong>
          {result.notice}
        </div>
      </div>

      {isPreview && (
        <p className="km-meta" style={{ marginTop: '0.75rem' }}>
          {language === 'ml'
            ? 'ഇത് ഒരു പ്രിവ്യൂ മാത്രമാണ് — എക്സ്റ്റൻഷന് പുറത്ത് ഒന്നും എഴുതപ്പെട്ടില്ല.'
            : 'Preview only — this ran outside the extension, so nothing was written to a page.'}
        </p>
      )}

      {/* Quiet record of the session */}
      <p className="km-meta" style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--km-border)' }}>
        {language === 'ml' ? 'സമയം: ' : 'Transferred at '}
        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>

      <p className="km-sub" style={{ marginTop: '1rem' }}>
        {language === 'ml'
          ? 'ഉത്തരങ്ങൾ ഈ ബ്രൗസറിൽ നിന്ന് പുറത്തേക്ക് അയച്ചിട്ടില്ല.'
          : 'Nothing was sent to a server — the transfer happened inside this browser.'}
      </p>

      <div style={{ marginTop: '1.25rem' }}>
        <button type="button" onClick={onRestart} className="km-btn km-btn--primary">
          <RotateCcw size={15} aria-hidden="true" />
          <span>{language === 'ml' ? 'പുതിയ സെഷൻ ആരംഭിക്കുക' : 'Start a new session'}</span>
        </button>
      </div>
    </div>
  );
};
