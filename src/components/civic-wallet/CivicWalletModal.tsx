import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  civicWallet,
  CIVIC_WALLET_SCHEMA,
} from '../../modules/civic-wallet';
import { useAccessibility } from '../../modules/accessibility-controls/AccessibilityProvider';
import {
  KeyRound,
  Shield,
  ShieldAlert,
  Lock,
  Unlock,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Clock,
  Sparkles,
  Save,
  Loader2,
} from 'lucide-react';

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
}

export const CivicWalletModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { language, announce } = useAccessibility();
  const ml = language === 'ml';

  // Modal open state: controlled either by prop or global civicWallet manager
  const [modalOpen, setModalOpen] = useState<boolean>(isOpen ?? civicWallet.isModalCurrentlyOpen());

  const [isCheckingStorage, setIsCheckingStorage] = useState<boolean>(true);
  const [hasExistingWallet, setHasExistingWallet] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(civicWallet.isUnlocked());
  const [passphrase, setPassphrase] = useState<string>('');
  const [confirmPassphrase, setConfirmPassphrase] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form values in editor
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'personal' | 'address' | 'civic' | 'financial'>('all');
  const [showWipeConfirm, setShowWipeConfirm] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Focus ref for first input
  const initialInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof isOpen === 'boolean') {
      setModalOpen(isOpen);
    }
  }, [isOpen]);

  useEffect(() => {
    return civicWallet.onModalStateChange((open) => {
      setModalOpen(open);
    });
  }, []);

  // When modal becomes open, check storage
  useEffect(() => {
    if (!modalOpen) return;

    setIsCheckingStorage(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    civicWallet.hasWallet().then((exists) => {
      setHasExistingWallet(exists);
      const unlocked = civicWallet.isUnlocked();
      setIsUnlocked(unlocked);
      if (unlocked) {
        const payload = civicWallet.getPayload();
        setFormValues(payload?.entries ? { ...payload.entries } : {});
      }
      setIsCheckingStorage(false);
    }).catch(() => {
      setIsCheckingStorage(false);
    });

    const unsubscribe = civicWallet.subscribe(() => {
      const unlocked = civicWallet.isUnlocked();
      setIsUnlocked(unlocked);
      if (unlocked) {
        const payload = civicWallet.getPayload();
        setFormValues(payload?.entries ? { ...payload.entries } : {});
      }
    });

    return () => unsubscribe();
  }, [modalOpen]);

  // Focus initial input when view renders
  useEffect(() => {
    if (modalOpen && !isCheckingStorage) {
      setTimeout(() => {
        initialInputRef.current?.focus();
      }, 50);
    }
  }, [modalOpen, isCheckingStorage, hasExistingWallet, isUnlocked]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!modalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen]);

  const handleClose = () => {
    setModalOpen(false);
    civicWallet.closeModal();
    if (onClose) onClose();
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!passphrase) {
      setErrorMsg(ml ? 'പാസ്‌ഫ്രെയ്സ് നൽകുക' : 'Please enter your passphrase.');
      return;
    }

    const success = await civicWallet.unlockWallet(passphrase);
    if (success) {
      setPassphrase('');
      setIsUnlocked(true);
      const payload = civicWallet.getPayload();
      if (payload?.entries) {
        setFormValues({ ...payload.entries });
      }
      announce(ml ? 'വാലറ്റ് അൺലോക്ക് ചെയ്തു' : 'Civic Wallet unlocked.');
    } else {
      setErrorMsg(ml ? 'തെറ്റായ പാസ്‌ഫ്രെയ്സ്. വീണ്ടും ശ്രമിക്കുക.' : 'Incorrect passphrase. Please try again.');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (passphrase.length < 4) {
      setErrorMsg(ml ? 'പാസ്‌ഫ്രെയ്സിന് കുറഞ്ഞത് 4 അക്ഷരങ്ങൾ വേണം' : 'Passphrase must be at least 4 characters.');
      return;
    }
    if (passphrase !== confirmPassphrase) {
      setErrorMsg(ml ? 'പാസ്‌ഫ്രെയ്സുകൾ പൊരുത്തപ്പെടുന്നില്ല' : 'Passphrases do not match.');
      return;
    }

    const ok = await civicWallet.saveWallet(passphrase, formValues);
    if (ok) {
      setHasExistingWallet(true);
      setIsUnlocked(true);
      setPassphrase('');
      setConfirmPassphrase('');
      setSuccessMsg(ml ? 'വാലറ്റ് വിജയകരമായി സജ്ജമാക്കി! വിവരങ്ങൾ താഴെ ചേർക്കുക.' : 'Vault created! Enter your details below.');
      announce(ml ? 'സിവിക് വാലറ്റ് സൃഷ്ടിച്ചു' : 'Encrypted Civic Wallet created successfully.');
      setTimeout(() => setSuccessMsg(null), 3500);
    } else {
      setErrorMsg(ml ? 'സേവ് ചെയ്യാൻ കഴിഞ്ഞില്ല' : 'Failed to create wallet.');
    }
  };

  const handleSaveEntries = async (): Promise<boolean> => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSaving(true);

    try {
      const ok = await civicWallet.saveUnlockedEntries(formValues);
      if (ok) {
        setSuccessMsg(ml ? 'വിവരങ്ങൾ സുരക്ഷിതമായി സൂക്ഷിച്ചു!' : 'Saved to encrypted vault!');
        setTimeout(() => setSuccessMsg(null), 3000);
        announce(ml ? 'വിവരങ്ങൾ സേവ് ചെയ്തു' : 'Civic Wallet saved.');
        return true;
      } else {
        setErrorMsg(ml ? 'സേവ് ചെയ്യാൻ കഴിഞ്ഞില്ല' : 'Failed to save changes.');
        return false;
      }
    } catch {
      setErrorMsg(ml ? 'സേവ് ചെയ്യാൻ കഴിഞ്ഞില്ല' : 'Failed to save changes.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDone = async () => {
    // If unlocked, save any pending edits before closing
    if (isUnlocked) {
      await handleSaveEntries();
    }
    handleClose();
  };

  const handleLock = () => {
    civicWallet.lockWallet();
    setIsUnlocked(false);
    announce(ml ? 'വാലറ്റ് ലോക്ക് ചെയ്തു' : 'Civic Wallet locked.');
  };

  const handleWipeEverything = async () => {
    await civicWallet.wipeAllData();
    setShowWipeConfirm(false);
    setHasExistingWallet(false);
    setIsUnlocked(false);
    setFormValues({});
    setPassphrase('');
    setConfirmPassphrase('');
    announce(ml ? 'എല്ലാ വിവരങ്ങളും പൂർണ്ണമായി മായ്ച്ചു' : 'All Civic Wallet data wiped instantly.');
  };

  const filteredFields = CIVIC_WALLET_SCHEMA.filter(
    (f) => selectedCategory === 'all' || f.category === selectedCategory
  );

  if (!modalOpen) return null;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(11, 41, 37, 0.72)',
        backdropFilter: 'blur(4px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.75rem',
        pointerEvents: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--km-white, #ffffff)',
          color: 'var(--km-text-primary, #172522)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.32)',
          overflow: 'hidden',
          border: '1px solid var(--km-border, #dde5df)',
          pointerEvents: 'auto',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* PINNED HEADER */}
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'var(--km-forest, #123b35)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Shield size={22} color="var(--km-mint, #d9f3e5)" />
            <div>
              <h2 id="wallet-modal-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                {ml ? 'സിവിക് വാലറ്റ് (Civic Wallet)' : 'Local Civic Wallet'}
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--km-mint, #d9f3e5)', opacity: 0.9 }}>
                {ml ? 'WebCrypto AES-GCM · ക്ലൗഡ് രഹിത സുരക്ഷ' : 'Local WebCrypto AES-GCM · Zero Cloud'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="km-btn km-btn--quiet km-btn--sm km-btn--icon"
            style={{ color: '#ffffff', minWidth: '32px', height: '32px' }}
            aria-label={ml ? 'അടയ്ക്കുക' : 'Close modal'}
          >
            <X size={18} />
          </button>
        </div>

        {/* LOADING STORAGE STATE */}
        {isCheckingStorage && (
          <div style={{ padding: '3.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.85rem' }}>
            <Loader2 size={30} className="km-spin" color="var(--km-forest, #123b35)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--km-text-muted, #53635d)' }}>
              {ml ? 'സുരക്ഷിത വാലറ്റ് പരിശോധിക്കുന്നു...' : 'Accessing encrypted vault...'}
            </span>
          </div>
        )}

        {/* SCROLLABLE BODY CONTENT */}
        {!isCheckingStorage && (
          <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
            {errorMsg && (
              <div
                className="km-error"
                style={{ marginBottom: '1rem', padding: '0.6rem 0.8rem', borderRadius: '6px' }}
                role="alert"
              >
                <AlertTriangle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div
                style={{
                  marginBottom: '1rem',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '6px',
                  backgroundColor: 'var(--km-success-surface, #f0f9f4)',
                  color: 'var(--km-success, #216e4e)',
                  border: '1px solid var(--km-success, #216e4e)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Check size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* VIEW 1: NOT UNLOCKED - SETUP A NEW WALLET */}
            {!hasExistingWallet && !isUnlocked && (
              <div>
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    backgroundColor: 'var(--km-mint-tint, #eefaf3)',
                    borderRadius: '8px',
                    border: '1px solid var(--km-mint, #d9f3e5)',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--km-forest, #123b35)', fontWeight: 600 }}>
                    <Sparkles size={16} />
                    <span>{ml ? 'സുരക്ഷിതമായി ഒറ്റത്തവണ സൂക്ഷിക്കുക' : 'Save Once, Consent Every Time'}</span>
                  </div>
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: 'var(--km-forest, #123b35)', lineHeight: 1.45 }}>
                    {ml
                      ? 'പേര്, മേൽവിലാസം, റേഷൻ നമ്പർ തുടങ്ങിയ പതിവ് വിവരങ്ങൾ നിങ്ങളുടെ ഉപകരണത്തിൽ മാത്രം WebCrypto വഴി എൻക്രിപ്റ്റ് ചെയ്തു സൂക്ഷിക്കുന്നു. ഫോം പൂരിപ്പിക്കുമ്പോൾ ഓരോ ഫീൽഡിലും നിങ്ങളുടെ സമ്മതത്തോടെ മാത്രം ഓട്ടോഫിൽ ചെയ്യും.'
                      : 'A local-only vault for frequent form answers. Encrypted on your machine with WebCrypto. Vazhika asks for your consent field-by-field before filling anything.'}
                  </p>
                </div>

                <form onSubmit={handleCreate}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                        {ml ? 'മാസ്റ്റർ പാസ്‌ഫ്രെയ്സ് തിരഞ്ഞെടുക്കുക' : 'Choose a Master Passphrase'}
                      </label>
                      <input
                        ref={initialInputRef}
                        type="password"
                        className="km-control"
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                        placeholder={ml ? 'രഹസ്യ വാക്ക് നൽകുക (കുറഞ്ഞത് 4 അക്ഷരങ്ങൾ)' : 'Enter a secure passphrase (min 4 chars)'}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                        {ml ? 'പാസ്‌ഫ്രെയ്സ് വീണ്ടും നൽകുക' : 'Confirm Passphrase'}
                      </label>
                      <input
                        type="password"
                        className="km-control"
                        value={confirmPassphrase}
                        onChange={(e) => setConfirmPassphrase(e.target.value)}
                        placeholder={ml ? 'വീണ്ടും ടൈപ്പ് ചെയ്യുക' : 'Re-enter passphrase'}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button type="button" onClick={handleClose} className="km-btn km-btn--secondary">
                      <span>{ml ? 'റദ്ദാക്കുക' : 'Cancel'}</span>
                    </button>
                    <button type="submit" className="km-btn km-btn--primary">
                      <KeyRound size={16} />
                      <span>{ml ? 'വാലറ്റ് സജ്ജമാക്കുക' : 'Create Encrypted Vault'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* VIEW 2: WALLET EXISTS, BUT LOCKED */}
            {hasExistingWallet && !isUnlocked && (
              <div>
                <div style={{ textAlign: 'center', padding: '1rem 0 1.25rem' }}>
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--km-mint-tint, #eefaf3)',
                      color: 'var(--km-forest, #123b35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 0.75rem',
                    }}
                  >
                    <Lock size={26} />
                  </div>
                  <h3 className="km-title" style={{ fontSize: '1.15rem', margin: 0 }}>
                    {ml ? 'വാലറ്റ് അൺലോക്ക് ചെയ്യുക' : 'Unlock Your Civic Wallet'}
                  </h3>
                  <p className="km-sub" style={{ fontSize: '0.82rem', marginTop: '0.35rem' }}>
                    {ml
                      ? 'സൂക്ഷിച്ച വിവരങ്ങൾ കാണാനും ഫോമുകളിൽ സമ്മതത്തോടെ ഉപയോഗിക്കാനും പാസ്‌ഫ്രെയ്സ് നൽകുക.'
                      : 'Enter your passphrase to access saved answers for field-by-field filling.'}
                  </p>
                </div>

                <form onSubmit={handleUnlock} style={{ maxWidth: '380px', margin: '0 auto' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <input
                      ref={initialInputRef}
                      type="password"
                      className="km-control"
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder={ml ? 'നിങ്ങളുടെ പാസ്‌ഫ്രെയ്സ്' : 'Your master passphrase'}
                      required
                    />
                  </div>

                  <button type="submit" className="km-btn km-btn--primary" style={{ width: '100%', justifyContent: 'center' }}>
                    <Unlock size={16} />
                    <span>{ml ? 'അൺലോക്ക് ചെയ്യുക' : 'Unlock Vault'}</span>
                  </button>

                  <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setShowWipeConfirm(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--km-error, #b42318)',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      {ml ? 'പാസ്‌ഫ്രെയ്സ് മറന്നുപോയോ? വാലറ്റ് പൂർണ്ണമായി മായ്ക്കുക' : 'Forgot passphrase? Wipe vault completely'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* VIEW 3: UNLOCKED - MANAGE & EDIT WALLET ENTRIES */}
            {isUnlocked && (
              <div>
                {/* Category tabs & Lock button */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '2px' }}>
                    {(['all', 'personal', 'address', 'civic', 'financial'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`km-btn km-btn--sm ${selectedCategory === cat ? 'km-btn--primary' : 'km-btn--secondary'}`}
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                      >
                        {cat === 'all'
                          ? ml ? 'എല്ലാം' : 'All'
                          : cat === 'personal'
                          ? ml ? 'വ്യക്തിഗതം' : 'Personal'
                          : cat === 'address'
                          ? ml ? 'വിലാസം' : 'Address'
                          : cat === 'civic'
                          ? ml ? 'സിവിക്' : 'Civic'
                          : ml ? 'സാമ്പത്തികം / Aadhaar' : 'Sensitive'}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleLock}
                    className="km-btn km-btn--secondary km-btn--sm"
                    title={ml ? 'ഇപ്പോൾ ലോക്ക് ചെയ്യുക' : 'Lock wallet now'}
                  >
                    <Lock size={13} />
                    <span>{ml ? 'ലോക്ക്' : 'Lock'}</span>
                  </button>
                </div>

                {/* Fields Editor */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {filteredFields.map((field, idx) => {
                    const val = formValues[field.key] || '';

                    return (
                      <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                            {ml ? field.label.ml : field.label.en}
                          </label>

                          {field.isSensitive && (
                            <span
                              style={{
                                fontSize: '0.68rem',
                                backgroundColor: 'var(--km-warning-surface, #fdf7ec)',
                                color: 'var(--km-warning, #8a5200)',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              <Clock size={10} />
                              {ml ? 'ഓട്ടോ-എക്സ്പയർ (2h)' : 'Auto-expires (2h)'}
                            </span>
                          )}
                        </div>

                        <input
                          ref={idx === 0 ? initialInputRef : undefined}
                          type={field.type || 'text'}
                          className="km-control"
                          value={val}
                          placeholder={field.placeholder || ''}
                          onChange={(e) =>
                            setFormValues((prev) => ({
                              ...prev,
                              [field.key]: e.target.value,
                            }))
                          }
                          style={{ fontSize: '0.85rem' }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PINNED FOOTER (FOR UNLOCKED VIEW) */}
        {!isCheckingStorage && isUnlocked && (
          <div
            style={{
              padding: '0.75rem 1.25rem',
              borderTop: '1px solid var(--km-border, #dde5df)',
              backgroundColor: 'var(--km-warm-white, #f8faf7)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={() => setShowWipeConfirm(true)}
              className="km-btn km-btn--danger km-btn--sm"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            >
              <Trash2 size={13} />
              <span>{ml ? 'മായ്ക്കുക' : 'Wipe Vault'}</span>
            </button>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleSaveEntries()}
                disabled={isSaving}
                className="km-btn km-btn--primary km-btn--sm"
              >
                <Save size={14} />
                <span>{isSaving ? (ml ? 'സേവ് ചെയ്യുന്നു...' : 'Saving...') : (ml ? 'സേവ് ചെയ്യുക' : 'Save Changes')}</span>
              </button>

              <button
                type="button"
                onClick={handleDone}
                className="km-btn km-btn--secondary km-btn--sm"
              >
                <span>{ml ? 'പൂർത്തിയായി' : 'Done'}</span>
              </button>
            </div>
          </div>
        )}

        {/* WIPE CONFIRMATION MODAL OVERLAY */}
        {showWipeConfirm && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              zIndex: 10,
              padding: '2rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              pointerEvents: 'auto',
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: 'var(--km-error-surface, #fdf3f2)',
                color: 'var(--km-error, #b42318)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <ShieldAlert size={28} />
            </div>
            <h3 style={{ margin: '0 0 0.5rem', color: 'var(--km-error, #b42318)', fontSize: '1.2rem' }}>
              {ml ? 'എല്ലാ വിവരങ്ങളും ഉടൻ മായ്ക്കണോ?' : 'Wipe All Civic Wallet Data?'}
            </h3>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', color: 'var(--km-text-muted, #53635d)', maxWidth: '380px' }}>
              {ml
                ? 'നിങ്ങളുടെ എൻക്രിപ്റ്റ് ചെയ്ത എല്ലാ രേഖകളും ഈ ഡിവൈസിൽ നിന്ന് പൂർണ്ണമായി ഒഴിവാക്കപ്പെടും. പിന്നീട് വീണ്ടെടുക്കാൻ കഴിയില്ല.'
                : 'This instantly zeroes crypto keys and deletes all encrypted storage locally. This action cannot be undone.'}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowWipeConfirm(false)}
                className="km-btn km-btn--secondary"
              >
                <span>{ml ? 'റദ്ദാക്കുക' : 'Cancel'}</span>
              </button>
              <button
                type="button"
                onClick={handleWipeEverything}
                className="km-btn km-btn--danger"
              >
                <Trash2 size={16} />
                <span>{ml ? 'അതെ, മായ്ക്കുക' : 'Yes, Wipe Everything'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render modal directly into document.body to prevent parent container clipping/pointer-events issues
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};
