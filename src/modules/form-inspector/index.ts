import { AccessibilityFinding, FormInspectionReport, FieldDefinition, SupportedFieldType } from '../../types';
import { getPlainLanguageHelp } from '../plain-language/dictionary';

let fieldIndexCounter = 0;

/**
 * Generates a stable selector for a DOM element
 */
export function getUniqueSelector(el: HTMLElement): string {
  if (el.getAttribute('data-vazhika-id')) {
    return `[data-vazhika-id="${el.getAttribute('data-vazhika-id')}"]`;
  }

  const generatedId = `vf-${++fieldIndexCounter}`;
  el.setAttribute('data-vazhika-id', generatedId);

  if (el.id) {
    try {
      return `#${CSS.escape(el.id)}`;
    } catch {
      return `[id="${el.id}"]`;
    }
  }

  const name = el.getAttribute('name');
  if (name) {
    return `${el.tagName.toLowerCase()}[name="${CSS.escape(name)}"]`;
  }

  return `[data-vazhika-id="${generatedId}"]`;
}

/**
 * Determines whether an element is visible in the page layout
 */
export function isElementVisible(el: HTMLElement): boolean {
  if (el.hidden || el.getAttribute('aria-hidden') === 'true') {
    return false;
  }
  if (el.style.display === 'none' || el.style.visibility === 'hidden') {
    return false;
  }
  return true;
}

/**
 * Checks if an element is part of a global navigation or banner header/footer
 */
export function isNavigationOrUtilityElement(el: HTMLElement, container: HTMLElement): boolean {
  if (container.tagName.toLowerCase() === 'form') {
    return false;
  }
  const navAncestor = el.closest('header, nav, footer, aside, [role="banner"], [role="navigation"], [role="contentinfo"]');
  return navAncestor !== null;
}

/**
 * Checks if a control is a genuine data collection field (not a button, search bar, or utility toggle)
 */
export function isDataField(el: HTMLElement): boolean {
  const tag = el.tagName.toLowerCase();
  if (tag === 'button' || el.getAttribute('role') === 'button') {
    return false;
  }
  if (el instanceof HTMLInputElement) {
    const type = (el.type || 'text').toLowerCase();
    if (type === 'submit' || type === 'button' || type === 'reset' || type === 'hidden' || type === 'image') {
      return false;
    }
    const name = (el.name || el.id || '').toLowerCase();
    if ((type === 'search' || name === 'q' || name === 'search' || name === 's') && el.closest('header, nav, [role="search"]')) {
      return false;
    }
    return true;
  }
  if (el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
    return true;
  }
  return false;
}

/**
 * Form Inspection Engine
 * Inspects form DOM nodes, computes accessible names, identifies accessibility defects,
 * and extracts ONLY genuine form fields without grabbing unrelated page interactivity.
 */
export function inspectFormElement(formElement: HTMLElement, pageUrl: string = ''): FormInspectionReport {
  const findings: AccessibilityFinding[] = [];
  const fields: FieldDefinition[] = [];
  const unsupportedFields: { id: string; tagName: string; reason: string }[] = [];

  const formId = formElement.id || formElement.getAttribute('name') || 'unnamed-form';
  const formTitle =
    formElement.getAttribute('aria-label') ||
    formElement.querySelector('legend, h1, h2, h3')?.textContent?.trim() ||
    'Application Form';

  // Find genuine data-entry inputs only
  const allInputs = Array.from(
    formElement.querySelectorAll<HTMLElement>('input, select, textarea')
  );

  const dataInputs = allInputs.filter((el) => {
    if (!isDataField(el)) return false;
    if (isNavigationOrUtilityElement(el, formElement)) return false;
    if (!isElementVisible(el)) return false;
    return true;
  });

  // Group radio inputs by name
  const radioGroups = new Map<string, HTMLInputElement[]>();
  const processedRadioNames = new Set<string>();

  dataInputs.forEach((control) => {
    if (control instanceof HTMLInputElement && control.type === 'radio' && control.name) {
      const list = radioGroups.get(control.name) || [];
      list.push(control);
      radioGroups.set(control.name, list);
    }
  });

  let issueCounter = 1;
  const generateIssueId = () => `VZ-ISSUE-${String(issueCounter++).padStart(3, '0')}`;

  // Check 1: Button accessibility (ONLY inspect form action/submit buttons)
  const formButtons = Array.from(
    formElement.querySelectorAll<HTMLElement>(
      'button, input[type="submit"], input[type="button"], [role="button"]'
    )
  ).filter((btn) => {
    if (isNavigationOrUtilityElement(btn, formElement)) return false;
    const btnClass = (btn.className || '').toLowerCase();
    const btnAria = (btn.getAttribute('aria-label') || '').toLowerCase();
    // Exclude generic UI toggles like modal close or hamburger menu
    if (btnAria === 'close' || btnAria === 'dismiss' || btnClass.includes('close-btn') || btnClass.includes('menu-toggle')) {
      return false;
    }
    return true;
  });

  formButtons.forEach((btn) => {
    const accessibleName = getAccessibleName(btn);
    if (!accessibleName || accessibleName.trim() === '') {
      findings.push({
        id: generateIssueId(),
        ruleId: 'button-name',
        severity: 'critical',
        elementSummary: `<${btn.tagName.toLowerCase()}>`,
        fieldId: btn.id,
        evidence: 'Submit or action button has no visible text, aria-label, aria-labelledby, or title attribute.',
        suggestedRemediation: 'Provide a descriptive text label or aria-label for the button.',
        canAutoRepair: true,
        wcagCriteria: 'WCAG 4.1.2 Name, Role, Value',
      });
    } else if (
      accessibleName.toLowerCase() === 'click here' ||
      accessibleName.toLowerCase() === 'submit' ||
      accessibleName.toLowerCase() === 'ok'
    ) {
      findings.push({
        id: generateIssueId(),
        ruleId: 'ambiguous-button-label',
        severity: 'moderate',
        elementSummary: `<button>${accessibleName}</button>`,
        fieldId: btn.id,
        evidence: `Button label "${accessibleName}" is ambiguous and does not describe the specific action.`,
        suggestedRemediation: 'Use an action-oriented descriptive label, such as "Submit Application" or "Proceed to Step 2".',
        canAutoRepair: true,
        wcagCriteria: 'WCAG 2.4.6 Headings and Labels',
      });
    }

    if (btn.getAttribute('role') === 'button' && btn.tagName !== 'BUTTON') {
      const tabIndex = btn.getAttribute('tabindex');
      if (tabIndex === null || parseInt(tabIndex, 10) < 0) {
        findings.push({
          id: generateIssueId(),
          ruleId: 'custom-button-keyboard',
          severity: 'critical',
          elementSummary: `<${btn.tagName.toLowerCase()} role="button">`,
          fieldId: btn.id,
          evidence: 'Custom element with role="button" is not in the keyboard tab sequence (missing tabindex="0").',
          suggestedRemediation: 'Add tabindex="0" and handle Enter and Space key activations, or replace with native <button>.',
          canAutoRepair: true,
          wcagCriteria: 'WCAG 2.1.1 Keyboard',
        });
      }
    }
  });

  // Check 2: Form controls (inputs, selects, textareas)
  dataInputs.forEach((el) => {
    const tag = el.tagName.toLowerCase();
    const input = el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const isRadio = input instanceof HTMLInputElement && input.type === 'radio';

    // Handle radio groups once
    if (isRadio && input.name) {
      if (processedRadioNames.has(input.name)) return;
      processedRadioNames.add(input.name);

      const groupInputs = radioGroups.get(input.name) || [input];
      const fieldset = input.closest('fieldset');
      const legend = fieldset?.querySelector('legend');

      if (!fieldset || !legend || !legend.textContent?.trim()) {
        findings.push({
          id: generateIssueId(),
          ruleId: 'radiogroup-missing-fieldset-legend',
          severity: 'serious',
          elementSummary: `Radio group: "${input.name}"`,
          fieldName: input.name,
          evidence: `Radio inputs with name="${input.name}" are not enclosed in a <fieldset> with a descriptive <legend>.`,
          suggestedRemediation: 'Wrap related radio buttons in a <fieldset> element and provide a <legend> describing the group.',
          canAutoRepair: true,
          wcagCriteria: 'WCAG 1.3.1 Info and Relationships',
        });
      }

      // Assign selector to each radio input
      groupInputs.forEach((r) => getUniqueSelector(r));

      // Extract radio group as a single guided step
      const options = groupInputs.map((r) => {
        const rLabel = getAccessibleName(r) || r.value;
        return {
          value: r.value,
          label: rLabel,
        };
      });

      const groupLabel = legend?.textContent?.trim() || input.name;
      const plainHelp = getPlainLanguageHelp(input.name, input.name, groupLabel);
      const checkedOption = groupInputs.find((r) => r.checked);

      fields.push({
        id: `field-${input.name}`,
        originalId: input.id || input.name,
        name: input.name,
        selector: `input[type="radio"][name="${CSS.escape(input.name)}"]`,
        originalType: 'radio',
        type: 'radio',
        label: groupLabel,
        questionText: plainHelp.question.en,
        explanation: {
          en: plainHelp.explanation.en,
          ml: plainHelp.explanation.ml,
        },
        required: groupInputs.some((r) => r.required || r.getAttribute('aria-required') === 'true'),
        options,
        validation: {
          required: groupInputs.some((r) => r.required || r.getAttribute('aria-required') === 'true'),
        },
        isSafeToRepair: true,
        currentValue: checkedOption?.value || '',
      });

      return;
    }

    const selector = getUniqueSelector(input);
    const elementId = input.id;
    const elementName = input.name || input.id;
    const accessibleName = getAccessibleName(input);
    const hasLabel = Boolean(accessibleName && accessibleName.trim().length > 0);
    const placeholder = input.getAttribute('placeholder');

    // Rule: Missing label / accessible name
    if (!hasLabel) {
      if (placeholder) {
        findings.push({
          id: generateIssueId(),
          ruleId: 'placeholder-as-label',
          severity: 'serious',
          elementSummary: `<${tag} name="${elementName}">`,
          fieldId: elementId,
          fieldName: elementName,
          evidence: `Control uses placeholder="${placeholder}" as its only accessible hint instead of an associated <label> or aria-label.`,
          suggestedRemediation: 'Add an explicit <label for="..."> element or aria-label attribute.',
          canAutoRepair: true,
          wcagCriteria: 'WCAG 3.3.2 Labels or Instructions, WCAG 4.1.2 Name, Role, Value',
        });
      } else {
        findings.push({
          id: generateIssueId(),
          ruleId: 'missing-label',
          severity: 'critical',
          elementSummary: `<${tag} name="${elementName}">`,
          fieldId: elementId,
          fieldName: elementName,
          evidence: 'Control has no accessible name: missing <label for>, aria-label, and aria-labelledby.',
          suggestedRemediation: 'Associate a label with <label for="id"> or add an aria-label.',
          canAutoRepair: true,
          wcagCriteria: 'WCAG 1.3.1 Info and Relationships, WCAG 4.1.2 Name, Role, Value',
        });
      }
    }

    // Rule: Required field not programmatically exposed
    const isProgrammaticallyRequired = input.required || input.getAttribute('aria-required') === 'true';
    const parentText = input.parentElement?.textContent || '';
    const hasVisualAsterisk = parentText.includes('*') || (input.previousElementSibling?.textContent || '').includes('*');

    if (hasVisualAsterisk && !isProgrammaticallyRequired) {
      findings.push({
        id: generateIssueId(),
        ruleId: 'required-not-programmatic',
        severity: 'serious',
        elementSummary: `<${tag} id="${elementId}">`,
        fieldId: elementId,
        fieldName: elementName,
        evidence: 'Visual asterisk (*) denotes required status, but missing programmatic required attribute or aria-required="true".',
        suggestedRemediation: 'Add required or aria-required="true" to the input element.',
        canAutoRepair: true,
        wcagCriteria: 'WCAG 3.3.2 Labels or Instructions, WCAG 1.3.1 Info and Relationships',
      });
    }

    // Rule: Missing or generic input type
    let supportedType: SupportedFieldType = 'text';
    const originalType = (input instanceof HTMLInputElement ? input.type : tag).toLowerCase();

    if (tag === 'select') {
      supportedType = 'select';
    } else if (tag === 'textarea') {
      supportedType = 'textarea';
    } else if (input instanceof HTMLInputElement) {
      if (originalType === 'text') {
        const idLower = (elementId + ' ' + elementName + ' ' + (accessibleName || '')).toLowerCase();
        if (idLower.includes('email')) {
          findings.push({
            id: generateIssueId(),
            ruleId: 'missing-semantic-input-type',
            severity: 'moderate',
            elementSummary: `<input type="text" name="${elementName}">`,
            fieldId: elementId,
            fieldName: elementName,
            evidence: 'Email field is using generic type="text" instead of semantic type="email", limiting mobile keyboards and assistive input.',
            suggestedRemediation: 'Change type to type="email".',
            canAutoRepair: true,
            wcagCriteria: 'WCAG 1.3.5 Identify Input Purpose',
          });
          supportedType = 'email';
        } else if (idLower.includes('phone') || idLower.includes('mobile') || idLower.includes('tel')) {
          findings.push({
            id: generateIssueId(),
            ruleId: 'missing-semantic-input-type',
            severity: 'moderate',
            elementSummary: `<input type="text" name="${elementName}">`,
            fieldId: elementId,
            fieldName: elementName,
            evidence: 'Telephone field is using generic type="text" instead of type="tel".',
            suggestedRemediation: 'Change type to type="tel".',
            canAutoRepair: true,
            wcagCriteria: 'WCAG 1.3.5 Identify Input Purpose',
          });
          supportedType = 'tel';
        } else if (idLower.includes('dob') || idLower.includes('date') || idLower.includes('birth')) {
          findings.push({
            id: generateIssueId(),
            ruleId: 'date-input-unstructured',
            severity: 'moderate',
            elementSummary: `<input type="text" name="${elementName}">`,
            fieldId: elementId,
            fieldName: elementName,
            evidence: 'Date field is using generic unformatted text without clear pattern guidance or native date picker.',
            suggestedRemediation: 'Use type="date" or provide explicit date format hints.',
            canAutoRepair: true,
            wcagCriteria: 'WCAG 3.3.2 Labels or Instructions',
          });
          supportedType = 'date';
        } else {
          supportedType = 'text';
        }
      } else if (originalType === 'email') {
        supportedType = 'email';
      } else if (originalType === 'tel') {
        supportedType = 'tel';
      } else if (originalType === 'date') {
        supportedType = 'date';
      } else if (originalType === 'number') {
        supportedType = 'number';
      } else if (originalType === 'checkbox') {
        supportedType = 'checkbox';
      } else if (originalType === 'file') {
        supportedType = 'file';
      } else {
        unsupportedFields.push({
          id: elementId || elementName,
          tagName: tag,
          reason: `Input type "${originalType}" cannot be safely transformed without potential data loss.`,
        });
        return;
      }
    }

    // Rule: Poorly associated validation or error messages
    const describedBy = input.getAttribute('aria-describedby');
    const adjacentError = formElement.querySelector(`.error, .invalid-feedback, [id*="error"]`);
    if (adjacentError && !describedBy) {
      findings.push({
        id: generateIssueId(),
        ruleId: 'unassociated-error-message',
        severity: 'serious',
        elementSummary: `<${tag} id="${elementId}">`,
        fieldId: elementId,
        fieldName: elementName,
        evidence: 'Error container exists in DOM but is not programmatically referenced via aria-describedby or aria-errormessage.',
        suggestedRemediation: 'Add aria-describedby pointing to the error container ID so screen readers announce it upon focus.',
        canAutoRepair: true,
        wcagCriteria: 'WCAG 3.3.1 Error Identification',
      });
    }

    // Extract options if select
    let options: { value: string; label: string }[] | undefined;
    if (input instanceof HTMLSelectElement) {
      options = Array.from(input.options).map((opt) => ({
        value: opt.value,
        label: opt.text,
      }));
    }

    // Determine effective label & plain language help
    const effectiveLabel = accessibleName || placeholder || elementName || 'Input field';
    const plainHelp = getPlainLanguageHelp(elementId, elementName, effectiveLabel);
    const effectiveRequired = Boolean(isProgrammaticallyRequired || hasVisualAsterisk);

    // Initial value
    let initialVal: any = '';
    if (input instanceof HTMLInputElement && input.type === 'checkbox') {
      initialVal = input.checked;
    } else {
      initialVal = input.value || '';
    }

    fields.push({
      id: elementId || `field-${elementName}`,
      originalId: elementId,
      name: elementName,
      selector,
      originalType,
      type: supportedType,
      label: effectiveLabel,
      questionText: plainHelp.question.en,
      explanation: {
        en: plainHelp.explanation.en,
        ml: plainHelp.explanation.ml,
      },
      placeholder: placeholder || plainHelp.placeholder?.en,
      required: effectiveRequired,
      options,
      validation: {
        required: effectiveRequired,
        pattern: input.getAttribute('pattern') || undefined,
        minLength: input.getAttribute('minlength') ? parseInt(input.getAttribute('minlength')!, 10) : undefined,
        maxLength: input.getAttribute('maxlength') ? parseInt(input.getAttribute('maxlength')!, 10) : undefined,
      },
      isSafeToRepair: true,
      currentValue: initialVal,
    });
  });

  return {
    formId,
    formTitle,
    url: pageUrl || (typeof window !== 'undefined' ? window.location.href : ''),
    totalControlsFound: dataInputs.length + formButtons.length,
    findings,
    fields,
    unsupportedFields,
    inspectedAt: new Date().toISOString(),
    isCompliant: findings.length === 0,
  };
}

/**
 * Computes the accessible name of an element using standard W3C AccName algorithm rules.
 */
export function getAccessibleName(el: HTMLElement): string {
  // 1. aria-labelledby
  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelElements = labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => node !== null);
    if (labelElements.length > 0) {
      return labelElements.map((node) => node.textContent?.trim() || '').join(' ').trim();
    }
  }

  // 2. aria-label
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel && ariaLabel.trim() !== '') {
    return ariaLabel.trim();
  }

  // 3. Native <label for="id"> association
  if (el.id) {
    const labelFor = document.querySelector(`label[for="${el.id}"]`);
    if (labelFor && labelFor.textContent?.trim()) {
      return labelFor.textContent.trim().replace(/\*+$/, '').trim();
    }
  }

  // 4. Wrapping <label>
  const parentLabel = el.closest('label');
  if (parentLabel) {
    const clone = parentLabel.cloneNode(true) as HTMLElement;
    const nestedInput = clone.querySelector('input, select, textarea');
    if (nestedInput) nestedInput.remove();
    if (clone.textContent?.trim()) {
      return clone.textContent.trim().replace(/\*+$/, '').trim();
    }
  }

  // 5. Button or input value / textContent
  if (el instanceof HTMLInputElement) {
    if (el.type === 'submit' || el.type === 'button' || el.type === 'reset') {
      return el.value || '';
    }
  } else if (el instanceof HTMLButtonElement) {
    return el.textContent?.trim() || '';
  }

  // 6. Title attribute
  const title = el.getAttribute('title');
  if (title && title.trim() !== '') {
    return title.trim();
  }

  return '';
}
