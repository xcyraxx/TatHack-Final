/**
 * Speech Service
 * Wraps SpeechSynthesis and optional SpeechRecognition with graceful fallbacks.
 * Fully on-device, local-first Web Speech APIs without external AI/cloud dependencies.
 */

export interface SpeechState {
  isSpeaking: boolean;
  isListening: boolean;
  supported: boolean;
  recognitionSupported: boolean;
  error?: string;
}

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private activeRecognition: any = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private hasRecognitionSupport: boolean = false;
  private resumeTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }

    if (typeof window !== 'undefined') {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.hasRecognitionSupport = Boolean(SpeechRec);
    }
  }

  private loadVoices(): SpeechSynthesisVoice[] {
    if (this.synth) {
      const list = this.synth.getVoices();
      if (list && list.length > 0) {
        this.voices = list;
      }
    }
    return this.voices;
  }

  public isSynthesisSupported(): boolean {
    return Boolean(this.synth);
  }

  public isRecognitionSupported(): boolean {
    return this.hasRecognitionSupport;
  }

  public speak(
    text: string,
    lang: 'en' | 'ml' = 'en',
    onEnd?: () => void,
    onError?: (error: any) => void
  ): boolean {
    if (!this.synth) {
      if (onError) onError('Speech synthesis not supported in this browser.');
      return false;
    }

    // Cancel any active utterance and ensure synthesis is unpaused
    this.stopSpeaking();
    if (this.synth.paused) {
      try {
        this.synth.resume();
      } catch {
        // Ignore
      }
    }

    const trimmed = text.trim();
    if (!trimmed) {
      if (onEnd) onEnd();
      return true;
    }

    const utterance = new SpeechSynthesisUtterance(trimmed);
    utterance.lang = lang === 'ml' ? 'ml-IN' : 'en-IN';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Pick best available voice matching language
    const currentVoices = this.voices.length > 0 ? this.voices : this.loadVoices();
    if (lang === 'ml') {
      const mlVoice = currentVoices.find((v) => v.lang && v.lang.toLowerCase().startsWith('ml'));
      if (mlVoice) utterance.voice = mlVoice;
    } else {
      const enVoice = currentVoices.find(
        (v) =>
          v.lang &&
          (v.lang.toLowerCase().startsWith('en-in') ||
            v.lang.toLowerCase().startsWith('en-gb') ||
            v.lang.toLowerCase().startsWith('en'))
      );
      if (enVoice) utterance.voice = enVoice;
    }

    const cleanup = () => {
      if (this.resumeTimer) {
        clearInterval(this.resumeTimer);
        this.resumeTimer = null;
      }
      this.currentUtterance = null;
    };

    utterance.onend = () => {
      cleanup();
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      cleanup();
      // 'canceled' or 'interrupted' errors are normal when a user navigates away or stops speaking
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        if (onError) onError(e);
      }
    };

    // Retain instance reference on service to protect against Chrome garbage-collection bug
    this.currentUtterance = utterance;

    // Chromium bug workaround: Keep long speech alive by pulsing resume
    this.resumeTimer = setInterval(() => {
      if (this.synth && this.synth.speaking) {
        try {
          this.synth.pause();
          this.synth.resume();
        } catch {
          // Ignore
        }
      } else {
        cleanup();
      }
    }, 10000);

    try {
      this.synth.speak(utterance);
      return true;
    } catch (err) {
      cleanup();
      if (onError) onError(err);
      return false;
    }
  }

  public stopSpeaking(): void {
    if (this.resumeTimer) {
      clearInterval(this.resumeTimer);
      this.resumeTimer = null;
    }
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {
        // Ignore
      }
      this.currentUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    return Boolean(this.synth && this.synth.speaking);
  }

  /**
   * Starts speech-to-text recognition.
   * Creates a fresh SpeechRecognition instance on every session to avoid InvalidStateError.
   */
  public startListening(
    lang: 'en' | 'ml' = 'en',
    onResult: (transcript: string) => void,
    onError: (error: string) => void,
    onEnd?: () => void
  ): boolean {
    const SpeechRec =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRec) {
      onError('Speech recognition is not supported in this browser.');
      return false;
    }

    // Stop previous instance if still alive
    this.stopListening();

    try {
      const recognition = new SpeechRec();
      this.activeRecognition = recognition;

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.lang = lang === 'ml' ? 'ml-IN' : 'en-IN';

      let receivedResult = false;

      recognition.onresult = (event: any) => {
        receivedResult = true;
        const transcript = event.results?.[0]?.[0]?.transcript?.trim();
        if (transcript) {
          onResult(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        const errType = event.error;
        let userMessage = 'Speech recognition error.';

        if (errType === 'not-allowed' || errType === 'service-not-allowed') {
          userMessage =
            lang === 'ml'
              ? 'മൈക്രോഫോൺ അനുമതി ലഭ്യമായില്ല. ദയവായി മൈക്ക് പെർമിഷൻ നൽകുക.'
              : 'Microphone access was denied or unavailable in this window.';
        } else if (errType === 'no-speech') {
          userMessage =
            lang === 'ml'
              ? 'ശബ്ദം തിരിച്ചറിഞ്ഞില്ല. വീണ്ടും സംസാരിക്കുക.'
              : 'No speech was detected. Please try speaking again.';
        } else if (errType === 'network') {
          userMessage =
            lang === 'ml'
              ? 'നെറ്റ്‌വർക്ക് കണക്ഷൻ പരിശോധിക്കുക.'
              : 'Speech recognition network error.';
        } else if (errType === 'audio-capture') {
          userMessage =
            lang === 'ml'
              ? 'മൈക്രോഫോൺ കണ്ടെത്താനായില്ല.'
              : 'No microphone was found on this device.';
        }

        onError(userMessage);
      };

      recognition.onend = () => {
        if (this.activeRecognition === recognition) {
          this.activeRecognition = null;
        }
        if (onEnd) onEnd();
      };

      recognition.start();
      return true;
    } catch (err: any) {
      this.activeRecognition = null;
      const msg = err?.message || 'Unable to start microphone.';
      onError(msg);
      return false;
    }
  }

  public stopListening(): void {
    if (this.activeRecognition) {
      try {
        this.activeRecognition.stop();
      } catch {
        try {
          this.activeRecognition.abort();
        } catch {
          // Ignore
        }
      }
      this.activeRecognition = null;
    }
  }
}

export const speechService = new SpeechService();
