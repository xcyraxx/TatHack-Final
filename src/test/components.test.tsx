import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AccessibilityProvider } from '../modules/accessibility-controls/AccessibilityProvider';
import { GuidedWorkflow } from '../components/guided-workflow/GuidedWorkflow';
import { ReviewScreen } from '../components/review-screen/ReviewScreen';
import { NeuButton } from '../components/NeuButton';
import { CopyButton } from '../components/CopyNotification';
import { FormInspectionReport } from '../types';

const mockReport: FormInspectionReport = {
  formId: 'test-form',
  formTitle: 'Registration Test',
  url: 'http://localhost/test',
  totalControlsFound: 2,
  findings: [],
  fields: [
    {
      id: 'field-1',
      name: 'q1',
      selector: '#q1',
      originalType: 'text',
      type: 'text',
      label: 'Your Name',
      questionText: 'What is your name?',
      explanation: { en: 'Enter name', ml: 'പേര് നൽകുക' },
      required: true,
      validation: { required: true },
      isSafeToRepair: true,
    },
    {
      id: 'field-2',
      name: 'q2',
      selector: '#q2',
      originalType: 'email',
      type: 'email',
      label: 'Your Email',
      questionText: 'What is your email address?',
      explanation: { en: 'Enter email', ml: 'ഇമെയിൽ നൽകുക' },
      required: false,
      validation: { required: false },
      isSafeToRepair: true,
    },
  ],
  unsupportedFields: [],
  inspectedAt: new Date().toISOString(),
  isCompliant: true,
};

describe('GuidedWorkflow UI & Keyboard Interaction', () => {
  it('renders one question at a time and moves forward when valid', async () => {
    const handleTransfer = vi.fn().mockResolvedValue({
      success: true,
      transferredCount: 2,
      totalFields: 2,
      failedFields: [],
      originalFormSubmittable: true,
      notice: 'Done',
    });

    render(
      <AccessibilityProvider>
        <GuidedWorkflow report={mockReport} onTransferAnswers={handleTransfer} />
      </AccessibilityProvider>
    );

    // Initial question is rendered
    expect(screen.getByText('What is your name?')).toBeInTheDocument();
    expect(screen.getAllByText(/Step 1 of 2/i).length).toBeGreaterThan(0);

    // Try clicking continue without value (required check should fail)
    const continueBtn = screen.getByRole('button', { name: /Continue/i });
    fireEvent.click(continueBtn);

    // Error should be displayed
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Type value
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Siddharth' } });

    // Now click Continue
    fireEvent.click(continueBtn);

    // Moves to Question 2
    expect(screen.getByText('What is your email address?')).toBeInTheDocument();
    expect(screen.getAllByText(/Step 2 of 2/i).length).toBeGreaterThan(0);
  });

  it('renders review screen showing user responses before transfer', () => {
    const onEdit = vi.fn();
    const onConfirm = vi.fn();
    const onBack = vi.fn();

    render(
      <AccessibilityProvider>
        <ReviewScreen
          fields={mockReport.fields}
          answers={{ 'field-1': 'Deepa Nair', 'field-2': 'deepa@example.com' }}
          onEditField={onEdit}
          onConfirmTransfer={onConfirm}
          onBackToGuided={onBack}
        />
      </AccessibilityProvider>
    );

    expect(screen.getByText('Review Your Answers')).toBeInTheDocument();
    expect(screen.getByText('Deepa Nair')).toBeInTheDocument();
    expect(screen.getByText('deepa@example.com')).toBeInTheDocument();

    const transferBtn = screen.getByRole('button', { name: /Transfer Answers to Webpage/i });
    fireEvent.click(transferBtn);
    expect(onConfirm).toHaveBeenCalled();
  });

  it('renders NeuButton with Kerala Modern color scheme variants and handles clicks', () => {
    const handleClick = vi.fn();
    const { rerender } = render(<NeuButton onClick={handleClick}>Submit Application</NeuButton>);

    const btn = screen.getByRole('button', { name: /Submit Application/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveClass('km-neu-button');
    expect(btn).toHaveClass('km-neu-button--forest');

    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);

    // Test gold variant
    rerender(<NeuButton variant="gold">Special Action</NeuButton>);
    expect(screen.getByRole('button', { name: /Special Action/i })).toHaveClass('km-neu-button--gold');
  });

  it('renders CopyButton and triggers slide-in notification toast upon copying', async () => {
    render(<CopyButton textToCopy="Test Copy Text" label="Copy Text" copiedTitle="Copied successfully!" />);

    const copyBtn = screen.getByRole('button', { name: /Copy Text/i });
    expect(copyBtn).toBeInTheDocument();

    fireEvent.click(copyBtn);

    // Slide-in toast should appear with title and status role
    const toast = await screen.findByRole('status');
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveTextContent('Copied successfully!');
  });
});
