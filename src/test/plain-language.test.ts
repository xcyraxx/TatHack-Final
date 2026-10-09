import { describe, it, expect } from 'vitest';
import { getPlainLanguageHelp } from '../modules/plain-language/dictionary';

describe('Plain Language Dictionary', () => {
  it('translates confusing "Correspondence Address" into simple plain-language guidance in EN and ML', () => {
    const help = getPlainLanguageHelp('correspondence_address', 'correspondence_address', 'Correspondence Address');
    expect(help.question.en).toContain('Where should official letters be mailed');
    expect(help.explanation.en).toContain('receive physical letters');
    expect(help.explanation.ml).toContain('തപാൽ കത്തുകൾ');
  });

  it('translates Date of Birth terminology', () => {
    const help = getPlainLanguageHelp('dob', 'dob', 'Date of Birth');
    expect(help.question.en).toContain('When were you born?');
    expect(help.question.ml).toContain('ജനനത്തീയതി');
  });

  it('gracefully falls back for unknown custom fields without breaking', () => {
    const help = getPlainLanguageHelp('custom_code_99', 'custom_code_99', 'Inspection Tag');
    expect(help.question.en).toBe('Please enter: Inspection Tag');
    expect(help.question.ml).toBe('ദയവായി നൽകുക: Inspection Tag');
  });
});
