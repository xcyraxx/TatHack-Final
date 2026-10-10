import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Globe,
  Sun,
  Moon,
  Type,
  Volume2,
  VolumeX,
  ZapOff,
  Zap,
  Trash2,
  SlidersHorizontal,
  Download,
  CheckCircle,
  Loader2,
  Shield,
} from 'lucide-react';
import { speechService } from '../modules/speech-service';
import { useAccessibility, TextSize } from '../modules/accessibility-controls/AccessibilityProvider';
import { civicWallet } from '../modules/civic-wallet';

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
    darkMode,
    setDarkMode,
    announce,
  } = useAccessibility();

  const ml = language === 'ml';
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [revealed, setRevealed] = useState(false);

  // Neural TTS State
  const [neuralReady, setNeuralReady] = useState(speechService.isNeuralModelReady);
  const [neuralDownloading, setNeuralDownloading] = useState(speechService.isNeuralModelDownloading);
  const [neuralProgress, setNeuralProgress] = useState(0);

  useEffect(() => {
    // Check initial state
    setNeuralReady(speechService.isNeuralModelReady);
    setNeuralDownloading(speechService.isNeuralModelDownloading);

    speechService.onNeuralProgress((progress) => {
      setNeuralProgress(progress);
      if (progress >= 100) {
        setNeuralReady(true);
        setNeuralDownloading(false);
      }
    });
  }, []);

  const handleDownloadNeural = async () => {
    if (neuralReady || neuralDownloading) return;
    setNeuralDownloading(true);
    setNeuralProgress(0);
    announce(ml ? 'ഉയർന്ന നിലവാരമുള്ള ശബ്ദം ഡൗൺലോഡ് ചെയ്യുന്നു' : 'Downloading high-quality voice');
    try {
      await speechService.downloadNeuralModel();
      setNeuralReady(true);
      announce(ml ? 'ശബ്ദം തയ്യാറാണ്' : 'High-quality voice ready');
    } catch (e) {
      console.error(e);
      announce(ml ? 'ഡൗൺലോഡ് പരാജയപ്പെട്ടു' : 'Download failed');
    } finally {
      setNeuralDownloading(false);
    }
  };

  // Edge-proximity reveal: watch mousemove on the parent container
  useEffect(() => {
    if (compact) return; // popup uses inline layout — no floating needed

    const container = wrapperRef.current?.closest('.km-app, .km-sidepanel, [data-scroll-root]') as HTMLElement | null;
    const target = container ?? document.documentElement;

    const THRESHOLD = 90; // px from bottom edge

    const onMouseMove = (e: MouseEvent) => {
      const fromBottom = window.innerHeight - e.clientY;

      if (fromBottom <= THRESHOLD) {
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }
        setRevealed(true);
      }
    };

    const onMouseLeave = () => {
      hideTimerRef.current = setTimeout(() => setRevealed(false), 400);
    };

    target.addEventListener('mousemove', onMouseMove);
    target.addEventListener('mouseleave', onMouseLeave);

    return () => {
      target.removeEventListener('mousemove', onMouseMove);
      target.removeEventListener('mouseleave', onMouseLeave);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [compact]);

  // Keep bar visible while the mouse is over it
  const handleBarEnter = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setRevealed(true);
  }, []);

  const handleBarLeave = useCallback(() => {
    hideTimerRef.current = setTimeout(() => setRevealed(false), 500);
  }, []);

  // Handlers
  const handleLangToggle = () => {
    const next = ml ? 'en' : 'ml';
    setLanguage(next);
    announce(next === 'ml' ? 'ഭാഷ മലയാളത്തിലേക്ക് മാറ്റി' : 'Language set to English');
  };

  const handleContrastToggle = () => {
    const next = !highContrast;
    setHighContrast(next);
    announce(next ? 'High contrast enabled' : 'Normal contrast enabled');
  };

  const cycleTextSize = () => {
    const next: TextSize =
      textSize === 'normal' ? 'large' : textSize === 'large' ? 'xlarge' : 'normal';
    setTextSize(next);
    announce(`Text size set to ${next}`);
  };

  const handleVoiceToggle = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    announce(next
      ? (ml ? 'ശബ്ദ സഹായം ഓണാക്കി' : 'Voice guidance enabled')
      : (ml ? 'ശബ്ദ സഹായം ഓഫാക്കി' : 'Voice guidance disabled'));
  };

  const handleMotionToggle = () => {
    const next = !reducedMotion;
    setReducedMotion(next);
    announce(next ? 'Reduced motion enabled' : 'Normal motion restored');
  };

  const handleDarkToggle = () => {
    const next = !darkMode;
    setDarkMode(next);
    announce(next
      ? (ml ? 'ഡാർക്ക് മോഡ് ഓണാക്കി' : 'Dark mode enabled')
      : (ml ? 'ഡാർക്ക് മോഡ് ഓഫാക്കി' : 'Light mode enabled'));
  };

  const textSizeLabel = textSize === 'normal' ? 'A' : textSize === 'large' ? 'A+' : 'A++';

  // ── Compact (popup) variant ── stays inline, no float/slide
  if (compact) {
    return (
      <div
        role="region"
        aria-label={ml ? 'ആക്‌സസിബിലിറ്റി ക്രമീകരണങ്ങൾ' : 'Accessibility Preferences'}
        className="km-toolbar km-toolbar--compact"
      >
        <button type="button" className="km-toggle" onClick={handleLangToggle}
          aria-label={ml ? 'Switch to English' : 'Switch to Malayalam'}>
          <Globe /><span aria-hidden="true">{ml ? 'EN' : 'മ'}</span>
        </button>

        <button type="button"
          className={`km-toggle${highContrast ? ' km-toggle--on' : ''}`}
          onClick={handleContrastToggle} aria-pressed={highContrast}
          aria-label={ml ? 'ഉയർന്ന കോൺട്രാസ്റ്റ്' : 'High Contrast'}>
          <Sun />
        </button>

        <button type="button"
          className={`km-toggle${textSize !== 'normal' ? ' km-toggle--on' : ''}`}
          onClick={cycleTextSize} aria-label={`Text size: ${textSize}`}>
          <Type /><span className="km-toggle__size-label" aria-hidden="true">{textSizeLabel}</span>
        </button>

        <button type="button"
          className={`km-toggle${voiceEnabled ? ' km-toggle--on' : ''}`}
          onClick={handleVoiceToggle} aria-pressed={voiceEnabled}
          aria-label={voiceEnabled ? 'Disable voice' : 'Enable voice'}>
          {voiceEnabled ? <Volume2 /> : <VolumeX />}
        </button>

        {voiceEnabled && ml && (
          <button
            type="button"
            className={`km-toggle ${neuralReady ? 'km-toggle--success' : ''}`}
            onClick={handleDownloadNeural}
            disabled={neuralReady || neuralDownloading}
            aria-label="Download Offline Voice"
            title="Offline Voice (40 MB)"
          >
            {neuralReady ? (
              <CheckCircle size={14} className="km-text-success" />
            ) : neuralDownloading ? (
              <Loader2 size={14} className="km-spin" />
            ) : (
              <Download size={14} />
            )}
          </button>
        )}

        {/* Civic Wallet — compact */}
        <button
          type="button"
          className="km-toggle"
          onClick={() => civicWallet.openModal()}
          aria-label={ml ? 'സിവിക് വാലറ്റ്' : 'Civic Wallet'}
          title={ml ? 'സിവിക് വാലറ്റ് (Civic Wallet)' : 'Civic Wallet'}
        >
          <Shield />
        </button>

        {/* Dark pill — compact */}
        <div className="km-dark-pill-wrapper" style={{ marginLeft: 'auto' }}>
          <span className="km-dark-pill-icon" aria-hidden="true">
            {darkMode ? <Moon size={12} /> : <Sun size={12} />}
          </span>
          <button type="button" role="switch" className="km-dark-pill"
            aria-pressed={darkMode}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={handleDarkToggle} />
        </div>
      </div>
    );
  }

  // ── Full floating edge-reveal toolbar ──
  return (
    <div ref={wrapperRef} className="km-toolbar-float-root">
      {/* The sliding panel — comes first in DOM so it slides above the handle */}
      <div
        role="region"
        aria-label={ml ? 'ആക്‌സസിബിലിറ്റി ക്രമീകരണങ്ങൾ' : 'Accessibility Preferences'}
        className={`km-toolbar km-toolbar--float${revealed ? ' km-toolbar--revealed' : ''}`}
        onMouseEnter={handleBarEnter}
        onMouseLeave={handleBarLeave}
      >
        {/* Language */}
        <div className="km-toolbar__group">
          <button type="button" className="km-toggle" onClick={handleLangToggle}
            aria-label={ml ? 'Switch to English' : 'Switch to Malayalam / മലയാളം'}>
            <Globe />
            <span aria-hidden="true">{ml ? 'English' : 'മലയാളം'}</span>
          </button>
        </div>

        <div className="km-toolbar__divider" aria-hidden="true" />

        {/* High contrast */}
        <div className="km-toolbar__group">
          <button type="button"
            className={`km-toggle${highContrast ? ' km-toggle--on' : ''}`}
            onClick={handleContrastToggle} aria-pressed={highContrast}
            aria-label={ml ? 'ഉയർന്ന കോൺട്രാസ്റ്റ്' : 'High Contrast Mode'}>
            <Sun />
            <span aria-hidden="true">{ml ? 'കോൺട്രാസ്റ്റ്' : 'Contrast'}</span>
          </button>
        </div>

        {/* Text size */}
        <div className="km-toolbar__group">
          <button type="button"
            className={`km-toggle${textSize !== 'normal' ? ' km-toggle--on' : ''}`}
            onClick={cycleTextSize}
            aria-label={`${ml ? 'ടെക്സ്റ്റ് വലിപ്പം' : 'Text size'}: ${textSize}`}>
            <Type />
            <span className="km-toggle__size-label" aria-hidden="true">{textSizeLabel}</span>
          </button>
        </div>

                {/* Voice */}
        <div className="km-toolbar__group">
          <button type="button"
            className={`km-toggle${voiceEnabled ? ' km-toggle--on' : ''}`}
            onClick={handleVoiceToggle} aria-pressed={voiceEnabled}
            aria-label={voiceEnabled
              ? (ml ? 'ശബ്ദ സഹായം ഓഫാക്കുക' : 'Disable speech guidance')
              : (ml ? 'ശബ്ദ സഹായം ഓണാക്കുക' : 'Enable speech guidance')}>
            {voiceEnabled ? <Volume2 /> : <VolumeX />}
            <span aria-hidden="true">{ml ? 'ശബ്ദം' : 'Voice'}</span>
          </button>
          
          {voiceEnabled && ml && (
            <button
              type="button"
              className={`km-toggle ${neuralReady ? 'km-toggle--success' : ''}`}
              onClick={handleDownloadNeural}
              disabled={neuralReady || neuralDownloading}
              aria-label={ml ? 'ഓഫ്‌ലൈൻ ശബ്ദം ഡൗൺലോഡ് ചെയ്യുക' : 'Download Offline Voice'}
              title={ml ? 'ഓഫ്‌ലൈൻ ശബ്ദം (40 MB)' : 'Offline Voice (40 MB)'}
            >
              {neuralReady ? (
                <CheckCircle size={16} className="km-text-success" />
              ) : neuralDownloading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Loader2 size={16} className="km-spin" />
                  <span style={{ fontSize: '10px' }}>{Math.round(neuralProgress)}%</span>
                </div>
              ) : (
                <Download size={16} />
              )}
              <span aria-hidden="true" style={{ fontSize: '10px' }}>
                {neuralReady ? 'Ready' : 'HQ Voice'}
              </span>
            </button>
          )}
        </div>

        <div className="km-toolbar__divider" aria-hidden="true" />

        {/* Motion */}
        <div className="km-toolbar__group">
          <button type="button"
            className={`km-toggle${reducedMotion ? ' km-toggle--on' : ''}`}
            onClick={handleMotionToggle} aria-pressed={reducedMotion}
            aria-label={ml ? 'ആനിമേഷൻ കുറയ്ക്കുക' : 'Toggle reduced motion'}>
            {reducedMotion ? <ZapOff /> : <Zap />}
            <span aria-hidden="true">{ml ? 'ആനിമേഷൻ' : 'Motion'}</span>
          </button>
        </div>

        <div className="km-toolbar__divider" aria-hidden="true" />

        {/* Dark mode pill */}
        <div className="km-dark-pill-wrapper">
          <span className="km-dark-pill-icon" aria-hidden="true">
            {darkMode ? <Moon size={13} /> : <Sun size={13} />}
          </span>
          <button type="button" role="switch" className="km-dark-pill"
            aria-pressed={darkMode}
            aria-label={darkMode
              ? (ml ? 'ലൈറ്റ് മോഡിലേക്ക് മാറുക' : 'Switch to light mode')
              : (ml ? 'ഡാർക്ക് മോഡിലേക്ക് മാറുക' : 'Switch to dark mode')}
            onClick={handleDarkToggle} />
          <span className="km-dark-pill-label" aria-hidden="true">
            {darkMode ? (ml ? 'ഡാർക്ക്' : 'Dark') : (ml ? 'ലൈറ്റ്' : 'Light')}
          </span>
        </div>

        {/* Wallet & Clear draft */}
        <div className="km-toolbar__end" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <button
            type="button"
            className="km-toggle"
            onClick={() => civicWallet.openModal()}
            aria-label={ml ? 'സിവിക് വാലറ്റ്' : 'Civic Wallet'}
            title={ml ? 'സിവിക് വാലറ്റ് (Civic Wallet)' : 'Civic Wallet'}
          >
            <Shield />
            <span aria-hidden="true">{ml ? 'വാലറ്റ്' : 'Wallet'}</span>
          </button>

          {onClearDraft && (
            <button
              type="button"
              className="km-toggle"
              onClick={() => {
                if (window.confirm(ml ? 'സേവ് ചെയ്ത വിവരങ്ങൾ ഒഴിവാക്കണോ?' : 'Clear all saved answers?')) {
                  onClearDraft();
                }
              }}
              aria-label={ml ? 'ഡ്രാഫ്റ്റ് മായ്ക്കുക' : 'Clear saved draft'}
            >
              <Trash2 />
              <span aria-hidden="true">{ml ? 'ഡ്രാഫ്റ്റ്' : 'Clear'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Peek handle — always visible at bottom edge, invites hover and click */}
      <button
        type="button"
        className="km-toolbar-handle"
        aria-label={revealed ? (ml ? 'ആക്‌സസിബിലിറ്റി ബാർ മറയ്ക്കുക' : 'Collapse accessibility toolbar') : (ml ? 'ആക്‌സസിബിലിറ്റി ബാർ കാണിക്കുക' : 'Expand accessibility toolbar')}
        aria-expanded={revealed}
        onClick={() => setRevealed((v) => !v)}
        onMouseEnter={handleBarEnter}
        onMouseLeave={handleBarLeave}
      >
        <SlidersHorizontal size={13} aria-hidden="true" />
      </button>
    </div>
  );
};
