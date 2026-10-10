import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { civicWallet } from '../modules/civic-wallet';
import { CivicWalletModal } from '../components/civic-wallet/CivicWalletModal';
import { AccessibilityProvider } from '../modules/accessibility-controls/AccessibilityProvider';
import { FieldDefinition } from '../types';

describe('Local Encrypted Civic Wallet', () => {
  beforeEach(async () => {
    await civicWallet.wipeAllData();
  });

  it('initially reports no wallet', async () => {
    expect(await civicWallet.hasWallet()).toBe(false);
    expect(civicWallet.isUnlocked()).toBe(false);
  });

  it('encrypts, stores, and unlocks with master passphrase', async () => {
    const entries = {
      fullname: 'Ananya Nair',
      phone: '9847123456',
      address: 'Vazhika House, Palayam, Trivandrum',
      aadhaar: '123456789012',
    };

    const saved = await civicWallet.saveWallet('secret123', entries);
    expect(saved).toBe(true);
    expect(await civicWallet.hasWallet()).toBe(true);
    expect(civicWallet.isUnlocked()).toBe(true);

    // Retrieve value
    const nameVal = civicWallet.getValue('fullname');
    expect(nameVal?.value).toBe('Ananya Nair');
    expect(nameVal?.isSensitive).toBe(false);

    // Retrieve sensitive value
    const aadhaarVal = civicWallet.getValue('aadhaar');
    expect(aadhaarVal?.value).toBe('123456789012');
    expect(aadhaarVal?.isSensitive).toBe(true);
    expect(aadhaarVal?.expiresMinutesLeft).toBeGreaterThan(0);

    // Lock wallet
    civicWallet.lockWallet();
    expect(civicWallet.isUnlocked()).toBe(false);
    expect(civicWallet.getValue('fullname')).toBeNull();

    // Wrong passphrase fails
    const badUnlock = await civicWallet.unlockWallet('wrong-pass');
    expect(badUnlock).toBe(false);
    expect(civicWallet.isUnlocked()).toBe(false);

    // Correct passphrase succeeds
    const goodUnlock = await civicWallet.unlockWallet('secret123');
    expect(goodUnlock).toBe(true);
    expect(civicWallet.isUnlocked()).toBe(true);
    expect(civicWallet.getValue('fullname')?.value).toBe('Ananya Nair');
  });

  it('correctly maps various field definitions to wallet keys', () => {
    const nameField: FieldDefinition = {
      id: 'applicant_fullname',
      name: 'applicant_name',
      selector: '#applicant_name',
      originalType: 'text',
      type: 'text',
      label: 'Applicant Full Legal Name',
      questionText: 'What is your full legal name?',
      explanation: { en: 'Full name', ml: 'പേര്' },
      required: true,
      validation: {},
      isSafeToRepair: true,
    };
    expect(civicWallet.matchFieldToKey(nameField)).toBe('fullname');

    const aadhaarField: FieldDefinition = {
      id: 'uid_number',
      name: 'aadhaar_no',
      selector: '#aadhaar_no',
      originalType: 'text',
      type: 'text',
      label: 'Aadhaar Card UID',
      questionText: 'Enter your 12-digit Aadhaar number',
      explanation: { en: 'Aadhaar', ml: 'ആധാർ' },
      required: true,
      validation: {},
      isSafeToRepair: true,
    };
    expect(civicWallet.matchFieldToKey(aadhaarField)).toBe('aadhaar');

    const bankAccField: FieldDefinition = {
      id: 'acc_no',
      name: 'account_number',
      selector: '#account_number',
      originalType: 'text',
      type: 'text',
      label: 'Bank Account Number',
      questionText: 'Bank account number',
      explanation: { en: 'Bank', ml: 'ബാങ്ക്' },
      required: true,
      validation: {},
      isSafeToRepair: true,
    };
    expect(civicWallet.matchFieldToKey(bankAccField)).toBe('bank_account');
  });

  it('wipes everything instantly', async () => {
    await civicWallet.saveWallet('mypass', { fullname: 'Test User' });
    expect(await civicWallet.hasWallet()).toBe(true);

    await civicWallet.wipeAllData();
    expect(await civicWallet.hasWallet()).toBe(false);
    expect(civicWallet.isUnlocked()).toBe(false);
    expect(civicWallet.getValue('fullname')).toBeNull();
  });

  it('manages modal open and close events via singleton API', () => {
    expect(civicWallet.isModalCurrentlyOpen()).toBe(false);

    let observed = false;
    const unsub = civicWallet.onModalStateChange((open) => {
      observed = open;
    });

    civicWallet.openModal();
    expect(civicWallet.isModalCurrentlyOpen()).toBe(true);
    expect(observed).toBe(true);

    civicWallet.closeModal();
    expect(civicWallet.isModalCurrentlyOpen()).toBe(false);
    expect(observed).toBe(false);

    unsub();
  });
});

describe('CivicWalletModal UI Component', () => {
  beforeEach(async () => {
    await civicWallet.wipeAllData();
    civicWallet.closeModal();
  });

  it('renders nothing when closed, and displays setup form when opened without existing wallet', async () => {
    const { container } = render(
      <AccessibilityProvider>
        <CivicWalletModal />
      </AccessibilityProvider>
    );

    // Closed initially
    expect(screen.queryByRole('dialog')).toBeNull();

    // Trigger open
    civicWallet.openModal();

    // Dialog should appear
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Check setup screen elements
    await waitFor(() => {
      expect(screen.getByText(/Choose a Master Passphrase/i)).toBeInTheDocument();
    });

    // Close via close button
    const closeBtn = screen.getByRole('button', { name: /Close modal/i });
    fireEvent.click(closeBtn);

    expect(civicWallet.isModalCurrentlyOpen()).toBe(false);
  });

  it('allows creating a new vault and editing fields', async () => {
    render(
      <AccessibilityProvider>
        <CivicWalletModal />
      </AccessibilityProvider>
    );

    civicWallet.openModal();

    await waitFor(() => {
      expect(screen.getByText(/Choose a Master Passphrase/i)).toBeInTheDocument();
    });

    // Fill passphrase and confirm
    const passwordInputs = screen.getAllByPlaceholderText(/passphrase/i);
    expect(passwordInputs.length).toBeGreaterThanOrEqual(1);

    fireEvent.change(passwordInputs[0], { target: { value: 'testpass123' } });
    if (passwordInputs.length > 1) {
      fireEvent.change(passwordInputs[1], { target: { value: 'testpass123' } });
    }

    const createBtn = screen.getByRole('button', { name: /Create Encrypted Vault/i });
    fireEvent.click(createBtn);

    // Should transition to unlocked view
    await waitFor(() => {
      expect(screen.getByText(/Save Changes/i)).toBeInTheDocument();
    });

    expect(civicWallet.isUnlocked()).toBe(true);

    // Edit full name
    const nameInput = screen.getByPlaceholderText(/Rahul Sharma/i);
    fireEvent.change(nameInput, { target: { value: 'Kavya Madhavan' } });

    // Save changes
    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/Saved to encrypted vault!/i)).toBeInTheDocument();
    });

    // Check value saved in civicWallet
    expect(civicWallet.getValue('fullname')?.value).toBe('Kavya Madhavan');
  });
});

