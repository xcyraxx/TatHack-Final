import { describe, it, expect } from 'vitest';
import { validateFieldValue } from '../modules/validation-engine';
import { FieldDefinition } from '../types';

describe('Validation Engine', () => {
  const baseField: FieldDefinition = {
    id: 'test-field',
    name: 'test',
    selector: '#test',
    originalType: 'text',
    type: 'text',
    label: 'Applicant Name',
    questionText: 'What is your name?',
    explanation: { en: 'Your name', ml: 'നിങ്ങളുടെ പേര്' },
    required: true,
    validation: { required: true, minLength: 3 },
    isSafeToRepair: true,
  };

  it('fails required check when field is empty and explains how to fix in English and Malayalam', () => {
    const error = validateFieldValue(baseField, '', 'en');
    expect(error).not.toBeNull();
    expect(error?.message.en).toContain('cannot be skipped');
    expect(error?.message.ml).toContain('നിർബന്ധമായ ചോദ്യമാണ്');
  });

  it('validates minimum length constraints', () => {
    const error = validateFieldValue(baseField, 'Ab', 'en');
    expect(error).not.toBeNull();
    expect(error?.message.en).toContain('at least 3 characters');
  });

  it('validates email format properly', () => {
    const emailField: FieldDefinition = {
      ...baseField,
      type: 'email',
      validation: { required: true },
    };

    const invalidError = validateFieldValue(emailField, 'not-an-email', 'en');
    expect(invalidError).not.toBeNull();
    expect(invalidError?.message.en).toContain('valid email address');

    const validError = validateFieldValue(emailField, 'citizen@kerala.gov.in', 'en');
    expect(validError).toBeNull();
  });

  it('validates telephone number digits', () => {
    const phoneField: FieldDefinition = {
      ...baseField,
      type: 'tel',
      validation: { required: true },
    };

    const shortError = validateFieldValue(phoneField, '12345', 'en');
    expect(shortError).not.toBeNull();
    expect(shortError?.message.en).toContain('10-digit');

    const validError = validateFieldValue(phoneField, '9876543210', 'en');
    expect(validError).toBeNull();
  });

  it('validates required checkboxes', () => {
    const checkboxField: FieldDefinition = {
      ...baseField,
      type: 'checkbox',
      label: 'Terms of Service',
      validation: { required: true },
    };

    const uncheckedError = validateFieldValue(checkboxField, false, 'en');
    expect(uncheckedError).not.toBeNull();
    expect(uncheckedError?.message.en).toContain('Please check the box');

    const checkedError = validateFieldValue(checkboxField, true, 'en');
    expect(checkedError).toBeNull();
  });

  it('prevents future date of birth', () => {
    const dobField: FieldDefinition = {
      ...baseField,
      id: 'field-dob',
      name: 'dob',
      type: 'date',
      validation: { required: true },
    };

    const futureDate = '2099-01-01';
    const futureError = validateFieldValue(dobField, futureDate, 'en');
    expect(futureError).not.toBeNull();
    expect(futureError?.message.en).toContain('cannot be in the future');
  });
});
