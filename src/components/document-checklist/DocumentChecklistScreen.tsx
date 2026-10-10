import React, { useState } from 'react';
import { ChecklistDocument } from '../../modules/document-checklist';
import { useAccessibility } from '../../modules/accessibility-controls/AccessibilityProvider';
import { speechService } from '../../modules/speech-service';
import {
  FileCheck2,
  FileText,
  CreditCard,
  Building2,
  Image,
  PenTool,
  Check,
  Volume2,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface Props {
  documents: ChecklistDocument[];
  onStartWorkflow: () => void;
  onSkip?: () => void;
  formTitle?: string;
}

export const DocumentChecklistScreen: React.FC<Props> = ({
  documents,
  onStartWorkflow,
  onSkip,
  formTitle,
}) => {
  const { language, announce } = useAccessibility();
  const ml = language === 'ml';

  const [readyDocs, setReadyDocs] = useState<Record<string, boolean>>({});

  const toggleDoc = (id: string) => {
    setReadyDocs((prev) => {
      const nextVal = !prev[id];
      const doc = documents.find((d) => d.id === id);
      const titleText = doc ? (ml ? doc.title.ml : doc.title.en) : id;
      announce(
        nextVal
          ? ml
            ? `${titleText}: തയ്യാറാണെന്ന് അടയാളപ്പെടുത്തി`
            : `${titleText} marked as ready`
          : ml
          ? `${titleText}: തയ്യാറല്ല എന്ന് മാറ്റി`
          : `${titleText} unmarked`
      );
      return { ...prev, [id]: nextVal };
    });
  };

  const readyCount = documents.filter((d) => readyDocs[d.id]).length;
  const allReady = documents.length > 0 && readyCount === documents.length;

  const readDocAloud = (doc: ChecklistDocument) => {
    const text = `${ml ? doc.title.ml : doc.title.en}. ${ml ? doc.description.ml : doc.description.en}`;
    speechService.speak(text, language);
  };

  const getDocIcon = (category: ChecklistDocument['category']) => {
    switch (category) {
      case 'identity':
        return <CreditCard size={18} className="km-icon" aria-hidden="true" />;
      case 'banking':
        return <Building2 size={18} className="km-icon" aria-hidden="true" />;
      case 'photo':
        return <Image size={18} className="km-icon" aria-hidden="true" />;
      case 'signature':
        return <PenTool size={18} className="km-icon" aria-hidden="true" />;
      default:
        return <FileText size={18} className="km-icon" aria-hidden="true" />;
    }
  };

  return (
    <div className="km-checklist-screen" style={{ padding: '1.25rem', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div
        style={{
          borderLeft: '4px solid var(--km-forest)',
          paddingLeft: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <span
            style={{
              backgroundColor: 'var(--km-mint)',
              color: 'var(--km-forest)',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {ml ? 'ഘട്ടം 1-ന് മുമ്പ്' : 'Before Step 1'}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--km-text-muted)' }}>
            {documents.length} {ml ? 'രേഖകൾ ആവശ്യമാണ്' : 'documents needed'}
          </span>
        </div>

        <h2 className="km-title" style={{ margin: 0, fontSize: '1.35rem', color: 'var(--km-forest)' }}>
          {ml ? 'ആരംഭിക്കുന്നതിന് മുമ്പ് കരുതേണ്ട രേഖകൾ' : 'Documents Checklist: Have These Ready'}
        </h2>
        <p className="km-sub" style={{ marginTop: '0.35rem', fontSize: '0.875rem' }}>
          {ml
            ? 'ഫോം പൂരിപ്പിക്കൽ പകുതിയാകുമ്പോൾ മുടങ്ങാതിരിക്കാൻ താഴെ പറയുന്ന രേഖകൾ ഇപ്പോൾ തന്നെ കൈവശം വെക്കുക.'
            : 'Gather these documents now so you can complete your application in one sitting without abandoning halfway.'}
        </p>
      </div>

      {/* Progress pill */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--km-warm-white)',
          padding: '0.6rem 0.85rem',
          borderRadius: '8px',
          border: '1px solid var(--km-border)',
          marginBottom: '1.25rem',
        }}
      >
        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
          {ml ? 'തയ്യാറാക്കിയ രേഖകൾ:' : 'Prepared so far:'}{' '}
          <strong style={{ color: readyCount > 0 ? 'var(--km-success)' : 'inherit' }}>
            {readyCount} / {documents.length}
          </strong>
        </span>

        {allReady ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              color: 'var(--km-success)',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            <Check size={14} />
            {ml ? 'എല്ലാം തയ്യാറാണ്!' : 'All items ready!'}
          </span>
        ) : (
          <span style={{ fontSize: '0.78rem', color: 'var(--km-text-muted)' }}>
            {ml ? 'കൈവശമുള്ളവ ടിക്ക് ചെയ്യുക' : 'Check items you have ready'}
          </span>
        )}
      </div>

      {/* Document items list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.75rem' }}>
        {documents.map((doc, idx) => {
          const isReady = Boolean(readyDocs[doc.id]);

          return (
            <div
              key={doc.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                border: isReady ? '1px solid var(--km-success)' : '1px solid var(--km-border)',
                backgroundColor: isReady ? 'var(--km-success-surface)' : 'var(--km-white)',
                transition: 'all 0.15s ease-in-out',
              }}
            >
              {/* Checkbox */}
              <button
                type="button"
                onClick={() => toggleDoc(doc.id)}
                aria-pressed={isReady}
                aria-label={`${ml ? doc.title.ml : doc.title.en} - ${isReady ? (ml ? 'തയ്യാറാണ്' : 'Ready') : (ml ? 'തയ്യാറല്ല' : 'Not ready')}`}
                style={{
                  marginTop: '2px',
                  width: '22px',
                  height: '22px',
                  borderRadius: '5px',
                  border: isReady ? '2px solid var(--km-success)' : '2px solid var(--km-border-strong)',
                  backgroundColor: isReady ? 'var(--km-success)' : 'transparent',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  padding: 0,
                }}
              >
                {isReady && <Check size={14} strokeWidth={3} />}
              </button>

              {/* Document details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--km-forest)', display: 'inline-flex', alignItems: 'center' }}>
                    {getDocIcon(doc.category)}
                  </span>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--km-text-primary)' }}>
                    {ml ? doc.title.ml : doc.title.en}
                  </strong>

                  {doc.source === 'upload_field' && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        backgroundColor: 'var(--km-mint)',
                        color: 'var(--km-deep-forest)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontWeight: 600,
                      }}
                    >
                      {ml ? 'ഡിജിറ്റൽ അപ്‌ലോഡ്' : 'File Upload'}
                    </span>
                  )}
                </div>

                <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--km-text-muted)', lineHeight: 1.4 }}>
                  {ml ? doc.description.ml : doc.description.en}
                </p>
              </div>

              {/* Speaker Readout */}
              <button
                type="button"
                onClick={() => readDocAloud(doc)}
                className="km-btn km-btn--quiet km-btn--sm km-btn--icon"
                style={{ flexShrink: 0, color: 'var(--km-forest)' }}
                aria-label={ml ? 'ഈ വിവരണം വായിക്കുക' : 'Read requirement aloud'}
                title={ml ? 'വായിക്കുക' : 'Read aloud'}
              >
                <Volume2 size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Helpful advice */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.65rem 0.85rem',
          backgroundColor: 'var(--km-warm-white)',
          borderRadius: '6px',
          border: '1px solid var(--km-border)',
          fontSize: '0.8rem',
          color: 'var(--km-text-muted)',
          marginBottom: '1.75rem',
        }}
      >
        <AlertCircle size={15} style={{ flexShrink: 0, color: 'var(--km-forest)' }} />
        <span>
          {ml
            ? 'ഫയലുകൾ PDF അല്ലെങ്കിൽ JPG ഫോർമാറ്റിലും 2MB-ൽ താഴെയും സൂക്ഷിക്കുന്നത് അപ്‌ലോഡ് എളുപ്പമാക്കും.'
            : 'Pro-tip: Scan or photograph certificates in clear PDF or JPG format under 2MB each for seamless upload.'}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'flex-end' }}>
        {onSkip && (
          <button type="button" onClick={onSkip} className="km-btn km-btn--secondary">
            <span>{ml ? 'ചെക്ക്‌ലിസ്റ്റ് ഒഴിവാക്കുക' : 'Skip Checklist'}</span>
          </button>
        )}

        <button type="button" onClick={onStartWorkflow} className="km-btn km-btn--primary">
          <span>{ml ? 'എല്ലാം തയ്യാറാണ്, ചോദ്യങ്ങളിലേക്ക്' : "I'm Ready, Start Step 1"}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
