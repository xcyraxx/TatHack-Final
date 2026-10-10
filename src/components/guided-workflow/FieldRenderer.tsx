import React, { useRef, useEffect, useState } from 'react';
import { FieldDefinition } from '../../types';
import { ValidationError } from '../../modules/validation-engine';
import { useAccessibility } from '../../modules/accessibility-controls/AccessibilityProvider';
import { Mic, MicOff, AlertCircle, Volume2, HelpCircle, Loader2, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { speechService } from '../../modules/speech-service';
import { normalizeDateToYMD } from '../../modules/date-formatter';
import { CivicWalletConsentPrompt } from '../civic-wallet/CivicWalletConsentPrompt';

interface Props {
  field: FieldDefinition;
  value: any;
  onChange: (val: any) => void;
  error?: ValidationError | null;
  onListeningChange?: (listening: boolean) => void;
  isListening?: boolean;
  onOpenWalletModal?: () => void;
}

export const FieldRenderer: React.FC<Props> = ({
  field,
  value,
  onChange,
  error,
  onListeningChange,
  isListening = false,
  onOpenWalletModal,
}) => {
  const { language, announce } = useAccessibility();
  const inputRef = useRef<any>(null);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(speechService.isSynthesizing);

  useEffect(() => {
    return speechService.onSynthesizingChange((synth) => {
      setIsSynthesizing(synth);
    });
  }, []);

  // Auto-focus primary input control on step change
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [field.id]);

  // Ensure date values conform to HTML5 yyyy-MM-dd format to avoid browser console warnings
  useEffect(() => {
    if (field.type === 'date' && value && typeof value === 'string') {
      const normalized = normalizeDateToYMD(value);
      if (normalized && normalized !== value) {
        onChange(normalized);
      }
    }
  }, [field.type, value, onChange]);

  const explanationText = language === 'ml' ? field.explanation.ml : field.explanation.en;

  const handleVoiceDictation = () => {
    if (isListening) {
      speechService.stopListening();
      if (onListeningChange) onListeningChange(false);
      announce('Stopped listening');
    } else {
      announce(language === 'ml' ? 'സംസാരിക്കുക...' : 'Listening... Speak your answer.');
      if (onListeningChange) onListeningChange(true);

      speechService.startListening(
        language,
        (transcript) => {
          onChange(transcript);
          announce(
            language === 'ml'
              ? `കേട്ട വാക്ക്: ${transcript}. തിരുത്താൻ വേണമെങ്കിൽ ടൈപ്പ് ചെയ്യാം.`
              : `Recognized: "${transcript}". You can edit this text.`
          );
          if (onListeningChange) onListeningChange(false);
        },
        (err) => {
          announce(`Voice input error: ${err}`);
          if (onListeningChange) onListeningChange(false);
        },
        () => {
          if (onListeningChange) onListeningChange(false);
        }
      );
    }
  };

  const handleReadQuestion = () => {
    speechService.speak(`${field.questionText}. ${explanationText}`, language);
    announce(language === 'ml' ? 'ചോദ്യം വായിക്കുന്നു' : 'Reading the question aloud');
  };

  const errorId = `error-${field.id}`;
  const helpId = `help-${field.id}`;
  const describedBy = error ? `${helpId} ${errorId}` : helpId;

  return (
    <div>
      {/* The question — the dominant element of this screen */}
      <div className="km-question-block__head">
        <h2 className="km-question" id={`label-${field.id}`}>
          {field.questionText}
        </h2>
      </div>

      {/* Where this question comes from, plus optional voice playback */}
      <div className="km-question-block__meta">
        <span>
          {language === 'ml' ? 'യഥാർത്ഥ ഫോമിലെ കോൾ:' : 'Original field:'}{' '}
          <strong>{field.label}</strong>
        </span>
        {field.required && (
          <span className="km-question-block__required">
            {language === 'ml' ? 'ആവശ്യമാണ്' : 'Required'}
          </span>
        )}
        {speechService.isSynthesisSupported() && (
          <button
            type="button"
            className="km-btn km-btn--quiet km-btn--sm km-btn--icon"
            style={{ marginLeft: 'auto' }}
            onClick={handleReadQuestion}
            disabled={isSynthesizing}
            aria-label={
              isSynthesizing
                ? language === 'ml'
                  ? 'ശബ്ദം തയ്യാറാക്കുന്നു...'
                  : 'Generating speech...'
                : language === 'ml'
                ? 'ചോദ്യം വായിക്കുക'
                : 'Read this question aloud'
            }
            title={
              isSynthesizing
                ? language === 'ml'
                  ? 'ശബ്ദം തയ്യാറാക്കുന്നു...'
                  : 'Generating speech...'
                : language === 'ml'
                ? 'ചോദ്യം വായിക്കുക'
                : 'Read this question aloud'
            }
          >
            {isSynthesizing ? (
              <Loader2 size={16} className="km-spin" aria-hidden="true" />
            ) : (
              <Volume2 size={16} aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {/* Plain-language explanation — secondary, but readable */}
      <p className="km-help" id={helpId}>
        {explanationText}
      </p>

      {/* Field-level Civic Wallet Consent Prompt */}
      <CivicWalletConsentPrompt
        field={field}
        currentValue={value}
        onApplyValue={(val) => onChange(val)}
        onOpenWalletModal={onOpenWalletModal || (() => {})}
      />

      <div className="km-control-area">
        {(field.type === 'text' ||
          field.type === 'email' ||
          field.type === 'tel' ||
          field.type === 'date' ||
          field.type === 'number') && (
          <>
            <div className="km-field">
              <input
                ref={inputRef}
                id={field.id}
                className="km-control"
                type={field.type}
                value={field.type === 'date' ? normalizeDateToYMD(value) : (value ?? '')}
                onChange={(e) => {
                  const rawVal = e.target.value;
                  if (field.type === 'date') {
                    onChange(normalizeDateToYMD(rawVal) || rawVal);
                  } else {
                    onChange(rawVal);
                  }
                }}
                placeholder={field.placeholder || ''}
                aria-labelledby={`label-${field.id}`}
                aria-describedby={describedBy}
                aria-required={field.required}
                aria-invalid={Boolean(error)}
              />

              {speechService.isRecognitionSupported() && field.type !== 'date' && (
                <button
                  type="button"
                  className={`km-btn km-btn--secondary km-btn--icon km-voice-btn${
                    isListening ? ' km-voice-btn--on' : ''
                  }`}
                  onClick={handleVoiceDictation}
                  aria-pressed={isListening}
                  aria-label={
                    isListening
                      ? language === 'ml'
                        ? 'വോയ്‌സ് റെക്കോർഡിംഗ് നിർത്തുക'
                        : 'Stop voice dictation'
                      : language === 'ml'
                        ? 'സംസാരിച്ച് ഉത്തരം നൽകുക'
                        : 'Dictate answer with voice'
                  }
                  title={language === 'ml' ? 'സംസാരിച്ച് നൽകുക' : 'Dictate with voice'}
                >
                  {isListening ? <MicOff size={18} aria-hidden="true" /> : <Mic size={18} aria-hidden="true" />}
                </button>
              )}
            </div>
            {isListening && (
              <p className="km-voice-status" role="status" style={{ marginTop: '0.35rem' }}>
                {language === 'ml' ? 'സംസാരിക്കൂ…' : 'Listening…'}
              </p>
            )}
          </>
        )}

        {field.type === 'textarea' && (
          <div className="km-stack" style={{ gap: '0.5rem' }}>
            <textarea
              ref={inputRef}
              id={field.id}
              className="km-control km-textarea"
              rows={4}
              value={value ?? ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder || ''}
              aria-labelledby={`label-${field.id}`}
              aria-describedby={describedBy}
              aria-required={field.required}
              aria-invalid={Boolean(error)}
            />
            {speechService.isRecognitionSupported() && (
              <div>
                <button
                  type="button"
                  className={`km-btn km-btn--secondary km-btn--sm km-voice-btn${
                    isListening ? ' km-voice-btn--on' : ''
                  }`}
                  onClick={handleVoiceDictation}
                  aria-pressed={isListening}
                >
                  {isListening ? <MicOff size={15} aria-hidden="true" /> : <Mic size={15} aria-hidden="true" />}
                  <span>{isListening ? 'Stop listening' : 'Dictate with voice'}</span>
                </button>
                {isListening && (
                  <p className="km-voice-status" role="status">
                    {language === 'ml' ? 'സംസാരിക്കൂ…' : 'Listening…'}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {field.type === 'select' && (
          <select
            ref={inputRef}
            id={field.id}
            className="km-control km-select"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            aria-labelledby={`label-${field.id}`}
            aria-describedby={describedBy}
            aria-required={field.required}
            aria-invalid={Boolean(error)}
          >
            <option value="">
              {language === 'ml' ? '-- ഒരു ഓപ്ഷൻ തിരഞ്ഞെടുക്കുക --' : '-- Select an option --'}
            </option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {field.type === 'radio' && (
          <fieldset className="km-choice-group" data-invalid={error ? 'true' : undefined}>
            <legend className="km-choice-group__legend">
              {language === 'ml' ? 'ഒന്ന് തിരഞ്ഞെടുക്കുക' : 'Choose one'} — {field.label}
            </legend>
            {field.options?.map((opt, idx) => {
              const isSelected = value === opt.value;
              return (
                <label
                  key={opt.value}
                  className={`km-choice${isSelected ? ' km-choice--on' : ''}`}
                >
                  <input
                    ref={idx === 0 ? inputRef : undefined}
                    type="radio"
                    name={field.name}
                    value={opt.value}
                    checked={isSelected}
                    onChange={() => onChange(opt.value)}
                    aria-describedby={describedBy}
                    aria-required={field.required}
                    aria-invalid={Boolean(error)}
                  />
                  <span className="km-choice__text">{opt.label}</span>
                </label>
              );
            })}
          </fieldset>
        )}

        {field.type === 'checkbox' && (
          <fieldset className="km-choice-group" data-invalid={error ? 'true' : undefined}>
            <legend className="km-sr-only">{field.questionText}</legend>
            <label className={`km-choice${value ? ' km-choice--on' : ''}`}>
              <input
                ref={inputRef}
                id={field.id}
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => onChange(e.target.checked)}
                aria-describedby={describedBy}
                aria-required={field.required}
                aria-invalid={Boolean(error)}
              />
              <span className="km-choice__text">{field.label}</span>
            </label>
          </fieldset>
        )}

        {field.type === 'file' && (
          <div className="km-stack" style={{ gap: '0.75rem' }}>
            {value ? (
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--km-mint-tint, #eefaf3)',
                  border: '1.5px solid var(--km-success, #216e4e)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--km-success-surface, #f0f9f4)',
                      color: 'var(--km-success, #216e4e)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--km-forest, #123b35)' }}>
                      {String(value)}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--km-success, #216e4e)', fontWeight: 600 }}>
                      {language === 'ml' ? 'രേഖ പരിശോധിച്ചു തയ്യാറാക്കി' : 'Document verified & ready for transfer'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="km-btn km-btn--secondary km-btn--sm"
                  style={{ fontSize: '0.75rem' }}
                >
                  {language === 'ml' ? 'മാറ്റുക' : 'Change'}
                </button>
              </div>
            ) : (
              <div
                style={{
                  padding: '1.25rem',
                  border: '2px dashed var(--km-border, #cbd5e1)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--km-warm-white, #f8fafc)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--km-forest, #123b35)' }}>
                  <Upload size={18} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                    {language === 'ml' ? 'രേഖ തിരഞ്ഞെടുക്കുക അല്ലെങ്കിൽ സാമ്പിൾ ചേർക്കുക' : 'Select a document file or attach sample'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <input
                    ref={inputRef}
                    id={field.id}
                    className="km-control"
                    type="file"
                    style={{ flex: 1, minWidth: '180px', padding: '0.45rem' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      onChange(file ? file.name : '');
                    }}
                    aria-labelledby={`label-${field.id}`}
                    aria-describedby={describedBy}
                    aria-required={field.required}
                    aria-invalid={Boolean(error)}
                  />

                  <button
                    type="button"
                    onClick={() => {
                      onChange('income_certificate_2026.pdf');
                      announce(language === 'ml' ? 'സാമ്പിൾ രേഖ ചേർത്തു' : 'Sample document attached');
                    }}
                    className="km-btn km-btn--primary km-btn--sm"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    <FileText size={14} />
                    <span>{language === 'ml' ? 'സാമ്പിൾ രേഖ ചേർക്കുക (PDF)' : 'Attach Sample PDF'}</span>
                  </button>
                </div>

                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--km-text-muted, #64748b)' }}>
                  {language === 'ml'
                    ? 'ടെസ്റ്റിംഗിനായി നിങ്ങൾക്ക് ഫയൽ അപ്‌ലോഡ് ചെയ്യാം അല്ലെങ്കിൽ "സാമ്പിൾ രേഖ ചേർക്കുക" ക്ലിക്ക് ചെയ്ത് മുന്നോട്ട് പോകാം.'
                    : 'For testing, you can choose any local PDF/JPG or click "Attach Sample PDF" to proceed instantly.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contextual validation */}
      {error && (
        <div className="km-error" id={errorId} role="alert">
          <AlertCircle size={15} aria-hidden="true" />
          <span>{language === 'ml' ? error.message.ml : error.message.en}</span>
        </div>
      )}
    </div>
  );
};
