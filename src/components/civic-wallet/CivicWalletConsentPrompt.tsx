import React, { useState, useEffect } from 'react';
import { FieldDefinition } from '../../types';
import { civicWallet } from '../../modules/civic-wallet';
import { useAccessibility } from '../../modules/accessibility-controls/AccessibilityProvider';
import { Shield, Sparkles, Check, X, Lock, Clock } from 'lucide-react';

interface Props {
  field: FieldDefinition;
  currentValue: any;
  onApplyValue: (val: string) => void;
  onOpenWalletModal: () => void;
}

export const CivicWalletConsentPrompt: React.FC<Props> = ({
  field,
  currentValue,
  onApplyValue,
  onOpenWalletModal,
}) => {
  const { language, announce } = useAccessibility();
  const ml = language === 'ml';

  const [isUnlocked, setIsUnlocked] = useState<boolean>(civicWallet.isUnlocked());
  const [hasExistingWallet, setHasExistingWallet] = useState<boolean>(false);
  const [dismissedFieldId, setDismissedFieldId] = useState<string | null>(null);

  useEffect(() => {
    civicWallet.hasWallet().then((exists) => setHasExistingWallet(exists));
    setIsUnlocked(civicWallet.isUnlocked());

    const unsubscribe = civicWallet.subscribe(() => {
      setIsUnlocked(civicWallet.isUnlocked());
      civicWallet.hasWallet().then((exists) => setHasExistingWallet(exists));
    });

    return () => unsubscribe();
  }, []);

  // If user already dismissed prompt on this step, don't show
  if (dismissedFieldId === field.id) {
    return null;
  }

  // Case 1: Wallet exists on device, but locked
  if (hasExistingWallet && !isUnlocked) {
    const matchedKey = civicWallet.matchFieldToKey(field);
    if (!matchedKey) return null;

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.45rem 0.75rem',
          backgroundColor: 'var(--km-mint-tint)',
          borderRadius: '6px',
          border: '1px solid var(--km-mint)',
          marginBottom: '0.75rem',
          fontSize: '0.78rem',
        }}
      >
        <span style={{ color: 'var(--km-forest)', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Lock size={12} />
          {ml ? 'ഈ ഫീൽഡ് പൂരിപ്പിക്കാൻ സിവിക് വാലറ്റ് അൺലോക്ക് ചെയ്യാം' : 'Unlock Civic Wallet to auto-fill this field'}
        </span>

        <button
          type="button"
          onClick={onOpenWalletModal}
          className="km-btn km-btn--quiet km-btn--sm"
          style={{ fontSize: '0.75rem', padding: '2px 8px', color: 'var(--km-forest)', fontWeight: 700 }}
        >
          {ml ? 'അൺലോക്ക്' : 'Unlock'}
        </button>
      </div>
    );
  }

  // Case 2: Wallet is unlocked
  if (isUnlocked) {
    const matchedKey = civicWallet.matchFieldToKey(field);
    if (!matchedKey) return null;

    const entry = civicWallet.getValue(matchedKey);
    if (!entry || !entry.value) return null;

    // If current value already matches wallet value, don't nag
    if (String(currentValue).trim() === String(entry.value).trim()) {
      return null;
    }

    // Mask value if sensitive
    const displayValue = entry.isSensitive
      ? entry.value.length > 4
        ? `${'•'.repeat(entry.value.length - 4)}${entry.value.slice(-4)}`
        : '••••'
      : entry.value;

    const handleConsent = () => {
      onApplyValue(entry.value);
      announce(ml ? 'വാലറ്റിൽ നിന്ന് ഫീൽഡ് പൂരിപ്പിച്ചു' : 'Field filled from Civic Wallet.');
    };

    const handleDismiss = () => {
      setDismissedFieldId(field.id);
      announce(ml ? 'വാലറ്റ് നിർദ്ദേശം ഒഴിവാക്കി' : 'Suggestion dismissed.');
    };

    return (
      <div
        style={{
          padding: '0.65rem 0.85rem',
          backgroundColor: 'var(--km-mint-tint)',
          borderRadius: '8px',
          border: '1px solid var(--km-forest)',
          marginBottom: '0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.45rem',
          animation: 'km-fade-in 0.15s ease-out',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--km-forest)' }}>
            <Shield size={15} />
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
              {ml ? 'സിവിക് വാലറ്റ് നിർദ്ദേശം:' : 'Civic Wallet Match:'}{' '}
              <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{displayValue}</span>
            </span>
          </div>

          {entry.isSensitive && (
            <span
              style={{
                fontSize: '0.68rem',
                backgroundColor: 'var(--km-warning-surface)',
                color: 'var(--km-warning)',
                padding: '1px 5px',
                borderRadius: '4px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <Clock size={10} />
              {ml
                ? `സംവേദനക്ഷമം (${entry.expiresMinutesLeft || 120}m ബാക്കി)`
                : `Sensitive (${entry.expiresMinutesLeft || 120}m left)`}
            </span>
          )}
        </div>

        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--km-forest)', opacity: 0.9 }}>
          {ml
            ? 'ഈ ഫീൽഡ് നിങ്ങളുടെ വാലറ്റിൽ നിന്ന് പൂരിപ്പിക്കാൻ സമ്മതിക്കുന്നുണ്ടോ?'
            : 'Fill this field from your local encrypted wallet?'}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
          <button
            type="button"
            onClick={handleConsent}
            className="km-btn km-btn--primary km-btn--sm"
            style={{ fontSize: '0.75rem', padding: '3px 10px' }}
          >
            <Check size={12} />
            <span>{ml ? 'വാലറ്റിൽ നിന്ന് നൽകുക' : 'Fill from Wallet'}</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="km-btn km-btn--quiet km-btn--sm"
            style={{ fontSize: '0.75rem', padding: '3px 8px', color: 'var(--km-forest)' }}
          >
            <span>{ml ? 'വേണ്ട, ഞാൻ ടൈപ്പ് ചെയ്യാം' : 'No, type manually'}</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
};
