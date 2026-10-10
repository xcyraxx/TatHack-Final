import { FormInspectionReport, FieldDefinition } from '../../types';

export interface ChecklistDocument {
  id: string;
  title: {
    en: string;
    ml: string;
  };
  description: {
    en: string;
    ml: string;
  };
  category: 'identity' | 'income' | 'community' | 'banking' | 'residence' | 'photo' | 'signature' | 'property' | 'file';
  required: boolean;
  source: 'upload_field' | 'reference';
  fileFieldName?: string;
  matchedKeywords: string[];
}

interface PatternRule {
  id: string;
  category: ChecklistDocument['category'];
  title: { en: string; ml: string };
  description: { en: string; ml: string };
  keywords: string[];
}

const DOCUMENT_PATTERNS: PatternRule[] = [
  {
    id: 'doc-aadhaar',
    category: 'identity',
    title: {
      en: 'Aadhaar Card',
      ml: 'ആധാർ കാർഡ്',
    },
    description: {
      en: '12-digit Unique Identification document or masked copy.',
      ml: '12 അക്ക ആധാർ കാർഡിന്റെ പകർപ്പ് അല്ലെങ്കിൽ ഒറിജിനൽ വിവരങ്ങൾ.',
    },
    keywords: ['aadhaar', 'aadhar', 'uidai', 'uid', 'ആധാർ'],
  },
  {
    id: 'doc-ration',
    category: 'identity',
    title: {
      en: 'Ration Card',
      ml: 'റേഷൻ കാർഡ്',
    },
    description: {
      en: 'Civil supplies family ration card (APL / BPL / AAY).',
      ml: 'കുടുംബത്തിന്റെ റേഷൻ കാർഡ് (എ.പി.എൽ / ബി.പി.എൽ / എ.എ.വൈ).',
    },
    keywords: ['ration card', 'rationcard', 'ration_card', 'റേഷൻ കാർഡ്', 'റേഷൻ'],
  },
  {
    id: 'doc-income',
    category: 'income',
    title: {
      en: 'Income Certificate',
      ml: 'വരുമാന സർട്ടിഫിക്കറ്റ്',
    },
    description: {
      en: 'Valid revenue authority certificate for the current financial year.',
      ml: 'വില്ലേജ് ഓഫീസിൽ നിന്നോ റവന്യൂ വകുപ്പിൽ നിന്നോ ലഭിച്ച വരുമാന സർട്ടിഫിക്കറ്റ്.',
    },
    keywords: ['income certificate', 'annual income', 'family income', 'വരുമാന സർട്ടിഫിക്കറ്റ്', 'വരുമാനം'],
  },
  {
    id: 'doc-caste',
    category: 'community',
    title: {
      en: 'Caste / Community Certificate',
      ml: 'ജാതി / കമ്മ്യൂണിറ്റി സർട്ടിഫിക്കറ്റ്',
    },
    description: {
      en: 'Certificate proving community or category for reservation benefits.',
      ml: 'സംവരണാനുകൂല്യങ്ങൾക്കായി തഹസിൽദാർ അല്ലെങ്കിൽ വില്ലേജ് ഓഫീസർ നൽകിയ ജാതി സർട്ടിഫിക്കറ്റ്.',
    },
    keywords: ['caste certificate', 'community certificate', 'non-creamy layer', 'ജാതി സർട്ടിഫിക്കറ്റ്', 'ജാതി'],
  },
  {
    id: 'doc-nativity',
    category: 'residence',
    title: {
      en: 'Nativity / Residential Certificate',
      ml: 'താമസസ്ഥല സർട്ടിഫിക്കറ്റ്',
    },
    description: {
      en: 'Proof of domicile or local residence in the respective taluk/village.',
      ml: 'നിശ്ചിത താലൂക്കിലോ വില്ലേജിലോ സ്ഥിരതാമസക്കാരനാണെന്ന് തെളിയിക്കുന്ന രേഖ.',
    },
    keywords: ['nativity', 'residential certificate', 'domicile', 'residence proof', 'താമസസ്ഥല സർട്ടിഫിക്കറ്റ്', 'വാസസ്ഥലം'],
  },
  {
    id: 'doc-bank',
    category: 'banking',
    title: {
      en: 'Bank Passbook / Details',
      ml: 'ബാങ്ക് പാസ്ബുക്ക്',
    },
    description: {
      en: 'Passbook front page copy with Account Number and IFSC clearly visible.',
      ml: 'അക്കൗണ്ട് നമ്പർ, IFSC കോഡ് എന്നിവ വ്യക്തമായി രേഖപ്പെടുത്തിയ ബാങ്ക് പാസ്ബുക്ക്.',
    },
    keywords: ['bank passbook', 'bank account', 'cancelled cheque', 'ifsc', 'ബാങ്ക് പാസ്ബുക്ക്', 'ബാങ്ക് അക്കൗണ്ട്'],
  },
  {
    id: 'doc-photo',
    category: 'photo',
    title: {
      en: 'Passport Size Photograph',
      ml: 'പാസ്‌പോർട്ട് സൈസ് ഫോട്ടോ',
    },
    description: {
      en: 'Recent passport photo with light background, preferably under 200 KB.',
      ml: 'വെള്ള പശ്ചാത്തലത്തിലുള്ള സമീപകാലത്തെ കളർ പാസ്‌പോർട്ട് ഫോട്ടോ.',
    },
    keywords: ['passport photo', 'photograph', 'photo', 'ഫോട്ടോ', 'പാസ്പോർട്ട്'],
  },
  {
    id: 'doc-signature',
    category: 'signature',
    title: {
      en: 'Applicant Signature Scan',
      ml: 'അപേക്ഷകന്റെ ഒപ്പ്',
    },
    description: {
      en: 'Clean signature on white paper using dark black or blue ink.',
      ml: 'വെള്ള പേപ്പറിൽ കറുപ്പോ നീലയോ മഷിയിൽ ഇട്ട ഒപ്പിന്റെ സ്കാൻ ചെയ്ത പകർപ്പ്.',
    },
    keywords: ['signature', 'specimen signature', 'sign', 'thumb impression', 'ഒപ്പ്'],
  },
  {
    id: 'doc-sslc',
    category: 'identity',
    title: {
      en: 'SSLC / 10th Certificate',
      ml: 'എസ്.എസ്.എൽ.സി സർട്ടിഫിക്കറ്റ്',
    },
    description: {
      en: '10th standard certificate for date of birth verification and education.',
      ml: 'ജനനത്തീയതിയും വിദ്യാഭ്യാസ യോഗ്യതയും തെളിയിക്കുന്ന പത്താം ക്ലാസ് സർട്ടിഫിക്കറ്റ്.',
    },
    keywords: ['sslc', '10th marklist', 'matriculation', 'എസ്.എസ്.എൽ.സി'],
  },
  {
    id: 'doc-land',
    category: 'property',
    title: {
      en: 'Land Tax Receipt',
      ml: 'കരം ഒടുക്കിയ രസീത്',
    },
    description: {
      en: 'Latest land revenue tax payment receipt with Thandapper number.',
      ml: 'നടപ്പ് സാമ്പത്തിക വർഷത്തെ ഭൂനികുതി / കരം ഒടുക്കിയ ഏറ്റവും പുതിയ രസീത്.',
    },
    keywords: ['land tax', 'thandapper', 'tax receipt', 'കരം', 'ഭൂനികുതി'],
  },
];

/**
 * Scans a form element and its surrounding page text to discover
 * upload controls and required document references.
 */
export function detectDocumentRequirements(
  formElement?: HTMLElement | null,
  report?: FormInspectionReport | null
): ChecklistDocument[] {
  const detectedMap = new Map<string, ChecklistDocument>();

  // 1. Scan from DOM if available
  if (formElement && typeof document !== 'undefined') {
    // Find explicit file inputs
    const fileInputs = Array.from(formElement.querySelectorAll<HTMLInputElement>('input[type="file"]'));
    fileInputs.forEach((fileInput, index) => {
      const id = fileInput.id || fileInput.name || `file-${index + 1}`;
      const labelEl = formElement.querySelector(`label[for="${CSS.escape(fileInput.id)}"]`);
      const labelText =
        labelEl?.textContent?.trim() ||
        fileInput.getAttribute('aria-label') ||
        fileInput.name ||
        'Document Upload';

      const isRequired = fileInput.required || fileInput.getAttribute('aria-required') === 'true';

      // Check if it matches any known pattern
      const matchedPattern = DOCUMENT_PATTERNS.find((p) =>
        p.keywords.some((kw) => labelText.toLowerCase().includes(kw))
      );

      if (matchedPattern) {
        detectedMap.set(matchedPattern.id, {
          id: matchedPattern.id,
          title: matchedPattern.title,
          description: matchedPattern.description,
          category: matchedPattern.category,
          required: isRequired,
          source: 'upload_field',
          fileFieldName: labelText,
          matchedKeywords: [labelText],
        });
      } else {
        detectedMap.set(`custom-${id}`, {
          id: `custom-${id}`,
          title: {
            en: labelText,
            ml: `${labelText} (അപ്‌ലോഡ് ചെയ്യേണ്ട രേഖ)`,
          },
          description: {
            en: 'Required digital attachment for this form.',
            ml: 'ഈ ഫോമിനൊപ്പം ചേർക്കേണ്ട രേഖ.',
          },
          category: 'file',
          required: isRequired,
          source: 'upload_field',
          fileFieldName: labelText,
          matchedKeywords: [labelText],
        });
      }
    });

    // Scan page text / instructions for document mentions
    const textContext = (formElement.innerText || formElement.textContent || '').toLowerCase();
    DOCUMENT_PATTERNS.forEach((pattern) => {
      if (detectedMap.has(pattern.id)) return;
      const matched = pattern.keywords.some((kw) => textContext.includes(kw));
      if (matched) {
        detectedMap.set(pattern.id, {
          id: pattern.id,
          title: pattern.title,
          description: pattern.description,
          category: pattern.category,
          required: true,
          source: 'reference',
          matchedKeywords: pattern.keywords.filter((kw) => textContext.includes(kw)),
        });
      }
    });
  }

  // 2. Scan from inspection report fields
  if (report?.fields) {
    report.fields.forEach((field) => {
      const textToSearch = `${field.label} ${field.name} ${field.questionText} ${field.explanation.en} ${field.explanation.ml}`.toLowerCase();
      
      DOCUMENT_PATTERNS.forEach((pattern) => {
        if (detectedMap.has(pattern.id)) return;
        const matched = pattern.keywords.some((kw) => textToSearch.includes(kw));
        if (matched) {
          detectedMap.set(pattern.id, {
            id: pattern.id,
            title: pattern.title,
            description: pattern.description,
            category: pattern.category,
            required: field.required,
            source: field.type === 'file' ? 'upload_field' : 'reference',
            matchedKeywords: pattern.keywords.filter((kw) => textToSearch.includes(kw)),
          });
        }
      });
    });
  }

  return Array.from(detectedMap.values());
}
