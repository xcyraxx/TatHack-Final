import { FieldDefinition, RescueIssue, RescueReport } from '../../types';

/**
 * Common inline error element selectors used across web frameworks
 */
const INLINE_ERROR_SELECTORS = [
  '.error',
  '.err-msg',
  '.field-error',
  '.invalid-feedback',
  '.errorMessage',
  '.text-danger',
  '.form-error',
  '[role="alert"]',
  '.alert-danger',
  '.help-block.error',
];

/**
 * Translates technical / browser validity failures into empathetic plain language
 */
export function getFriendlyErrorExplanation(
  rawError: string,
  fieldType: string,
  fieldLabel: string
): { en: string; ml: string; fixEn: string; fixMl: string } {
  const lower = rawError.toLowerCase();

  // Pattern mismatch / formatting (e.g. Phone, PIN code, PAN, Aadhaar)
  if (lower.includes('pattern') || lower.includes('format') || lower.includes('match the requested format')) {
    if (fieldType === 'tel' || lower.includes('phone') || lower.includes('mobile')) {
      return {
        en: 'The website requires a 10-digit mobile number without country code (+91), spaces, or dashes.',
        ml: 'മൊബൈൽ നമ്പറിൽ +91 അല്ലെങ്കിൽ സ്പേസുകൾ ഇല്ലാതെ കൃത്യമായി 10 അക്കങ്ങൾ ഉണ്ടായിരിക്കണം.',
        fixEn: 'Remove +91, spaces, and hyphens so only 10 digits remain (e.g. 9876543210).',
        fixMl: '+91 ഒഴിവാക്കി 10 അക്കങ്ങൾ മാത്രം നൽകുക (ഉദാ: 9876543210).',
      };
    }
    if (lower.includes('pin') || lower.includes('postal')) {
      return {
        en: 'The postal PIN code must be exactly 6 digits.',
        ml: 'പോസ്റ്റൽ പിൻകോഡ് കൃത്യമായി 6 അക്കങ്ങൾ ആയിരിക്കണം.',
        fixEn: 'Enter your 6-digit postal area code.',
        fixMl: '6 അക്ക പിൻകോഡ് നൽകുക.',
      };
    }
    return {
      en: `The entry does not match the format required for ${fieldLabel || 'this field'}.`,
      ml: `നൽകിയ വിവരങ്ങളുടെ ഫോർമാറ്റ് ശരിയല്ല.`,
      fixEn: 'Check the format instructions and enter the answer without extra symbols.',
      fixMl: 'പ്രത്യേക ചിഹ്നങ്ങൾ ഒഴിവാക്കി ശരിയായ രീതിയിൽ നൽകുക.',
    };
  }

  // Type mismatch (e.g. Email)
  if (lower.includes('type') || lower.includes('email') || lower.includes('valid email')) {
    return {
      en: 'The email address is incomplete or formatted incorrectly.',
      ml: 'ഇമെയിൽ വിലാസം അപൂർണ്ണമാണ് അല്ലെങ്കിൽ ശരിയല്ല.',
      fixEn: 'Make sure your email includes "@" and a domain name (e.g. name@example.com).',
      fixMl: "'@' ചിഹ്നവും ഡൊമെയ്നും ഉള്ള ഇമെയിൽ നൽകുക (ഉദാ: name@example.com).",
    };
  }

  // Value missing / Required
  if (lower.includes('fill out this field') || lower.includes('required') || lower.includes('mandatory') || lower.includes('empty')) {
    return {
      en: `This question is required by the portal. You cannot leave it blank.`,
      ml: `ഈ ചോദ്യത്തിന് നിർബന്ധമായും ഉത്തരം നൽകേണ്ടതുണ്ട്.`,
      fixEn: `Provide an answer for ${fieldLabel || 'this question'} to continue.`,
      fixMl: `തുടരുന്നതിനായി ഈ കോളത്തിൽ വിവരം രേഖപ്പെടുത്തുക.`,
    };
  }

  // Value too short or long
  if (lower.includes('short') || lower.includes('characters')) {
    return {
      en: `The text you entered is too short for the portal's rules.`,
      ml: `നൽകിയ വിവരങ്ങൾ ആവശ്യമുള്ളതിലും കുറവാണ്.`,
      fixEn: 'Enter more characters or details to meet the minimum length.',
      fixMl: 'കൂടുതൽ വിവരങ്ങൾ നൽകുക.',
    };
  }

  // Default fallback
  return {
    en: rawError || `The portal rejected the answer for ${fieldLabel || 'this field'}.`,
    ml: rawError || `ഈ കോളത്തിലെ ഉത്തരം വെബ്സൈറ്റ് നിരസിച്ചു.`,
    fixEn: 'Review the answer and correct any typing mistakes.',
    fixMl: 'ഉത്തരം പരിശോധിച്ച് തെറ്റുകൾ തിരുത്തുക.',
  };
}

/**
 * Scans the live DOM of the target form to detect rejected/invalid fields
 */
export function detectFormValidationErrors(
  formElement: HTMLElement | null,
  knownFields: FieldDefinition[] = []
): RescueReport {
  if (!formElement) {
    return {
      hasErrors: false,
      issues: [],
      totalErrors: 0,
      detectedAt: new Date().toISOString(),
    };
  }

  const issues: RescueIssue[] = [];
  const processedElements = new Set<Element>();

  // 1. Check HTML5 validity & aria-invalid on input elements
  const controls = Array.from(formElement.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    'input, select, textarea'
  ));

  for (const control of controls) {
    let isInvalid = false;
    let rawError = '';

    // Check native HTML5 validity
    if (control.validity && !control.validity.valid) {
      isInvalid = true;
      rawError = control.validationMessage || '';
    }

    // Check aria-invalid
    if (control.getAttribute('aria-invalid') === 'true') {
      isInvalid = true;
    }

    // Check class names (e.g. is-invalid, has-error)
    const classList = control.className || '';
    if (classList.includes('is-invalid') || classList.includes('error') || classList.includes('invalid')) {
      isInvalid = true;
    }

    // Check associated error message containers via aria-describedby or aria-errormessage
    const describedBy = control.getAttribute('aria-describedby') || control.getAttribute('aria-errormessage');
    if (describedBy) {
      const errorIds = describedBy.split(/\s+/);
      for (const eid of errorIds) {
        const errorEl = document.getElementById(eid);
        if (errorEl && errorEl.textContent?.trim()) {
          rawError = rawError || errorEl.textContent.trim();
          isInvalid = true;
        }
      }
    }

    // Check immediate siblings / parent container for inline error text
    if (!rawError && control.parentElement) {
      for (const sel of INLINE_ERROR_SELECTORS) {
        const errNode = control.parentElement.querySelector(sel);
        if (errNode && errNode !== control && errNode.textContent?.trim()) {
          rawError = errNode.textContent.trim();
          isInvalid = true;
          break;
        }
      }
    }

    if (isInvalid) {
      processedElements.add(control);

      // Match with known FieldDefinition
      const matchedField = knownFields.find((f) => {
        if (control.id && (f.originalId === control.id || f.id === control.id)) return true;
        if (control.name && f.name === control.name) return true;
        return false;
      });

      const label = matchedField?.label || control.getAttribute('aria-label') || control.name || control.id || 'Field';
      const fieldId = matchedField?.id || control.id || control.name || `field-${issues.length + 1}`;
      const fieldName = matchedField?.name || control.name || control.id || fieldId;
      const selector = matchedField?.selector || (control.id ? `#${control.id}` : `[name="${control.name}"]`);
      const type = matchedField?.type || (control.type as any) || 'text';

      const friendly = getFriendlyErrorExplanation(rawError || 'Input rejected by website validation.', type, label);

      issues.push({
        fieldId,
        fieldName,
        label,
        selector,
        rawError: rawError || 'Website rejected this answer.',
        friendlyExplanation: {
          en: friendly.en,
          ml: friendly.ml,
        },
        currentValue: control.value,
        suggestedFix: {
          en: friendly.fixEn,
          ml: friendly.fixMl,
        },
      });
    }
  }

  // 2. Also check for standalone banner alerts in the form (e.g. "Please fix the following 2 errors")
  const alertContainers = Array.from(formElement.querySelectorAll('[role="alert"], .alert-danger, .error-summary'));
  for (const alert of alertContainers) {
    if (!processedElements.has(alert) && alert.textContent?.trim() && issues.length === 0) {
      // General form failure detected without specific input mapped
      issues.push({
        fieldId: 'form-general-error',
        fieldName: 'submission_error',
        label: 'Form Submission Rejected',
        selector: 'form',
        rawError: alert.textContent.trim(),
        friendlyExplanation: {
          en: 'The website rejected your submission: ' + alert.textContent.trim(),
          ml: 'വെബ്സൈറ്റ് നിങ്ങളുടെ അപേക്ഷ നിരസിച്ചു: ' + alert.textContent.trim(),
        },
        currentValue: null,
        suggestedFix: {
          en: 'Review the highlighted issues above and verify all required documents.',
          ml: 'മുകളിൽ നൽകിയിട്ടുള്ള വിവരങ്ങൾ ശരിയാണെന്ന് വീണ്ടും പരിശോധിക്കുക.',
        },
      });
    }
  }

  return {
    hasErrors: issues.length > 0,
    issues,
    totalErrors: issues.length,
    detectedAt: new Date().toISOString(),
  };
}
