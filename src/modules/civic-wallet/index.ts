import { FieldDefinition } from '../../types';

export interface CivicWalletFieldMetadata {
  key: string;
  label: { en: string; ml: string };
  category: 'personal' | 'address' | 'civic' | 'financial';
  isSensitive: boolean;
  placeholder?: string;
  type?: 'text' | 'date' | 'tel' | 'email' | 'number';
}

export const CIVIC_WALLET_SCHEMA: CivicWalletFieldMetadata[] = [
  // Personal
  {
    key: 'fullname',
    label: { en: 'Full Name', ml: 'പൂർണ്ണ നാമം' },
    category: 'personal',
    isSensitive: false,
    placeholder: 'e.g. Rahul Sharma',
  },
  {
    key: 'dob',
    label: { en: 'Date of Birth', ml: 'ജനനത്തീയതി' },
    category: 'personal',
    isSensitive: false,
    placeholder: 'YYYY-MM-DD',
    type: 'date',
  },
  {
    key: 'phone',
    label: { en: 'Mobile Number', ml: 'മൊബൈൽ നമ്പർ' },
    category: 'personal',
    isSensitive: false,
    placeholder: '10-digit number',
    type: 'tel',
  },
  {
    key: 'email',
    label: { en: 'Email Address', ml: 'ഇമെയിൽ വിലാസം' },
    category: 'personal',
    isSensitive: false,
    placeholder: 'name@example.com',
    type: 'email',
  },

  // Address
  {
    key: 'address',
    label: { en: 'Residential Address', ml: 'മേൽവിലാസം' },
    category: 'address',
    isSensitive: false,
    placeholder: 'House name, Street, Post Office',
  },
  {
    key: 'district',
    label: { en: 'District', ml: 'ജില്ല' },
    category: 'address',
    isSensitive: false,
    placeholder: 'e.g. Thiruvananthapuram, Ernakulam',
  },
  {
    key: 'pincode',
    label: { en: 'Postal PIN Code', ml: 'പിൻ കോഡ്' },
    category: 'address',
    isSensitive: false,
    placeholder: '6-digit PIN',
    type: 'number',
  },

  // Civic & Government
  {
    key: 'income',
    label: { en: 'Annual Family Income (₹)', ml: 'വാർഷിക കുടുംബ വരുമാനം (₹)' },
    category: 'civic',
    isSensitive: false,
    placeholder: 'e.g. 120000',
    type: 'number',
  },
  {
    key: 'caste',
    label: { en: 'Community / Caste', ml: 'ജാതി / വിഭാഗം' },
    category: 'civic',
    isSensitive: false,
    placeholder: 'e.g. General, OBC, SC, ST',
  },
  {
    key: 'ration_card',
    label: { en: 'Ration Card Number', ml: 'റേഷൻ കാർഡ് നമ്പർ' },
    category: 'civic',
    isSensitive: false,
    placeholder: '10-digit Ration Card ID',
  },

  // Financial / Sensitive (Auto-expires)
  {
    key: 'aadhaar',
    label: { en: 'Aadhaar Number', ml: 'ആധാർ നമ്പർ' },
    category: 'financial',
    isSensitive: true,
    placeholder: '12-digit UID',
  },
  {
    key: 'bank_account',
    label: { en: 'Bank Account Number', ml: 'ബാങ്ക് അക്കൗണ്ട് നമ്പർ' },
    category: 'financial',
    isSensitive: true,
    placeholder: 'Account Number',
  },
  {
    key: 'bank_ifsc',
    label: { en: 'Bank IFSC Code', ml: 'ബാങ്ക് IFSC കോഡ്' },
    category: 'financial',
    isSensitive: true,
    placeholder: 'e.g. SBIN0001234',
  },
  {
    key: 'bank_name',
    label: { en: 'Bank Name & Branch', ml: 'ബാങ്കിന്റെ പേരും ശാഖയും' },
    category: 'financial',
    isSensitive: false,
    placeholder: 'e.g. SBI Trivandrum Main',
  },
];

export interface DecryptedWalletPayload {
  entries: Record<string, string>;
  sensitiveExpiryMap: Record<string, number>; // key -> timestamp in ms
  createdAt: string;
  updatedAt: string;
}

export interface EncryptedVaultStorage {
  saltBase64: string;
  ivBase64: string;
  cipherBase64: string;
  updatedAt: string;
  version: number;
}

const STORAGE_KEY = 'vazhika_civic_wallet_encrypted';
const DEFAULT_SENSITIVE_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours

class CivicWalletManager {
  private activePayload: DecryptedWalletPayload | null = null;
  private activeKey: CryptoKey | null = null;
  private activeSaltBase64: string | null = null;
  private changeListeners: (() => void)[] = [];

  private isModalOpen: boolean = false;
  private modalListeners: ((open: boolean) => void)[] = [];

  constructor() {
    // Auto-check expired fields periodically
    if (typeof window !== 'undefined') {
      setInterval(() => {
        if (this.activePayload) {
          this.purgeExpiredFields();
        }
      }, 30000);
    }
  }

  public openModal(): void {
    this.isModalOpen = true;
    this.modalListeners.forEach((l) => {
      try { l(true); } catch { /* ignore */ }
    });
  }

  public closeModal(): void {
    this.isModalOpen = false;
    this.modalListeners.forEach((l) => {
      try { l(false); } catch { /* ignore */ }
    });
  }

  public isModalCurrentlyOpen(): boolean {
    return this.isModalOpen;
  }

  public onModalStateChange(cb: (open: boolean) => void): () => void {
    this.modalListeners.push(cb);
    return () => {
      this.modalListeners = this.modalListeners.filter((l) => l !== cb);
    };
  }

  public subscribe(cb: () => void): () => void {
    this.changeListeners.push(cb);
    return () => {
      this.changeListeners = this.changeListeners.filter((listener) => listener !== cb);
    };
  }

  private notify() {
    this.changeListeners.forEach((cb) => {
      try { cb(); } catch { /* ignore */ }
    });
  }

  public isUnlocked(): boolean {
    return this.activePayload !== null;
  }

  public getPayload(): DecryptedWalletPayload | null {
    if (!this.activePayload) return null;
    this.purgeExpiredFields();
    return this.activePayload;
  }

  /**
   * Check if a vault exists locally on this machine
   */
  public async hasWallet(): Promise<boolean> {
    const raw = await this.readRawStorage();
    return raw !== null;
  }

  /**
   * Unlock the existing vault with the user's master passphrase
   */
  public async unlockWallet(passphrase: string): Promise<boolean> {
    const raw = await this.readRawStorage();
    if (!raw) return false;

    try {
      const salt = this.base64ToBytes(raw.saltBase64);
      const iv = this.base64ToBytes(raw.ivBase64);
      const cipher = this.base64ToBytes(raw.cipherBase64);

      const cryptoKey = await this.deriveKey(passphrase, salt);
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as unknown as BufferSource },
        cryptoKey,
        cipher as unknown as BufferSource
      );

      const jsonStr = new TextDecoder().decode(decryptedBuffer);
      const payload: DecryptedWalletPayload = JSON.parse(jsonStr);

      this.activeKey = cryptoKey;
      this.activeSaltBase64 = raw.saltBase64;
      this.activePayload = payload;
      this.purgeExpiredFields();
      this.notify();
      return true;
    } catch (err) {
      console.warn('Wallet unlock failed (likely invalid passphrase):', err);
      return false;
    }
  }

  /**
   * Create a new wallet or update the entire vault with a passphrase
   */
  public async saveWallet(
    passphrase: string,
    entries: Record<string, string>,
    sensitiveExpiryMinutes: number = 120
  ): Promise<boolean> {
    try {
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const cryptoKey = await this.deriveKey(passphrase, salt);

      const now = Date.now();
      const expiryDuration = sensitiveExpiryMinutes * 60 * 1000;

      // Build expiry map for sensitive fields
      const sensitiveExpiryMap: Record<string, number> = {};
      CIVIC_WALLET_SCHEMA.filter((f) => f.isSensitive).forEach((f) => {
        if (entries[f.key]) {
          sensitiveExpiryMap[f.key] = now + expiryDuration;
        }
      });

      const payload: DecryptedWalletPayload = {
        entries,
        sensitiveExpiryMap,
        createdAt: this.activePayload?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const jsonStr = JSON.stringify(payload);
      const encoded = new TextEncoder().encode(jsonStr);

      const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv as unknown as BufferSource },
        cryptoKey,
        encoded
      );

      const saltBase64 = this.bytesToBase64(salt);
      const storageObj: EncryptedVaultStorage = {
        saltBase64,
        ivBase64: this.bytesToBase64(iv),
        cipherBase64: this.bytesToBase64(new Uint8Array(encryptedBuffer)),
        updatedAt: new Date().toISOString(),
        version: 1,
      };

      await this.writeRawStorage(storageObj);

      this.activeKey = cryptoKey;
      this.activeSaltBase64 = saltBase64;
      this.activePayload = payload;
      this.notify();
      return true;
    } catch (err) {
      console.error('Failed to save civic wallet:', err);
      return false;
    }
  }

  /**
   * Save or update entries when the wallet is already unlocked,
   * without prompting for the passphrase again.
   */
  public async saveUnlockedEntries(
    entries: Record<string, string>,
    sensitiveExpiryMinutes: number = 120
  ): Promise<boolean> {
    if (!this.activeKey || !this.activeSaltBase64) return false;

    try {
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const now = Date.now();
      const expiryDuration = sensitiveExpiryMinutes * 60 * 1000;

      const sensitiveExpiryMap: Record<string, number> = {};
      CIVIC_WALLET_SCHEMA.filter((f) => f.isSensitive).forEach((f) => {
        if (entries[f.key]) {
          sensitiveExpiryMap[f.key] = now + expiryDuration;
        }
      });

      const payload: DecryptedWalletPayload = {
        entries,
        sensitiveExpiryMap,
        createdAt: this.activePayload?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const jsonStr = JSON.stringify(payload);
      const encoded = new TextEncoder().encode(jsonStr);

      const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv as unknown as BufferSource },
        this.activeKey,
        encoded
      );

      const storageObj: EncryptedVaultStorage = {
        saltBase64: this.activeSaltBase64,
        ivBase64: this.bytesToBase64(iv),
        cipherBase64: this.bytesToBase64(new Uint8Array(encryptedBuffer)),
        updatedAt: new Date().toISOString(),
        version: 1,
      };

      await this.writeRawStorage(storageObj);

      this.activePayload = payload;
      this.notify();
      return true;
    } catch (err) {
      console.error('Failed to update civic wallet entries:', err);
      return false;
    }
  }

  /**
   * Lock the wallet and immediately purge in-memory plaintext
   */
  public lockWallet(): void {
    this.activePayload = null;
    this.activeKey = null;
    this.activeSaltBase64 = null;
    this.notify();
  }

  /**
   * Instant destruction: Wipes all local vault data, keys, and memory
   */
  public async wipeAllData(): Promise<void> {
    this.activePayload = null;
    this.activeKey = null;
    this.activeSaltBase64 = null;

    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await new Promise<void>((resolve) => {
        chrome.storage.local.remove([STORAGE_KEY], () => resolve());
      });
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }

    this.notify();
  }

  /**
   * Retrieves a field value from the unlocked wallet with auto-expiry check
   */
  public getValue(key: string): { value: string; isSensitive: boolean; expiresMinutesLeft?: number } | null {
    if (!this.activePayload) return null;
    this.purgeExpiredFields();

    const val = this.activePayload.entries[key];
    if (!val || val.trim() === '') return null;

    const schema = CIVIC_WALLET_SCHEMA.find((s) => s.key === key);
    const isSensitive = schema?.isSensitive || false;

    let expiresMinutesLeft: number | undefined;
    if (isSensitive && this.activePayload.sensitiveExpiryMap[key]) {
      const remaining = this.activePayload.sensitiveExpiryMap[key] - Date.now();
      expiresMinutesLeft = Math.max(1, Math.round(remaining / 60000));
    }

    return { value: val, isSensitive, expiresMinutesLeft };
  }

  /**
   * Intelligently maps an HTML form field definition to a Civic Wallet key
   */
  public matchFieldToKey(field: FieldDefinition): string | null {
    const rawTokens = [
      field.id,
      field.name,
      field.label,
      field.originalId || '',
      field.questionText || '',
    ]
      .join(' ')
      .toLowerCase();

    // Aadhaar
    if (/aadhaar|aadhar|uidai|\buid\b|ആധാർ/i.test(rawTokens)) return 'aadhaar';

    // Bank Account
    if (/account[_\s-]?no|account[_\s-]?number|bank[_\s-]?acc|acc[_\s-]?no|അക്കൗണ്ട്/i.test(rawTokens))
      return 'bank_account';

    // IFSC
    if (/ifsc/i.test(rawTokens)) return 'bank_ifsc';

    // Bank Name
    if (/bank[_\s-]?name|branch/i.test(rawTokens)) return 'bank_name';

    // Ration Card
    if (/ration[_\s-]?card|ration|റേഷൻ/i.test(rawTokens)) return 'ration_card';

    // Annual Income
    if (/annual[_\s-]?income|family[_\s-]?income|income|വരുമാനം/i.test(rawTokens)) return 'income';

    // Caste / Community
    if (/caste|community|category|beneficiary_category|divyang|ജാതി|വിഭാഗം/i.test(rawTokens))
      return 'caste';

    // Date of birth
    if (/dob|birth|date_of_birth|ജനനത്തീയതി/i.test(rawTokens) || field.type === 'date') return 'dob';

    // Mobile / Phone
    if (/phone|mobile|cell|contact_no|tel|മൊബൈൽ/i.test(rawTokens) || field.type === 'tel')
      return 'phone';

    // Email
    if (/email|e-mail|mail|ഇമെയിൽ/i.test(rawTokens) || field.type === 'email') return 'email';

    // PIN code
    if (/pin|pincode|postal[_\s-]?code|zip|പിൻകോഡ്/i.test(rawTokens)) return 'pincode';

    // District
    if (/district|dist\b|റവന്യൂ ജില്ല|ജില്ല/i.test(rawTokens)) return 'district';

    // Address
    if (/address|correspondence|permanent_address|residential|street|മേൽവിലാസം|വിലാസം/i.test(rawTokens))
      return 'address';

    // Full name
    if (/fullname|full_name|applicant_name|name|legal_name|പേര്/i.test(rawTokens) && !/bank|father|mother/i.test(rawTokens))
      return 'fullname';

    return null;
  }

  /**
   * Purge expired sensitive fields from active payload
   */
  private purgeExpiredFields(): void {
    if (!this.activePayload) return;
    const now = Date.now();
    let changed = false;

    Object.entries(this.activePayload.sensitiveExpiryMap).forEach(([key, expiry]) => {
      if (now >= expiry) {
        if (this.activePayload!.entries[key]) {
          delete this.activePayload!.entries[key];
          delete this.activePayload!.sensitiveExpiryMap[key];
          changed = true;
        }
      }
    });

    if (changed) {
      this.notify();
    }
  }

  // --- WebCrypto & Storage Helpers ---

  private async deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as unknown as BufferSource,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private base64ToBytes(base64: string): Uint8Array {
    const binary = window.atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  private async readRawStorage(): Promise<EncryptedVaultStorage | null> {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      try {
        const result = await new Promise<any>((resolve) => {
          chrome.storage.local.get([STORAGE_KEY], (res) => {
            if (chrome.runtime?.lastError) {
              console.warn('Chrome storage get error:', chrome.runtime.lastError);
              resolve(null);
            } else {
              resolve(res);
            }
          });
        });
        if (result?.[STORAGE_KEY]) {
          return result[STORAGE_KEY] as EncryptedVaultStorage;
        }
      } catch (err) {
        console.warn('Chrome storage local get threw:', err);
      }
    }

    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          return JSON.parse(raw);
        }
      } catch {
        return null;
      }
    }
    return null;
  }

  private async writeRawStorage(data: EncryptedVaultStorage): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      try {
        await new Promise<void>((resolve) => {
          chrome.storage.local.set({ [STORAGE_KEY]: data }, () => resolve());
        });
      } catch (err) {
        console.warn('Chrome storage local set error:', err);
      }
    }

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (err) {
        console.warn('LocalStorage set error:', err);
      }
    }
  }
}

export const civicWallet = new CivicWalletManager();
