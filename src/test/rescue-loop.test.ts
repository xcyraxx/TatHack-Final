import { describe, it, expect } from 'vitest';
import {
  detectFormValidationErrors,
  getFriendlyErrorExplanation,
} from '../modules/rescue-loop';
import { FieldDefinition } from '../types';

describe('Vazhika Rescue Loop', () => {
  describe('Plain Language Error Translation', () => {
    it('translates phone pattern errors into concrete formatting advice', () => {
      const result = getFriendlyErrorExplanation('Please match the requested format', 'tel', 'Mobile Number');
      expect(result.en).toContain('10-digit mobile number without country code');
      expect(result.ml).toContain('10 അക്കങ്ങൾ');
      expect(result.fixEn).toContain('Remove +91, spaces, and hyphens');
      expect(result.fixMl).toContain('10 അക്കങ്ങൾ മാത്രം നൽകുക');
    });

    it('translates postal PIN code pattern errors', () => {
      const result = getFriendlyErrorExplanation('Invalid pin format', 'text', 'Postal PIN');
      expect(result.en).toContain('exactly 6 digits');
      expect(result.ml).toContain('6 അക്കങ്ങൾ');
    });

    it('translates email type mismatch errors', () => {
      const result = getFriendlyErrorExplanation('Please enter a valid email address', 'email', 'Email Address');
      expect(result.en).toContain('email address is incomplete');
      expect(result.fixEn).toContain('includes "@" and a domain name');
      expect(result.fixMl).toContain("'@' ചിഹ്നവും ഡൊമെയ്നും");
    });

    it('translates required field errors', () => {
      const result = getFriendlyErrorExplanation('Please fill out this field', 'text', 'Applicant Name');
      expect(result.en).toContain('required by the portal');
      expect(result.ml).toContain('നിർബന്ധമായും ഉത്തരം നൽകേണ്ടതുണ്ട്');
    });
  });

  describe('Form Validation Detection', () => {
    const mockFields: FieldDefinition[] = [
      {
        id: 'phone',
        name: 'phone',
        selector: '#phone',
        originalType: 'tel',
        type: 'tel',
        label: 'Mobile Number',
        questionText: 'What is your mobile number?',
        explanation: { en: 'Your 10-digit phone number', ml: 'നിങ്ങളുടെ ഫോൺ നമ്പർ' },
        required: true,
        validation: { required: true },
        isSafeToRepair: true,
      },
      {
        id: 'email',
        name: 'email',
        selector: '#email',
        originalType: 'email',
        type: 'email',
        label: 'Email Address',
        questionText: 'What is your email address?',
        explanation: { en: 'Your email', ml: 'നിങ്ങളുടെ ഇമെയിൽ' },
        required: true,
        validation: { required: true },
        isSafeToRepair: true,
      },
    ];

    it('detects aria-invalid fields and associates inline error text', () => {
      const form = document.createElement('form');
      form.innerHTML = `
        <div class="form-group">
          <label for="phone">Mobile Number</label>
          <input id="phone" name="phone" type="tel" value="98470" aria-invalid="true" aria-describedby="phone-err" />
          <span id="phone-err" class="error">Phone number must be 10 digits</span>
        </div>
        <div class="form-group">
          <label for="email">Email Address</label>
          <input id="email" name="email" type="email" value="valid@example.com" />
        </div>
      `;

      const report = detectFormValidationErrors(form, mockFields);
      expect(report.hasErrors).toBe(true);
      expect(report.totalErrors).toBe(1);
      expect(report.issues[0].fieldId).toBe('phone');
      expect(report.issues[0].rawError).toContain('Phone number must be 10 digits');
      expect(report.issues[0].suggestedFix?.en).toBeDefined();
      expect(report.issues[0].suggestedFix?.ml).toBeDefined();
    });

    it('detects inline error containers in parent groups', () => {
      const form = document.createElement('form');
      form.innerHTML = `
        <div class="control-group">
          <label for="email">Email Address</label>
          <input id="email" name="email" type="email" value="bad-email" />
          <div class="invalid-feedback">Please enter a valid email format</div>
        </div>
      `;

      const report = detectFormValidationErrors(form, mockFields);
      expect(report.hasErrors).toBe(true);
      expect(report.issues.some((i) => i.fieldId === 'email')).toBe(true);
    });

    it('returns hasErrors=false when no validation failures exist', () => {
      const form = document.createElement('form');
      form.innerHTML = `
        <div>
          <input id="phone" name="phone" type="tel" value="9876543210" />
          <input id="email" name="email" type="email" value="citizen@kerala.gov.in" />
        </div>
      `;

      const report = detectFormValidationErrors(form, mockFields);
      expect(report.hasErrors).toBe(false);
      expect(report.totalErrors).toBe(0);
      expect(report.issues).toHaveLength(0);
    });
  });
});
