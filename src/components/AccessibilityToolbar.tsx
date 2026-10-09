import React from 'react';
import { useAccessibility, TextSize } from '../modules/accessibility-controls/AccessibilityProvider';

interface Props {
  onClearDraft?: () => void;
  compact?: boolean;
}

export const AccessibilityToolbar: React.FC<Props> = ({ onClearDraft, compact = false }) => {
  const {
    language,
    setLanguage,
    highContrast,
    setHighContrast,
    textSize,
    setTextSize,
    reducedMotion,
    setReducedMotion,
    voiceEnabled,
    setVoiceEnabled,
    announce,
  } = useAccessibility();

  const handleLangToggle = () => {
    const next = language === 'en' ? 'ml' : 'en';
    setLanguage(next);
    announce(next === 'ml' ? 'ഭാഷ മലയാളത്തിലേക്ക് മാറ്റി' : 'Language set to English');
  };

  const handleContrastToggle = () => {
    const next = !highContrast;
    setHighContrast(next);
    announce(next ? 'High contrast enabled' : 'Normal contrast enabled');
  };

  const cycleTextSize = () => {
    const next: TextSize = textSize === 'normal' ? 'large' : textSize === 'large' ? 'xlarge' : 'normal';
    setTextSize(next);
    announce(`Text size set to ${next}`);
  };

  const handleVoiceToggle = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    announce(next ? 'Voice guidance enabled' : 'Voice guidance disabled');
  };

  const handleMotionToggle = () => {
    const next = !reducedMotion;
    setReducedMotion(next);
    announce(next ? 'Reduced motion enabled' : 'Normal motion restored');
  };

  return (
    <div
      role="region"
      aria-label={language === 'ml' ? 'ആക്‌സസിബിലിറ്റി ക്രമീകരണങ്ങൾ' : 'Accessibility Preferences'}
      className={`km-toolbar${compact ? ' km-toolbar--compact' : ''}`}
    >
      <button
        type="button"
        className="km-toggle"
        onClick={handleLangToggle}
        aria-label={language === 'en' ? 'Switch interface to Malayalam' : 'ഇന്റർഫേസ് ഇംഗ്ലീഷിലേക്ക് മാറ്റുക'}
      >
        <span aria-hidden="true">{language === 'en' ? 'മലയാളം' : 'English'}</span>
      </button>

      <button
        type="button"
        className={`km-toggle${highContrast ? ' km-toggle--on' : ''}`}
        onClick={handleContrastToggle}
        aria-pressed={highContrast}
        aria-label={language === 'ml' ? 'ഉയർന്ന കോൺട്രാസ്റ്റ്' : 'High Contrast Mode'}
      >
        <span aria-hidden="true">{highContrast ? 'Contrast: High' : 'Contrast: Normal'}</span>
      </button>

      <button
        type="button"
        className={`km-toggle${textSize !== 'normal' ? ' km-toggle--on' : ''}`}
        onClick={cycleTextSize}
        aria-label={`Text size: ${textSize}`}
      >
        <span aria-hidden="true">
          {textSize === 'normal' ? 'A' : textSize === 'large' ? 'A+' : 'A++'}
        </span>
      </button>

      <button
        type="button"
        className={`km-toggle${voiceEnabled ? ' km-toggle--on' : ''}`}
        onClick={handleVoiceToggle}
        aria-pressed={voiceEnabled}
        aria-label={
          voiceEnabled
            ? language === 'ml'
              ? 'ശബ്ദ സഹായം ഓഫാക്കുക'
              : 'Disable speech guidance'
            : language === 'ml'
              ? 'ശബ്ദ സഹായം ഓണാക്കുക'
              : 'Enable speech guidance'
        }
      >
        <span aria-hidden="true">{voiceEnabled ? 'Voice: On' : 'Voice: Off'}</span>
      </button>

      {!compact && (
        <button
          type="button"
          className={`km-toggle${reducedMotion ? ' km-toggle--on' : ''}`}
          onClick={handleMotionToggle}
          aria-pressed={reducedMotion}
          aria-label={language === 'ml' ? 'ആനിമേഷൻ കുറയ്ക്കുക' : 'Toggle reduced motion'}
        >
          <span aria-hidden="true">{reducedMotion ? 'Motion: Reduced' : 'Motion: On'}</span>
        </button>
      )}

      {onClearDraft && (
        <div className="km-toolbar__end">
          <button
            type="button"
            className="km-toggle"
            onClick={() => {
              if (window.confirm(language === 'ml' ? 'സേവ് ചെയ്ത വിവരങ്ങൾ ഒഴിവാക്കണോ?' : 'Clear all saved answers?')) {
                onClearDraft();
              }
            }}
          >
            <span aria-hidden="true">{language === 'ml' ? 'ഡ്രാഫ്റ്റ് മായ്ക്കുക' : 'Clear draft'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
