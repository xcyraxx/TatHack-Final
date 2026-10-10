import React, { useState, useEffect } from 'react';
import { FormInspectionReport, TransferResult, FieldDefinition, FieldOption } from '../../types';
import { FieldRenderer } from './FieldRenderer';
import { ReviewScreen } from '../review-screen/ReviewScreen';
import { CompletionScreen } from '../review-screen/CompletionScreen';
import { validateFieldValue, ValidationError } from '../../modules/validation-engine';
import { saveDraft, loadDraft, clearDraft } from '../../modules/draft-storage';
import { useAccessibility } from '../../modules/accessibility-controls/AccessibilityProvider';
import { speechService } from '../../modules/speech-service';
import { VazhikaMark } from '../VazhikaMark';
import { ArrowLeft, ArrowRight, X, FileCheck2, Shield } from 'lucide-react';
import { normalizeDateToYMD } from '../../modules/date-formatter';
import { detectDocumentRequirements, ChecklistDocument } from '../../modules/document-checklist';
import { DocumentChecklistScreen } from '../document-checklist/DocumentChecklistScreen';
import { civicWallet } from '../../modules/civic-wallet';

interface Props {
  report: FormInspectionReport;
  onHighlightField?: (selector: string, fieldId: string) => void;
  onClearHighlight?: () => void;
  onTransferAnswers: (answers: Record<string, any>) => Promise<TransferResult>;
  onSyncSingleField?: (field: FieldDefinition, value: any) => Promise<void> | void;
  onRefreshFieldOptions?: (field: FieldDefinition) => Promise<FieldOption[] | null>;
  onExit?: () => void;
  initialFieldId?: string;
}

export const GuidedWorkflow: React.FC<Props> = ({
  report,
  onHighlightField,
  onClearHighlight,
  onTransferAnswers,
  onSyncSingleField,
  onRefreshFieldOptions,
  onExit,
  initialFieldId,
}) => {
  const { fields, formId, formTitle } = report;
  const { language, voiceEnabled, announce } = useAccessibility();

  const [detectedDocuments] = useState<ChecklistDocument[]>(() =>
    detectDocumentRequirements(null, report)
  );
  const [showChecklist, setShowChecklist] = useState<boolean>(
    () => !initialFieldId && detectedDocuments.length > 0
  );

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(() => {
    if (initialFieldId) {
      const idx = fields.findIndex((f) => f.id === initialFieldId);
      if (idx !== -1) return idx;
    }
    return 0;
  });
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    fields.forEach((f) => {
      if (f.currentValue !== undefined && f.currentValue !== '') {
        initial[f.id] = f.type === 'date' ? normalizeDateToYMD(f.currentValue) || f.currentValue : f.currentValue;
      }
    });
    return initial;
  });

  const [currentError, setCurrentError] = useState<ValidationError | null>(null);
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  const [transferResult, setTransferResult] = useState<TransferResult | null>(null);
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('just now');
  const [syncedFieldIds, setSyncedFieldIds] = useState<Set<string>>(new Set());

  // Jump to field if initialFieldId changes
  useEffect(() => {
    if (initialFieldId) {
      const idx = fields.findIndex((f) => f.id === initialFieldId);
      if (idx !== -1) {
        setCurrentStepIndex(idx);
        setIsReviewMode(false);
      }
    }
  }, [initialFieldId, fields]);

  // Load draft on mount
  useEffect(() => {
    loadDraft(formId).then((draft) => {
      if (draft && draft.answers) {
        const sanitized: Record<string, any> = { ...draft.answers };
        fields.forEach((f) => {
          if (f.type === 'date' && sanitized[f.id]) {
            sanitized[f.id] = normalizeDateToYMD(sanitized[f.id]) || sanitized[f.id];
          }
        });
        setAnswers((prev) => ({ ...prev, ...sanitized }));
        if (!initialFieldId && typeof draft.currentStepIndex === 'number' && draft.currentStepIndex < fields.length) {
          setCurrentStepIndex(draft.currentStepIndex);
        }
        announce('Draft restored from previous session.');
      }
    });
  }, [formId, initialFieldId, fields]);

  // Save draft whenever answers or step change
  useEffect(() => {
    saveDraft(formId, currentStepIndex, answers);
    setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, [formId, currentStepIndex, answers]);

  const currentField = fields[currentStepIndex];

  // Highlight the corresponding field on the page; speak the question if voice is on
  useEffect(() => {
    if (currentField && !isReviewMode && !transferResult) {
      if (onHighlightField) {
        onHighlightField(currentField.selector, currentField.id);
      }

      if (voiceEnabled) {
        const textToRead = `${currentField.questionText}. ${
          language === 'ml' ? currentField.explanation.ml : currentField.explanation.en
        }`;
        speechService.speak(textToRead, language);
      }

      announce(`Step ${currentStepIndex + 1} of ${fields.length}: ${currentField.questionText}`);
    } else {
      if (onClearHighlight) {
        onClearHighlight();
      }
    }
  }, [currentStepIndex, isReviewMode, transferResult, currentField?.id, voiceEnabled, language]);

  const handleValueChange = (val: any) => {
    if (!currentField) return;
    setAnswers((prev) => ({
      ...prev,
      [currentField.id]: val,
      [currentField.name]: val,
    }));
    if (currentError) {
      setCurrentError(null);
    }
  };

  const handleNext = async () => {
    if (!currentField) return;
    const currentVal = answers[currentField.id] ?? answers[currentField.name];
    const validationError = validateFieldValue(currentField, currentVal, language);

    if (validationError) {
      setCurrentError(validationError);
      announce(language === 'ml' ? validationError.message.ml : validationError.message.en);
      if (voiceEnabled) {
        speechService.speak(
          language === 'ml' ? validationError.message.ml : validationError.message.en,
          language
        );
      }
      return;
    }

    setCurrentError(null);

    // Live Mirroring: Sync completed field to the live page control immediately
    if (onSyncSingleField && currentVal !== undefined && currentVal !== null && currentVal !== '') {
      try {
        await onSyncSingleField(currentField, currentVal);
        setSyncedFieldIds((prev) => new Set(prev).add(currentField.id));
      } catch (err) {
        console.warn('Live field sync warning:', err);
      }
    }

    if (currentStepIndex < fields.length - 1) {
      const nextIdx = currentStepIndex + 1;
      const nextField = fields[nextIdx];

      // If next field is a select dropdown, check if live page fetched new options (e.g. PIN -> District)
      if (nextField && nextField.type === 'select' && onRefreshFieldOptions) {
        try {
          const freshOptions = await onRefreshFieldOptions(nextField);
          if (freshOptions && freshOptions.length > 0) {
            nextField.options = freshOptions;
          }
        } catch {
          // Keep existing options if refresh fails
        }
      }

      setCurrentStepIndex(nextIdx);
    } else {
      setIsReviewMode(true);
      announce('All questions completed. Welcome to the review screen.');
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentError(null);
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    const target = e.target as HTMLElement;
    const tag = target.tagName;

    // Text areas take a line break; buttons and links keep their native activation.
    if (tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'A') return;

    const isTextLikeInput =
      (tag === 'INPUT' &&
        !['checkbox', 'radio', 'submit', 'button', 'reset', 'file'].includes(
          (target as HTMLInputElement).type
        )) ||
      tag === 'SELECT';

    if (isTextLikeInput) {
      e.preventDefault();
      handleNext();
    }
  };

  const handleConfirmTransfer = async () => {
    setIsTransferring(true);
    try {
      const result = await onTransferAnswers(answers);
      setTransferResult(result);
      announce(`Transfer completed. ${result.transferredCount} fields transferred.`);
      await clearDraft(formId);
    } catch (err: any) {
      alert(`Transfer failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsTransferring(false);
    }
  };

  /* Shared top region: identity, form context, way out */
  const topBar = (
    <div className="km-guided__top">
      <VazhikaMark size={20} />
      <span className="km-wordmark km-wordmark--dark">
        <span className="km-wordmark__name">vazhika</span>
      </span>
      <span className="km-guided__context" title={formTitle}>
        {formTitle}
      </span>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        {detectedDocuments.length > 0 && (
          <button
            type="button"
            className="km-btn km-btn--quiet km-btn--sm"
            onClick={() => setShowChecklist((v) => !v)}
            title={language === 'ml' ? 'ആവശ്യമായ രേഖകളുടെ ചെക്ക്‌ലിസ്റ്റ്' : 'Document Checklist'}
            style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <FileCheck2 size={14} />
            <span>{language === 'ml' ? 'രേഖകൾ' : 'Checklist'} ({detectedDocuments.length})</span>
          </button>
        )}

        <button
          type="button"
          className="km-btn km-btn--quiet km-btn--sm"
          onClick={() => civicWallet.openModal()}
          title={language === 'ml' ? 'സിവിക് വാലറ്റ് പരിശോധിക്കുക' : 'Open Civic Wallet'}
          style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Shield size={14} />
          <span>{language === 'ml' ? 'വാലറ്റ്' : 'Wallet'}</span>
        </button>

        {onExit && (
          <button
            type="button"
            className="km-btn km-btn--quiet km-btn--sm km-guided__exit"
            onClick={onExit}
            aria-label={language === 'ml' ? 'ഗൈഡഡ് മോഡ് വിടുക' : 'Exit guided mode'}
          >
            <X size={15} aria-hidden="true" />
            <span>{language === 'ml' ? 'പുറത്തേക്ക്' : 'Exit'}</span>
          </button>
        )}
      </div>
    </div>
  );

  // Before Step 1: Pre-flight Document Checklist Screen
  if (showChecklist && detectedDocuments.length > 0) {
    return (
      <div className="km-guided">
        {topBar}
        <div className="km-guided__body" style={{ padding: '0.5rem 0' }}>
          <DocumentChecklistScreen
            documents={detectedDocuments}
            onStartWorkflow={() => setShowChecklist(false)}
            onSkip={() => setShowChecklist(false)}
            formTitle={formTitle}
          />
        </div>
      </div>
    );
  }

  // Completion
  if (transferResult) {
    return (
      <div className="km-guided">
        {topBar}
        <div className="km-guided__body">
          <CompletionScreen
            result={transferResult}
            onRestart={() => {
              setTransferResult(null);
              setIsReviewMode(false);
              setCurrentStepIndex(0);
              setAnswers({});
            }}
          />
        </div>
      </div>
    );
  }

  // Review
  if (isReviewMode) {
    return (
      <div className="km-guided">
        {topBar}
        <div className="km-guided__body">
          <ReviewScreen
            fields={fields}
            answers={answers}
            onEditField={(idx) => {
              setCurrentStepIndex(idx);
              setIsReviewMode(false);
            }}
            onBackToGuided={() => setIsReviewMode(false)}
            onConfirmTransfer={handleConfirmTransfer}
            isTransferring={isTransferring}
          />
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(((currentStepIndex + 1) / fields.length) * 100);

  return (
    <div className="km-guided" onKeyDown={handleKeyDown}>
      {topBar}

      {/* Compact progress */}
      <div className="km-guided__progress">
        <div className="km-progress-meta">
          <span className="km-progress-meta__step">
            {language === 'ml'
              ? `ചോദ്യം ${currentStepIndex + 1} / ${fields.length}`
              : `Step ${currentStepIndex + 1} of ${fields.length}`}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {syncedFieldIds.has(currentField?.id) && (
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  color: 'var(--km-success, #216e4e)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                ✓ {language === 'ml' ? 'പേജുമായി സമന്വയിപ്പിച്ചു' : 'Live synced'}
              </span>
            )}
            <span>
              {language === 'ml' ? 'ഡ്രാഫ്റ്റ് സൂക്ഷിച്ചു' : 'Draft saved'} {lastSavedTime}
            </span>
          </div>
        </div>
        <div
          role="progressbar"
          aria-valuenow={currentStepIndex + 1}
          aria-valuemin={1}
          aria-valuemax={fields.length}
          aria-label={language === 'ml' ? 'ഫോം പുരോഗതി' : 'Form completion progress'}
          className="km-progress"
        >
          <div className="km-progress__fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* The question, always in the same position */}
      <div className="km-guided__body">
        {currentField && (
          <div className="km-question-block" key={currentField.id}>
            <FieldRenderer
              field={currentField}
              value={answers[currentField.id] ?? answers[currentField.name]}
              onChange={handleValueChange}
              error={currentError}
              isListening={isListening}
              onListeningChange={setIsListening}
              onOpenWalletModal={() => civicWallet.openModal()}
            />
          </div>
        )}
      </div>

      {/* One way forward, one way back */}
      <div className="km-guided__nav">
        <button
          type="button"
          onClick={handleBack}
          className="km-btn km-btn--secondary"
          disabled={currentStepIndex === 0}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>{language === 'ml' ? 'പിന്നോട്ട്' : 'Back'}</span>
        </button>

        <button type="button" onClick={handleNext} className="km-btn km-btn--primary">
          <span>
            {currentStepIndex === fields.length - 1
              ? language === 'ml'
                ? 'ഉത്തരങ്ങൾ പരിശോധിക്കുക'
                : 'Review answers'
              : language === 'ml'
              ? 'തുടരുക'
              : 'Continue'}
          </span>
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
