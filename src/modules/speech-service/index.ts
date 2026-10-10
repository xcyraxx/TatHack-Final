/**
 * Speech Service
 * Wraps TTS and STT with graceful fallbacks.
 * Fully on-device, local-first Web Speech APIs — no external AI/cloud dependencies.
 *
 * KEY ARCHITECTURE DECISION:
 * Chrome blocks both speechSynthesis (silently fails) and SpeechRecognition
 * (throws not-allowed) inside extension Side Panel / Popup pages.
 * Both TTS and STT are therefore DELEGATED to the content script running on
 * the user's active web page, where browser APIs work normally.
 * In standalone web contexts (dev workbench), local APIs are used directly.
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
  private voicesLoaded: boolean = false;
  private hasRecognitionSupport: boolean = false;
  private resumeTimer: any = null;

  // Delegated STT state
  private activeRuntimeListener: ((msg: any, sender?: any, sendResponse?: any) => void) | null = null;
  private activeDelegatedTabId: number | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
      // Some Chrome builds never fire voiceschanged in extension pages
      setTimeout(() => { if (!this.voicesLoaded) this.loadVoices(); }, 300);
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
        this.voicesLoaded = true;
      }
    }
    return this.voices;
  }

  private isExtensionEnvironment(): boolean {
    return typeof chrome !== 'undefined' && Boolean(chrome.tabs && chrome.tabs.sendMessage);
  }

  public isSynthesisSupported(): boolean {
    return Boolean(this.synth) || this.isExtensionEnvironment();
  }

  public isRecognitionSupported(): boolean {
    return this.isExtensionEnvironment() || this.hasRecognitionSupport;
  }

  // ─── Neural Offline TTS (Level 1) ────────────────────────────────────

  private neuralSynthesizer: any = null;
  private isNeuralReady: boolean = false;
  private isNeuralDownloading: boolean = false;
  private audioContext: AudioContext | null = null;
  private activeNeuralSource: AudioBufferSourceNode | null = null;
  private neuralProgressCallback: ((progress: number, file: string) => void) | null = null;

  public get isNeuralModelReady(): boolean {
    return this.isNeuralReady;
  }

  public get isNeuralModelDownloading(): boolean {
    return this.isNeuralDownloading;
  }

  public onNeuralProgress(callback: (progress: number, file: string) => void) {
    this.neuralProgressCallback = callback;
  }

  private audioCache = new Map<string, { audio: Float32Array; samplingRate: number }>();
  private synthesizingListeners: ((synthesizing: boolean) => void)[] = [];
  private isCurrentlySynthesizing: boolean = false;

  public get isSynthesizing(): boolean {
    return this.isCurrentlySynthesizing;
  }

  public onSynthesizingChange(callback: (synthesizing: boolean) => void) {
    this.synthesizingListeners.push(callback);
    return () => {
      this.synthesizingListeners = this.synthesizingListeners.filter((cb) => cb !== callback);
    };
  }

  private setSynthesizing(synthesizing: boolean) {
    this.isCurrentlySynthesizing = synthesizing;
    this.synthesizingListeners.forEach((cb) => {
      try { cb(synthesizing); } catch { /* ignore */ }
    });
  }

  public async downloadNeuralModel(): Promise<boolean> {
    if (this.isNeuralReady) return true;
    if (this.isNeuralDownloading) return false;

    this.isNeuralDownloading = true;
    try {
      // Lazily import transformers.js to avoid bundle bloat
      const { pipeline, env } = await import('@xenova/transformers');
      
      env.allowLocalModels = true;
      env.allowRemoteModels = false;
      env.localModelPath = chrome.runtime.getURL('models');
      env.useBrowserCache = false;
      env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL('wasm/');
      
      // Accelerate execution using SIMD WebAssembly
      if (env.backends?.onnx?.wasm) {
        env.backends.onnx.wasm.simd = true;
        const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 2 : 2;
        env.backends.onnx.wasm.numThreads = Math.min(4, Math.max(1, cores - 1));
      }

      this.neuralSynthesizer = await pipeline('text-to-speech', 'mms-tts-mal', {
        quantized: false,
        progress_callback: (data: any) => {
          if (this.neuralProgressCallback) {
            if (data.status === 'progress' || data.status === 'downloading') {
              this.neuralProgressCallback(data.progress || 0, data.file || '');
            }
          }
        }
      });

      // Warm up model with a single token so subsequent user speech requests run with pre-allocated tensors
      try {
        await this.neuralSynthesizer('ആ');
      } catch {
        /* ignore warmup */
      }

      this.isNeuralReady = true;
      this.isNeuralDownloading = false;
      return true;
    } catch (err) {
      console.error('Failed to load neural model:', err);
      this.isNeuralDownloading = false;
      return false;
    }
  }

  private playRawAudio(
    audioData: Float32Array,
    samplingRate: number,
    onEnd?: () => void,
    onError?: (error: any) => void
  ) {
    try {
      if (!this.audioContext) {
        this.audioContext = new AudioContext({ sampleRate: samplingRate });
      } else if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const buffer = this.audioContext.createBuffer(1, audioData.length, samplingRate);
      buffer.getChannelData(0).set(audioData);

      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);

      source.onended = () => {
        this.activeNeuralSource = null;
        if (onEnd) onEnd();
      };

      this.activeNeuralSource = source;
      source.start();
    } catch (err) {
      if (onError) onError(err);
    }
  }

  private async synthesizeAudioChunk(text: string): Promise<{ audio: Float32Array; samplingRate: number }> {
    const cacheKey = text.trim();
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey)!;
    }

    const out = await this.neuralSynthesizer(text);
    const result = {
      audio: out.audio as Float32Array,
      samplingRate: out.sampling_rate as number,
    };

    // Store in LRU-style cache (limit 50 items)
    if (this.audioCache.size > 50) {
      const firstKey = this.audioCache.keys().next().value;
      if (firstKey) this.audioCache.delete(firstKey);
    }
    this.audioCache.set(cacheKey, result);

    return result;
  }

  private async speakNeural(text: string, onEnd?: () => void, onError?: (error: any) => void): Promise<void> {
    console.info('🎙️ [SpeechService] Using Offline Neural Model (MMS-TTS-MAL) with caching & chunk streaming.');
    if (!this.neuralSynthesizer) {
      if (onError) onError('Neural model not loaded');
      return;
    }

    try {
      this.stopSpeaking();
      this.setSynthesizing(true);

      const cleaned = text.trim();
      // Split into sentences so short sentences play immediately without waiting for entire block
      const sentences = cleaned
        .split(/(?<=[.?!;:\n])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      if (sentences.length <= 1) {
        const item = await this.synthesizeAudioChunk(cleaned);
        this.setSynthesizing(false);
        this.playRawAudio(item.audio, item.samplingRate, onEnd, onError);
        return;
      }

      // Stream sentences sequentially: start synthesizing first sentence immediately
      let currentIndex = 0;
      const playNextSentence = async () => {
        if (currentIndex >= sentences.length) {
          if (onEnd) onEnd();
          return;
        }

        const sentenceText = sentences[currentIndex++];
        try {
          if (currentIndex === 1) this.setSynthesizing(true);
          const chunk = await this.synthesizeAudioChunk(sentenceText);
          if (currentIndex === 1) this.setSynthesizing(false);

          this.playRawAudio(chunk.audio, chunk.samplingRate, () => {
            playNextSentence();
          }, onError);
        } catch (err) {
          this.setSynthesizing(false);
          if (onError) onError(err);
        }
      };

      await playNextSentence();
    } catch (err) {
      this.setSynthesizing(false);
      console.error('Neural TTS failed:', err);
      if (onError) onError(err);
    }
  }

  // ─── TTS ─────────────────────────────────────────────────────────────

  /**
   * Speak text aloud.
   * In extension contexts → delegates to content script on the active tab.
   * In web contexts → uses local speechSynthesis directly.
   */
  public speak(
    text: string,
    lang: 'en' | 'ml' = 'en',
    onEnd?: () => void,
    onError?: (error: any) => void
  ): boolean {
    const trimmed = text.trim();
    if (!trimmed) {
      if (onEnd) onEnd();
      return true;
    }

    // Use neural offline TTS if downloaded and language is Malayalam
    if (lang === 'ml' && this.isNeuralReady) {
      this.speakNeural(trimmed, onEnd, onError);
      return true;
    }

    // Extension environment → delegate to content script on the active tab
    if (this.isExtensionEnvironment()) {
      this.stopSpeaking();
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (!tab || tab.id === undefined) {
          if (onError) onError('No active tab found for text-to-speech.');
          return;
        }
        console.info('🎙️ [SpeechService] Using Browser Fallback TTS (Extension Content Script).');
        chrome.tabs.sendMessage(
          tab.id,
          { type: 'VAZHIKA_SPEAK', text: trimmed, lang },
          (response) => {
            if (chrome.runtime.lastError) {
              if (onError) onError(chrome.runtime.lastError.message);
            }
            // Content script acknowledged; audio will play on the page
          }
        );
      });
      return true;
    }

    // Standalone web environment → use local speechSynthesis
    return this.speakLocal(trimmed, lang, onEnd, onError);
  }

  private speakLocal(
    text: string,
    lang: 'en' | 'ml',
    onEnd?: () => void,
    onError?: (error: any) => void
  ): boolean {
    if (!this.synth) {
      if (onError) onError('Speech synthesis not supported in this browser.');
      return false;
    }

    // Stop any current speech
    this.stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Pick best voice
    const currentVoices = this.voices.length > 0 ? this.voices : this.loadVoices();
    if (lang === 'ml') {
      const mlVoice = currentVoices.find((v) => v.lang && v.lang.toLowerCase().startsWith('ml'));
      if (mlVoice) {
        utterance.voice = mlVoice;
        utterance.lang = mlVoice.lang;
      } else {
        const inVoice = currentVoices.find((v) => v.lang && v.lang.toLowerCase().startsWith('en-in'));
        if (inVoice) {
          utterance.voice = inVoice;
          utterance.lang = inVoice.lang;
        } else if (currentVoices.length > 0) {
          const def = currentVoices.find((v) => v.default) || currentVoices[0];
          utterance.voice = def;
          utterance.lang = def.lang || 'en-US';
        } else {
          utterance.lang = 'en-US';
        }
      }
    } else {
      const priorities = ['en-in', 'en-gb', 'en-us'];
      let found = false;
      for (const prefix of priorities) {
        const v = currentVoices.find((voice) => voice.lang && voice.lang.toLowerCase().startsWith(prefix));
        if (v) {
          utterance.voice = v;
          utterance.lang = v.lang;
          found = true;
          break;
        }
      }
      if (!found) {
        const anyEn = currentVoices.find((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
        if (anyEn) {
          utterance.voice = anyEn;
          utterance.lang = anyEn.lang;
        } else if (currentVoices.length > 0) {
          const def = currentVoices.find((v) => v.default) || currentVoices[0];
          utterance.voice = def;
          utterance.lang = def.lang || 'en-US';
        } else {
          utterance.lang = 'en-US';
        }
      }
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
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        if (onError) onError(e);
      }
    };

    // Prevent Chrome GC from collecting the utterance
    this.currentUtterance = utterance;

    // Chromium long-speech keep-alive
    this.resumeTimer = setInterval(() => {
      if (this.synth && this.synth.speaking) {
        try { this.synth.pause(); this.synth.resume(); } catch { /* ignore */ }
      } else {
        cleanup();
      }
    }, 10000);

    try {
      if (this.synth.paused) {
        this.synth.resume();
      }
      console.info('🎙️ [SpeechService] Using Browser Fallback TTS (Direct Web Speech API).');
      this.synth.speak(utterance);
      return true;
    } catch (err) {
      cleanup();
      if (onError) onError(err);
      return false;
    }
  }

  public stopSpeaking(): void {
    if (this.activeNeuralSource) {
      try {
        this.activeNeuralSource.stop();
      } catch { /* ignore */ }
      this.activeNeuralSource = null;
    }

    if (this.resumeTimer) {
      clearInterval(this.resumeTimer);
      this.resumeTimer = null;
    }

    // Stop delegated TTS in content script
    if (this.isExtensionEnvironment()) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab && tab.id !== undefined) {
          try {
            console.info('🎙️ [SpeechService] Using Browser Fallback TTS (Extension Content Script).');
        chrome.tabs.sendMessage(tab.id, { type: 'VAZHIKA_STOP_SPEAKING' });
          } catch { /* ignore */ }
        }
      });
    }

    // Stop local TTS
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch { /* ignore */ }
      this.currentUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    if (this.activeNeuralSource) return true;
    return Boolean(this.synth && this.synth.speaking);
  }

  // ─── STT ─────────────────────────────────────────────────────────────

  /**
   * Start speech-to-text recognition.
   * In extension contexts → delegates to content script on active tab.
   * In web contexts → uses local SpeechRecognition.
   */
  public startListening(
    lang: 'en' | 'ml' = 'en',
    onResult: (transcript: string) => void,
    onError: (error: string) => void,
    onEnd?: () => void
  ): boolean {
    this.stopListening();

    // Extension environment → delegate to active tab content script
    if (this.isExtensionEnvironment()) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (!tab || tab.id === undefined) {
          onError('No active browser tab found for microphone capture.');
          if (onEnd) onEnd();
          return;
        }

        const tabId = tab.id;
        this.activeDelegatedTabId = tabId;

        const messageListener = (msg: any, _sender?: any, _sendResponse?: any) => {
          if (!msg || !msg.type) return;
          if (msg.type === 'VAZHIKA_DICTATION_RESULT') {
            onResult(msg.transcript);
          } else if (msg.type === 'VAZHIKA_DICTATION_ERROR') {
            onError(msg.error);
          } else if (msg.type === 'VAZHIKA_DICTATION_END') {
            this.cleanupDelegatedListener();
            if (onEnd) onEnd();
          }
        };

        this.activeRuntimeListener = messageListener;
        chrome.runtime.onMessage.addListener(messageListener);

        console.info('🎙️ [SpeechService] Using Browser Fallback TTS (Extension Content Script).');
        chrome.tabs.sendMessage(
          tabId,
          { type: 'VAZHIKA_START_DICTATION', lang },
          (response) => {
            if (chrome.runtime.lastError || !response?.success) {
              this.cleanupDelegatedListener();
              const errMsg = chrome.runtime.lastError?.message || 'Could not communicate with tab.';
              onError(`Microphone request failed: ${errMsg}`);
              if (onEnd) onEnd();
            }
          }
        );
      });

      return true;
    }

    // Standalone web environment → use local SpeechRecognition
    const SpeechRec =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRec) {
      onError('Speech recognition is not supported in this browser.');
      return false;
    }

    try {
      const recognition = new SpeechRec();
      this.activeRecognition = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.lang = lang === 'ml' ? 'ml-IN' : 'en-IN';

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript?.trim();
        if (transcript) onResult(transcript);
      };

      recognition.onerror = (event: any) => {
        const errType = event.error;
        let userMessage = 'Speech recognition error.';
        if (errType === 'not-allowed' || errType === 'service-not-allowed') {
          userMessage = lang === 'ml'
            ? 'മൈക്രോഫോൺ അനുമതി ലഭ്യമായില്ല. ദയവായി മൈക്ക് പെർമിഷൻ നൽകുക.'
            : 'Microphone access was denied or unavailable.';
        } else if (errType === 'no-speech') {
          userMessage = lang === 'ml'
            ? 'ശബ്ദം തിരിച്ചറിഞ്ഞില്ല. വീണ്ടും സംസാരിക്കുക.'
            : 'No speech was detected. Please try speaking again.';
        } else if (errType === 'network') {
          userMessage = lang === 'ml'
            ? 'നെറ്റ്‌വർക്ക് കണക്ഷൻ പരിശോധിക്കുക.'
            : 'Speech recognition network error.';
        } else if (errType === 'audio-capture') {
          userMessage = lang === 'ml'
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
      onError(err?.message || 'Unable to start microphone.');
      return false;
    }
  }

  private cleanupDelegatedListener(): void {
    if (this.activeRuntimeListener && typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.removeListener(this.activeRuntimeListener);
      this.activeRuntimeListener = null;
    }
    this.activeDelegatedTabId = null;
  }

  public stopListening(): void {
    // Stop delegated (extension) recognition
    if (this.activeDelegatedTabId !== null && typeof chrome !== 'undefined' && chrome.tabs) {
      try {
        console.info('🎙️ [SpeechService] Using Browser Fallback TTS (Extension Content Script).');
        chrome.tabs.sendMessage(this.activeDelegatedTabId, { type: 'VAZHIKA_STOP_DICTATION' });
      } catch { /* ignore */ }
      this.cleanupDelegatedListener();
    }

    // Stop local recognition
    if (this.activeRecognition) {
      try { this.activeRecognition.stop(); } catch {
        try { this.activeRecognition.abort(); } catch { /* ignore */ }
      }
      this.activeRecognition = null;
    }
  }
}

export const speechService = new SpeechService();
