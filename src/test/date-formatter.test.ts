import { describe, it, expect } from 'vitest';
import { normalizeDateToYMD, formatDateToDMY } from '../modules/date-formatter';
import { validateFieldValue } from '../modules/validation-engine';
import { FieldDefinition } from '../types';

describe('Date Formatter & HTML5 Date Normalization', () => {
  describe('normalizeDateToYMD', () => {
    it('normalizes Indian DD-MM-YYYY format to RFC 3339 yyyy-MM-dd', () => {
      expect(normalizeDateToYMD('09-10-2026')).toBe('2026-10-09');
      expect(normalizeDateToYMD('15-08-1985')).toBe('1985-08-15');
      expect(normalizeDateToYMD('1-1-2000')).toBe('2000-01-01');
    });

    it('normalizes DD/MM/YYYY format to yyyy-MM-dd', () => {
      expect(normalizeDateToYMD('09/10/2026')).toBe('2026-10-09');
      expect(normalizeDateToYMD('26/01/1950')).toBe('1950-01-26');
    });

    it('preserves valid yyyy-MM-dd format', () => {
      expect(normalizeDateToYMD('2026-10-09')).toBe('2026-10-09');
      expect(normalizeDateToYMD('1990-12-31')).toBe('1990-12-31');
    });

    it('normalizes YYYY/MM/DD format', () => {
      expect(normalizeDateToYMD('2026/10/09')).toBe('2026-10-09');
    });

    it('handles ISO timestamp strings', () => {
      expect(normalizeDateToYMD('2026-10-09T18:30:00.000Z')).toBe('2026-10-09');
    });

    it('returns empty string for invalid dates, avoiding browser console warnings', () => {
      expect(normalizeDateToYMD('')).toBe('');
      expect(normalizeDateToYMD(null)).toBe('');
      expect(normalizeDateToYMD(undefined)).toBe('');
      expect(normalizeDateToYMD('not-a-date')).toBe('');
    });
  });

  describe('formatDateToDMY', () => {
    it('formats yyyy-MM-dd into human-friendly DD-MM-YYYY', () => {
      expect(formatDateToDMY('2026-10-09')).toBe('09-10-2026');
      expect(formatDateToDMY('1985-08-15')).toBe('15-08-1985');
    });
  });

  describe('Validation Engine Date Support', () => {
    const dobField: FieldDefinition = {
      id: 'field-dob',
      name: 'dob',
      selector: '#dob',
      originalType: 'text',
      type: 'date',
      label: 'Date of Birth',
      questionText: 'When were you born?',
      explanation: { en: 'Date of birth', ml: 'ജനനത്തീയതി' },
      required: true,
      validation: { required: true },
      isSafeToRepair: true,
    };

    it('accepts DD-MM-YYYY as a valid date', () => {
      const err = validateFieldValue(dobField, '15-08-1985', 'en');
      expect(err).toBeNull();
    });

    it('accepts YYYY-MM-DD as a valid date', () => {
      const err = validateFieldValue(dobField, '1985-08-15', 'en');
      expect(err).toBeNull();
    });

    it('flags future date of birth', () => {
      const err = validateFieldValue(dobField, '01-01-2099', 'en');
      expect(err).not.toBeNull();
      expect(err?.message.en).toContain('cannot be in the future');
    });
  });
});
