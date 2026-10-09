import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ml';
export type TextSize = 'normal' | 'large' | 'xlarge';

interface AccessibilityContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  reducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;
  voiceEnabled: boolean;
  setVoiceEnabled: (enabled: boolean) => void;
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
  announcement: string;
  announce: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('vazhika_lang') as Language) || 'en';
  });

  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('vazhika_high_contrast') === 'true';
  });

  const [textSize, setTextSize] = useState<TextSize>(() => {
    return (localStorage.getItem('vazhika_text_size') as TextSize) || 'normal';
  });

  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    return localStorage.getItem('vazhika_reduced_motion') === 'true';
  });

  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => {
    return localStorage.getItem('vazhika_voice_enabled') === 'true';
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('vazhika_dark_mode') === 'true';
  });

  const [announcement, setAnnouncement] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('vazhika_lang', language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    localStorage.setItem('vazhika_high_contrast', String(highContrast));
    document.documentElement.setAttribute('data-high-contrast', String(highContrast));
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem('vazhika_text_size', textSize);
    document.documentElement.setAttribute('data-text-size', textSize);
  }, [textSize]);

  useEffect(() => {
    localStorage.setItem('vazhika_reduced_motion', String(reducedMotion));
    document.documentElement.setAttribute('data-reduced-motion', String(reducedMotion));
  }, [reducedMotion]);

  useEffect(() => {
    localStorage.setItem('vazhika_voice_enabled', String(voiceEnabled));
  }, [voiceEnabled]);

  useEffect(() => {
    localStorage.setItem('vazhika_dark_mode', String(darkMode));
    document.documentElement.setAttribute('data-dark-mode', String(darkMode));
  }, [darkMode]);

  const announce = (message: string) => {
    setAnnouncement(message);
    // Clear after 3 seconds so subsequent identical messages trigger re-announcement
    setTimeout(() => {
      setAnnouncement('');
    }, 3000);
  };

  return (
    <AccessibilityContext.Provider
      value={{
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
        announcement,
        announce,
      }}
    >
      {children}
      {/* Invisible live region for screen readers */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {announcement}
      </div>
    </AccessibilityContext.Provider>
  );
};

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
