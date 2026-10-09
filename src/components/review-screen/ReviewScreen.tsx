import React, { useState } from 'react';
import { FieldDefinition } from '../../types';
import { useAccessibility } from '../../modules/accessibility-controls/AccessibilityProvider';
import { Volume2, VolumeX, Pencil, ArrowRight, ArrowLeft } from 'lucide-react';
import { speechService } from '../../modules/speech-service';

interface Props {
  fields: FieldDefinition[];
  answers: Record<string, any>;
  onEditField: (index: number) => void;
  onConfirmTransfer: () => void;
  onBackToGuided: () => void;
  isTransferring?: boolean;
}

export const ReviewScreen: React.FC<Props> = ({
  fields,
  answers,
  onEditField,
  onConfirmTransfer,
  onBackToGuided,
  isTransferring = false,
}) => {
  const { language, announce } = useAccessibility();
  const [isReadingAll, setIsReadingAll] = useState(false);

  const handleReadAloud = () => {
    if (isReadingAll) {
      speechService.stopSpeaking();
      setIsReadingAll(false);
      announce('Stopped reading review');
    } else {
      setIsReadingAll(true);
      const summaryText = fields
        .map((f, i) => {
          const val = answers[f.id] ?? answers[f.name] ?? (language === 'ml' ? 'നൽകിയിട്ടില്ല' : 'Not provided');
          return `Question ${i + 1}: ${f.label}. Your answer: ${val}.`;
        })
        .join(' ');

      announce('Reading answers aloud');
      speechService.speak(
        summaryText,
        language,
        () => setIsReadingAll(false),
        () => setIsReadingAll(false)
      );
    }
  };

  const isMissing = (field: FieldDefinition) => {
    const val = answers[field.id] ?? answers[field.name];
    if (field.type === 'checkbox') return field.required && val !== true;
    return val === undefined || val === null || val === '';
  };

  const missingFields = fields.filter(isMissing);

  const getDisplayValue = (field: FieldDefinition, val: any) => {
    if (val === undefined || val === null || val === '') {
      return language === 'ml' ? 'നൽകിയിട്ടില്ല' : 'Not provided';
    }
    if (field.type === 'checkbox') {
      return val
        ? language === 'ml'
          ? 'അംഗീകരിച്ചു'
          : 'Agreed'
        : language === 'ml'
        ? 'അംഗീകരിച്ചിട്ടില്ല'
        : 'Not agreed';
    }
    if (field.type === 'radio' || field.type === 'select') {
      const opt = field.options?.find((o) => o.value === String(val));
      return opt ? opt.label : String(val);
    }
    return String(val);
  };

  return (
    <div>
      {/* Summary of where the user stands */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 className="km-title">{language === 'ml' ? 'വിവരങ്ങൾ പരിശോധിക്കുക' : 'Review Your Answers'}</h2>
          <p className="km-sub" style={{ marginTop: '0.4rem' }}>
            {language === 'ml'
              ? 'യഥാർത്ഥ പേജിലേക്ക് മാറ്റുന്നതിന് മുമ്പ് ഉത്തരങ്ങൾ പരിശോധിക്കുക.'
              : 'Check each answer before transferring them to the original form.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleReadAloud}
          className="km-btn km-btn--secondary km-btn--sm"
          aria-pressed={isReadingAll}
        >
          {isReadingAll ? <VolumeX size={15} aria-hidden="true" /> : <Volume2 size={15} aria-hidden="true" />}
          <span>{isReadingAll ? language === 'ml' ? 'നിർത്തുക' : 'Stop reading' : language === 'ml' ? 'എല്ലാം കേൾക്കുക' : 'Read answers aloud'}</span>
        </button>
      </div>

      {missingFields.length > 0 && (
        <div className="km-notice km-notice--warning" style={{ marginTop: '1.25rem' }}>
          <div>
            <strong className="km-notice__title">
              {language === 'ml'
                ? `${missingFields.length} ഉത്തരങ്ങൾ ഇനിയും ബാക്കിയുണ്ട്`
                : `${missingFields.length} ${missingFields.length === 1 ? 'answer is' : 'answers are'} still missing`}
            </strong>
            {missingFields.map((f) => f.label).join(', ')}
          </div>
        </div>
      )}

      {/* Answers, read as one document */}
      <div className="km-review-list" style={{ marginTop: '1.25rem' }}>
        {fields.map((field, index) => {
          const val = answers[field.id] ?? answers[field.name];
          const missing = isMissing(field);

          return (
            <div key={field.id} className="km-review-row">
              <div className="km-review-row__main">
                <div className="km-review-row__label">
                  <span className="km-review-row__index">
                    {language === 'ml' ? 'ചോദ്യം' : 'Question'} {index + 1}
                  </span>
                  <span className="km-review-row__field">{field.label}</span>
                  {field.required && (
                    <span className="km-review-row__required">
                      {language === 'ml' ? 'ആവശ്യമാണ്' : 'Required'}
                    </span>
                  )}
                </div>
                <div
                  className={`km-review-row__value${missing ? ' km-review-row__value--missing' : ''}`}
                >
                  {getDisplayValue(field, val)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onEditField(index)}
                aria-label={
                  language === 'ml'
                    ? `${field.label} തിരുത്തുക`
                    : `Edit ${field.label}`
                }
                className="km-btn km-btn--secondary km-btn--sm km-review-row__edit"
              >
                <Pencil size={14} aria-hidden="true" />
                <span>{language === 'ml' ? 'തിരുത്തുക' : 'Edit'}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* What the transfer will and will not do */}
      <p className="km-sub" style={{ marginTop: '1.25rem' }}>
        {language === 'ml'
          ? 'കൈമാറ്റം: ഉത്തരങ്ങൾ യഥാർത്ഥ പേജിലെ കോളങ്ങളിൽ മാത്രം നിറയ്ക്കും. ഫോം സമർപ്പിക്കുന്നത് നിങ്ങൾ മാത്രമാണ്.'
          : 'On transfer, answers are filled into the original page controls. Vazhika never submits the form — that stays with you.'}
      </p>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginTop: '1.25rem',
        }}
      >
        <button
          type="button"
          onClick={onBackToGuided}
          className="km-btn km-btn--secondary"
          style={{ flex: '1 1 180px' }}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>{language === 'ml' ? 'ചോദ്യങ്ങളിലേക്ക് മടങ്ങുക' : 'Back to questions'}</span>
        </button>

        <button
          type="button"
          onClick={onConfirmTransfer}
          disabled={isTransferring}
          className="km-btn km-btn--primary"
          style={{ flex: '2 1 260px' }}
        >
          <span>
            {isTransferring
              ? language === 'ml'
                ? 'കൈമാറുന്നു...'
                : 'Transferring answers…'
              : language === 'ml'
                ? 'വെബ്‌പേജിലേക്ക് ഉത്തരങ്ങൾ മാറ്റുക'
                : 'Transfer Answers to Webpage'}
          </span>
          {!isTransferring && <ArrowRight size={16} className="km-btn__icon--end" aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
};
