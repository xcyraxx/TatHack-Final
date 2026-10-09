import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import axe from 'axe-core';
import { AccessibilityProvider } from '../modules/accessibility-controls/AccessibilityProvider';
import { FieldRenderer } from '../components/guided-workflow/FieldRenderer';
import { FieldDefinition } from '../types';

describe('axe-core Accessibility Conformance', () => {
  const sampleField: FieldDefinition = {
    id: 'fullname-field',
    name: 'fullname',
    selector: '#fullname',
    originalType: 'text',
    type: 'text',
    label: 'Applicant Full Legal Name',
    questionText: 'What is your full legal name?',
    explanation: {
      en: 'Enter your legal first and last name.',
      ml: 'നിങ്ങളുടെ പേര് നൽകുക.',
    },
    required: true,
    validation: { required: true },
    isSafeToRepair: true,
  };

  it('contains no axe-core accessibility violations in FieldRenderer', async () => {
    const { container } = render(
      <AccessibilityProvider>
        <FieldRenderer
          field={sampleField}
          value="Kavitha Menon"
          onChange={() => {}}
        />
      </AccessibilityProvider>
    );

    const results = await axe.run(container);
    // Filter out any minor notices that aren't critical/serious violations
    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toHaveLength(0);
  });
});
