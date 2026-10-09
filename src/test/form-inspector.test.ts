import { describe, it, expect, beforeEach } from 'vitest';
import { inspectFormElement, getAccessibleName } from '../modules/form-inspector';

describe('Form Inspection Engine', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('detects input controls missing accessible names and flags placeholder-as-only-label', () => {
    container.innerHTML = `
      <form id="test-form">
        <input id="unlabeled" name="fullname" type="text" placeholder="Full name placeholder" />
      </form>
    `;

    const form = container.querySelector('form')!;
    const report = inspectFormElement(form);

    expect(report.findings.length).toBeGreaterThan(0);
    const placeholderIssue = report.findings.find((f) => f.ruleId === 'placeholder-as-label');
    expect(placeholderIssue).toBeDefined();
    expect(placeholderIssue?.severity).toBe('serious');
    expect(placeholderIssue?.canAutoRepair).toBe(true);
  });

  it('does NOT flag inputs with proper <label for="id"> associations', () => {
    container.innerHTML = `
      <form id="accessible-form">
        <label for="valid-field">Your Legal Full Name</label>
        <input id="valid-field" name="fullname" type="text" />
      </form>
    `;

    const form = container.querySelector('form')!;
    const report = inspectFormElement(form);

    const labelIssues = report.findings.filter(
      (f) => f.ruleId === 'missing-label' || f.ruleId === 'placeholder-as-label'
    );
    expect(labelIssues.length).toBe(0);

    const field = report.fields.find((f) => f.originalId === 'valid-field');
    expect(field?.label).toBe('Your Legal Full Name');
  });

  it('flags visual asterisks denoting required fields without programmatic attributes', () => {
    container.innerHTML = `
      <form id="asterisk-form">
        <label for="phone">Phone Number <span class="req">*</span></label>
        <input id="phone" name="phone" type="text" />
      </form>
    `;

    const form = container.querySelector('form')!;
    const report = inspectFormElement(form);

    const reqIssue = report.findings.find((f) => f.ruleId === 'required-not-programmatic');
    expect(reqIssue).toBeDefined();
    expect(reqIssue?.severity).toBe('serious');
  });

  it('detects radio button groups missing <fieldset> and <legend>', () => {
    container.innerHTML = `
      <form id="radio-form">
        <div>Choose Category</div>
        <input type="radio" name="plan" value="a" id="p1" /><label for="p1">Plan A</label>
        <input type="radio" name="plan" value="b" id="p2" /><label for="p2">Plan B</label>
      </form>
    `;

    const form = container.querySelector('form')!;
    const report = inspectFormElement(form);

    const radioIssue = report.findings.find((f) => f.ruleId === 'radiogroup-missing-fieldset-legend');
    expect(radioIssue).toBeDefined();

    // Guided mode groups them into 1 step
    const radioField = report.fields.find((f) => f.type === 'radio');
    expect(radioField).toBeDefined();
    expect(radioField?.options?.length).toBe(2);
  });

  it('flags ambiguous submit button labels like "Submit" or "Click here"', () => {
    container.innerHTML = `
      <form id="btn-form">
        <button type="submit">Submit</button>
      </form>
    `;

    const form = container.querySelector('form')!;
    const report = inspectFormElement(form);

    const btnIssue = report.findings.find((f) => f.ruleId === 'ambiguous-button-label');
    expect(btnIssue).toBeDefined();
    expect(btnIssue?.suggestedRemediation).toContain('action-oriented');
  });

  it('correctly calculates accessible names using aria-label and aria-labelledby', () => {
    container.innerHTML = `
      <span id="label-span">Custom Computed Label</span>
      <input id="aria-labelledby-input" aria-labelledby="label-span" />
      <input id="aria-label-input" aria-label="Direct Aria Label" />
    `;

    const el1 = container.querySelector('#aria-labelledby-input') as HTMLElement;
    const el2 = container.querySelector('#aria-label-input') as HTMLElement;

    expect(getAccessibleName(el1)).toBe('Custom Computed Label');
    expect(getAccessibleName(el2)).toBe('Direct Aria Label');
  });

  it('does NOT include random interactive buttons, close icons, or navigation controls as form fields', () => {
    container.innerHTML = `
      <form id="profile-form">
        <label for="username">Username</label>
        <input id="username" name="username" type="text" />
        <div role="button" aria-label="Toggle Navigation Menu">Menu</div>
        <button type="button" class="close-btn" aria-label="Close">X</button>
        <a role="button" href="#">Random Action</a>
        <button type="submit">Save Profile</button>
      </form>
    `;

    const form = container.querySelector('form')!;
    const report = inspectFormElement(form);

    // Only 'username' should be in fields! The buttons and div[role="button"] must NOT be fields!
    expect(report.fields.length).toBe(1);
    expect(report.fields[0].name).toBe('username');
  });
});
