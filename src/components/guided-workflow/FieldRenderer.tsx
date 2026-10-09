import React, { useRef, useEffect } from 'react';
import { FieldDefinition } from '../../types';
import { ValidationError } from '../../modules/validation-engine';
import { useAccessibility } from '../../modules/accessibility-controls/AccessibilityProvider';
import { Mic, MicOff, AlertCircle, Volume2 } from 'lucide-react';
import { speechService } from '../../modules/speech-service';

interface Props {
  field: FieldDefinition;
  value: any;
  onChange: (val: any) => void;
  error?: ValidationError | null;
  onListeningChange?: (listening: boolean) => void;
  isListening?: boolean;
}

export const FieldRenderer: React.FC<Props> = ({
  field,
  value,
  onChange,
  error,
  onListeningChange,
  isListening = false,
}) => {
  const { language, announce } = useAccessibility();
  const inputRef = useRef<any>(null);

  // Auto-focus primary input control on step change
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [field.id]);

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
            aria-label={
              language === 'ml' ? 'ചോദ്യം വായിക്കുക' : 'Read this question aloud'
            }
            title={language === 'ml' ? 'ചോദ്യം വായിക്കുക' : 'Read this question aloud'}
          >
            <Volume2 size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Plain-language explanation — secondary, but readable */}
      <p className="km-help" id={helpId}>
        {explanationText}
      </p>

      {/* Control */}
      <div className="km-control-area">
        {(field.type === 'text' ||
          field.type === 'email' ||
          field.type === 'tel' ||
          field.type === 'date' ||
          field.type === 'number') && (
          <div className="km-field">
            <input
              ref={inputRef}
              id={field.id}
              className="km-control"
              type={field.type}
              value={value ?? ''}
              onChange={(e) => onChange(e.target.value)}
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
