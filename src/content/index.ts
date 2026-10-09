import { inspectFormElement, isDataField } from '../modules/form-inspector';
import { evaluateSecurity } from '../modules/security-guard';
import { detectFormValidationErrors } from '../modules/rescue-loop';
import { normalizeDateToYMD } from '../modules/date-formatter';
import { ExtensionMessage, FieldTransferFailure, FormInspectionReport, TransferResult } from '../types';

let currentHighlightedElement: HTMLElement | null = null;
let lastInspectionReport: FormInspectionReport | null = null;

/**
 * Finds the primary real data-collection form on the current webpage
 * Excludes search bars, navigation inputs, and random page interactivity.
 */
function findTargetForm(): HTMLElement | null {
  // 1. If the user currently has an input or textarea focused, prioritize that specific form!
  const activeEl = document.activeElement as HTMLElement | null;
  if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT' || activeEl.tagName === 'TEXTAREA')) {
    const activeForm = activeEl.closest('form');
    if (activeForm) return activeForm;
    const activeContainer = activeEl.closest('main, [role="main"], article, section, .form-container, .card, dialog, [class*="form"]');
    if (activeContainer && activeContainer !== document.body) {
      return activeContainer as HTMLElement;
    }
  }

  // 2. Discover all <form> elements on page
  const forms = Array.from(document.querySelectorAll('form'));

  if (forms.length > 0) {
    // Score each form based on genuine data-collection controls
    const scoredForms = forms.map((form) => {
      const inputs = Array.from(form.querySelectorAll<HTMLElement>('input, select, textarea')).filter((el) =>
        isDataField(el)
      );

      let score = inputs.length * 10;

      // Heavy penalty for search forms or navigation forms
      const formRole = (form.getAttribute('role') || '').toLowerCase();
      const formId = (form.id || '').toLowerCase();
      const formClass = (form.className || '').toLowerCase();
      const formAction = (form.getAttribute('action') || '').toLowerCase();

      if (
        formRole === 'search' ||
        formId.includes('search') ||
        formClass.includes('search') ||
        formAction.includes('search')
      ) {
        score -= 50;
      }

      // Penalty if nested inside navigation or banner header/footer
      if (form.closest('header, nav, footer, aside, [role="banner"], [role="navigation"], [role="contentinfo"]')) {
        score -= 40;
      }

      // Bonus if form has a submit button or application/registration fields
      if (form.querySelector('button[type="submit"], input[type="submit"], .btn-submit, [class*="submit"]')) {
        score += 20;
      }

      const hasAppField = inputs.some((i) => {
        const name = ((i as any).name || (i as any).id || '').toLowerCase();
        return (
          name.includes('name') ||
          name.includes('email') ||
          name.includes('phone') ||
          name.includes('address') ||
          name.includes('dob') ||
          name.includes('user') ||
          name.includes('pass')
        );
      });

      if (hasAppField) {
        score += 30;
      }

      return { form, score, inputCount: inputs.length };
    });

    // Pick form with highest score that has at least 1 real data input
    const validForms = scoredForms.filter((f) => f.inputCount > 0 && f.score > 0);
    if (validForms.length > 0) {
      validForms.sort((a, b) => b.score - a.score);
      return validForms[0].form;
    }
  }

  // 3. Fallback: If no <form> tag exists (e.g. single page applications using <div> containers)
  // Look for a cohesive container with at least 2 data inputs
  const candidateContainers = Array.from(
    document.querySelectorAll<HTMLElement>(
      'main, [role="main"], article, section, .form-container, .card, dialog, [class*="form"], [id*="form"], [class*="register"], [id*="register"]'
    )
  );

  let bestContainer: HTMLElement | null = null;
  let bestScore = 0;

  for (const container of candidateContainers) {
    if (container === document.body) continue;
    if (container.closest('header, nav, footer, aside, [role="banner"], [role="navigation"], [role="contentinfo"]')) {
      continue;
    }

    const dataInputs = Array.from(container.querySelectorAll<HTMLElement>('input, select, textarea')).filter((el) =>
      isDataField(el)
    );

    // Require at least 2 real fields to avoid treating a random single button or input as a form
    if (dataInputs.length >= 2) {
      const score = dataInputs.length * 10;
      if (score > bestScore) {
        bestScore = score;
        bestContainer = container;
      }
    }
  }

  return bestContainer;
}

/**
 * Scans page and generates structured inspection report
 */
function scanPage(): FormInspectionReport | null {
  const target = findTargetForm();
  if (!target) return null;

  const report = inspectFormElement(target, window.location.href);

  // Feature 1: Scam & Phishing Guard evaluation
  report.securityReport = evaluateSecurity(window.location.href, target);

  // Feature 2: Rescue Loop active error detection
  report.rescueReport = detectFormValidationErrors(target, report.fields);

  lastInspectionReport = report;
  return report;
}

/**
 * Highlights a field on the live webpage
 */
function highlightField(selector: string, fieldId: string) {
  clearHighlight();

  let target: HTMLElement | null = null;
  if (selector) {
    try {
      target = document.querySelector(selector);
    } catch {
      // Ignore selector syntax error
    }
  }

  if (!target && fieldId) {
    target =
      document.getElementById(fieldId) ||
      document.querySelector(`[data-vazhika-id="${fieldId}"]`) ||
      document.querySelector(`[name="${fieldId}"]`);
  }

  if (target) {
    currentHighlightedElement = target;
    target.setAttribute('data-vazhika-active', 'true');
    target.style.outline = '3px solid #123B35';
    target.style.outlineOffset = '4px';
    target.style.boxShadow = '0 0 0 6px #D9F3E5';
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function clearHighlight() {
  if (currentHighlightedElement) {
    currentHighlightedElement.removeAttribute('data-vazhika-active');
    currentHighlightedElement.style.outline = '';
    currentHighlightedElement.style.outlineOffset = '';
    currentHighlightedElement.style.boxShadow = '';
    currentHighlightedElement = null;
  }
  document.querySelectorAll('[data-vazhika-active]').forEach((el) => {
    const htmlEl = el as HTMLElement;
    htmlEl.removeAttribute('data-vazhika-active');
    htmlEl.style.outline = '';
    htmlEl.style.outlineOffset = '';
    htmlEl.style.boxShadow = '';
  });
}

/**
 * Framework-aware input value setting (supports React controlled components)
 */
function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  // If target element is an HTML5 date input, guarantee yyyy-MM-dd format to avoid browser validation warning
  if (element instanceof HTMLInputElement && element.type === 'date') {
    value = normalizeDateToYMD(value);
  }

  const prototype =
    element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const nativeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

  if (nativeValueSetter) {
    nativeValueSetter.call(element, value);
  } else {
    element.value = value;
  }

  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new Event('blur', { bubbles: true }));
}

/**
 * Transfers guided answers back to the original form
 */
function fillFields(answers: Record<string, any>): TransferResult {
  let transferredCount = 0;
  const failedFields: FieldTransferFailure[] = [];

  if (!lastInspectionReport) {
    scanPage();
  }

  const fields = lastInspectionReport?.fields || [];
  const totalFields = fields.length;

  for (const field of fields) {
    const value = answers[field.id] !== undefined ? answers[field.id] : answers[field.name];

    if (value === undefined || value === null || value === '') {
      continue;
    }

    try {
      if (field.type === 'radio') {
        const radios = document.querySelectorAll<HTMLInputElement>(
          `input[type="radio"][name="${CSS.escape(field.name)}"]`
        );
        let found = false;
        radios.forEach((r) => {
          if (r.value === String(value)) {
            r.checked = true;
            r.dispatchEvent(new Event('change', { bubbles: true }));
            r.dispatchEvent(new Event('input', { bubbles: true }));
            found = true;
          }
        });
        if (found) {
          transferredCount++;
        } else {
          failedFields.push({
            fieldId: field.id,
            label: field.label,
            reason: `Radio option "${value}" was not found in original DOM.`,
          });
        }
        continue;
      }

      let el: HTMLElement | null = null;
      if (field.selector) {
        try {
          el = document.querySelector(field.selector);
        } catch {
          // Fallback
        }
      }
      if (!el && field.originalId) {
        el = document.getElementById(field.originalId);
      }
      if (!el && field.name) {
        el = document.querySelector(`[name="${CSS.escape(field.name)}"]`);
      }

      if (!el) {
        failedFields.push({
          fieldId: field.id,
          label: field.label,
          reason: 'Element could not be resolved in live page DOM.',
        });
        continue;
      }

      if (el instanceof HTMLInputElement && el.type === 'checkbox') {
        const nativeCheckedSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked')?.set;
        if (nativeCheckedSetter) {
          nativeCheckedSetter.call(el, Boolean(value));
        } else {
          el.checked = Boolean(value);
        }
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('input', { bubbles: true }));
        transferredCount++;
      } else if (el instanceof HTMLSelectElement) {
        el.value = String(value);
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('input', { bubbles: true }));
        transferredCount++;
      } else if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        let valToSet = String(value);
        if (el instanceof HTMLInputElement && el.type === 'date') {
          valToSet = normalizeDateToYMD(valToSet);
        } else if (el instanceof HTMLInputElement && el.type === 'text' && field.type === 'date') {
          const placeholder = (el.placeholder || '').toLowerCase();
          const ymd = normalizeDateToYMD(valToSet);
          if (ymd) {
            const [y, m, d] = ymd.split('-');
            if (placeholder.includes('dd/mm') || placeholder.includes('d/m')) {
              valToSet = `${d}/${m}/${y}`;
            } else if (placeholder.includes('dd-mm') || placeholder.includes('d-m')) {
              valToSet = `${d}-${m}-${y}`;
            }
          }
        }
        setNativeValue(el, valToSet);
        transferredCount++;
      } else {
        failedFields.push({
          fieldId: field.id,
          label: field.label,
          reason: 'Unsupported control type for automated value transfer.',
        });
      }
    } catch (err: any) {
      failedFields.push({
        fieldId: field.id,
        label: field.label,
        reason: err?.message || 'Error occurred during transfer.',
      });
    }
  }

  return {
    success: failedFields.length === 0,
    transferredCount,
    totalFields,
    failedFields,
    originalFormSubmittable: true,
    notice:
      'Answers transferred directly to original inputs. You can now review and submit on the website. Vazhika never submits forms automatically.',
  };
}

// Extension message listener
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener(
    (message: ExtensionMessage, _sender, sendResponse: (res?: any) => void) => {
      switch (message.type) {
        case 'VAZHIKA_PING':
          sendResponse({ type: 'VAZHIKA_PONG', alive: true });
          return true;

        case 'VAZHIKA_SCAN_PAGE': {
          const report = scanPage();
          sendResponse({ type: 'VAZHIKA_SCAN_RESULT', report });
          return true;
        }

        case 'VAZHIKA_HIGHLIGHT_FIELD':
          highlightField(message.selector || '', message.fieldId);
          sendResponse({ success: true });
          return true;

        case 'VAZHIKA_CLEAR_HIGHLIGHT':
          clearHighlight();
          sendResponse({ success: true });
          return true;

        case 'VAZHIKA_FILL_FIELDS': {
          const result = fillFields(message.answers);
          sendResponse({ type: 'VAZHIKA_FILL_RESULT', result });
          return true;
        }

        case 'VAZHIKA_DETECT_RESCUE': {
          const target = findTargetForm();
          const rescue = detectFormValidationErrors(target, lastInspectionReport?.fields || []);
          if (lastInspectionReport) {
            lastInspectionReport.rescueReport = rescue;
          }
          sendResponse({ type: 'VAZHIKA_RESCUE_RESULT', rescue });
          return true;
        }

        default:
          return false;
      }
    }
  );
}

// Export for testing
export { scanPage, findTargetForm, highlightField, clearHighlight, fillFields };
