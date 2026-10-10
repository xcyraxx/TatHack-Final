import { describe, it, expect } from 'vitest';
import { detectDocumentRequirements } from '../modules/document-checklist';
import { FormInspectionReport } from '../types';

describe('Document Checklist Detector', () => {
  it('detects file inputs from DOM element', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <form>
        <label for="income-doc">Upload Income Certificate (PDF)</label>
        <input type="file" id="income-doc" name="income_doc" required />
      </form>
    `;

    const docs = detectDocumentRequirements(container);
    expect(docs.length).toBeGreaterThan(0);
    const incomeDoc = docs.find((d) => d.id === 'doc-income');
    expect(incomeDoc).toBeDefined();
    expect(incomeDoc?.title.en).toBe('Income Certificate');
    expect(incomeDoc?.title.ml).toBe('വരുമാന സർട്ടിഫിക്കറ്റ്');
    expect(incomeDoc?.source).toBe('upload_field');
  });

  it('detects document references from form instruction text', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <form>
        <p>Please keep your Aadhaar Card and Ration Card ready for verification.</p>
        <input type="text" name="applicant_name" />
      </form>
    `;

    const docs = detectDocumentRequirements(container);
    expect(docs.some((d) => d.id === 'doc-aadhaar')).toBe(true);
    expect(docs.some((d) => d.id === 'doc-ration')).toBe(true);
  });

  it('detects documents from FormInspectionReport fields', () => {
    const report: FormInspectionReport = {
      formId: 'test-doc-form',
      formTitle: 'Scholarship Portal',
      url: 'https://scholarships.example.gov.in',
      totalControlsFound: 2,
      findings: [],
      fields: [
        {
          id: 'f-caste',
          name: 'caste_cert',
          selector: '#caste_cert',
          originalType: 'file',
          type: 'file',
          label: 'Upload Caste Certificate',
          questionText: 'Upload your Community / Caste Certificate',
          explanation: { en: 'Official caste proof', ml: 'ജാതി സർട്ടിഫിക്കറ്റ്' },
          required: true,
          validation: { required: true },
          isSafeToRepair: true,
        },
      ],
      unsupportedFields: [],
      inspectedAt: new Date().toISOString(),
      isCompliant: true,
    };

    const docs = detectDocumentRequirements(null, report);
    expect(docs.length).toBe(1);
    expect(docs[0].id).toBe('doc-caste');
    expect(docs[0].category).toBe('community');
  });

  it('returns empty array when form has no upload controls or document mentions', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <form>
        <label for="username">Username</label>
        <input type="text" id="username" />
      </form>
    `;

    const docs = detectDocumentRequirements(container);
    expect(docs).toHaveLength(0);
  });
});
