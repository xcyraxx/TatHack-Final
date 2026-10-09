/**
 * Speech Service
 * Wraps SpeechSynthesis and optional SpeechRecognition with graceful fallbacks.
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
  private recognition: any = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }

    if (typeof window !== 'undefined') {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        try {
          this.recognition = new SpeechRec();
          this.recognition.continuous = false;
          this.recognition.interimResults = false;
        } catch {
          this.recognition = null;
        }
      }
    }
  }

  public isSynthesisSupported(): boolean {
    return Boolean(this.synth);
  }

  public isRecognitionSupported(): boolean {
    return Boolean(this.recognition);
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

    this.stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'ml' ? 'ml-IN' : 'en-IN';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Pick best available voice if possible
    const voices = this.synth.getVoices();
    if (lang === 'ml') {
      const mlVoice = voices.find((v) => v.lang.startsWith('ml'));
      if (mlVoice) utterance.voice = mlVoice;
    } else {
      const enVoice = voices.find((v) => v.lang.startsWith('en-IN') || v.lang.startsWith('en-GB') || v.lang.startsWith('en'));
      if (enVoice) utterance.voice = enVoice;
    }

    utterance.onend = () => {
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      this.currentUtterance = null;
      if (onError) onError(e);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
    return true;
  }

  public stopSpeaking(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    return Boolean(this.synth && this.synth.speaking);
  }

  public startListening(
    lang: 'en' | 'ml' = 'en',
    onResult: (transcript: string) => void,
    onError: (error: string) => void,
    onEnd?: () => void
  ): boolean {
    if (!this.recognition) {
      onError('Speech recognition is not supported or permission was denied.');
      return false;
    }

    try {
      this.recognition.lang = lang === 'ml' ? 'ml-IN' : 'en-IN';

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onResult(transcript);
        }
      };

      this.recognition.onerror = (event: any) => {
        onError(event.error || 'Speech recognition error.');
      };

      this.recognition.onend = () => {
        if (onEnd) onEnd();
      };

      this.recognition.start();
      return true;
    } catch (err: any) {
      onError(err.message || 'Unable to start microphone.');
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
    }
  }
}

export const speechService = new SpeechService();
