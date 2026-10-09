import '@testing-library/jest-dom';

// Mock Web Speech API
if (typeof window !== 'undefined') {
  class MockSpeechSynthesisUtterance {
    text: string = '';
    lang: string = 'en-US';
    rate: number = 1;
    pitch: number = 1;
    onend: (() => void) | null = null;
    onerror: ((e: any) => void) | null = null;
    constructor(text?: string) {
      if (text) this.text = text;
    }
  }

  (window as any).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;

  (window as any).speechSynthesis = {
    speak: (utterance: any) => {
      setTimeout(() => {
        if (utterance.onend) utterance.onend();
      }, 50);
    },
    cancel: () => {},
    pause: () => {},
    resume: () => {},
    getVoices: () => [],
    speaking: false,
    paused: false,
    pending: false,
  };
}
