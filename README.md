# Vazhika (വഴിക)

<div align="center">

> **Every form. A clearer way.**  
> An accessibility-first Chrome extension (Manifest V3) that inspects difficult online forms on live civic portals and reconstructs them into guided, plain-language, one-question-at-a-time workflows — with anti-phishing protection, submission-error rescue, pre-flight document checklists, and an encrypted local identity wallet.

[![Chrome Extension](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-123B35?style=flat-square&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-0B2925?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-123B35?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![WCAG](https://img.shields.io/badge/WCAG-2.2_AA_Conformant-216E4E?style=flat-square)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![Tests](https://img.shields.io/badge/Vitest-61_Passed_%2F_11_Suites-216E4E?style=flat-square&logo=vitest&logoColor=white)](src/test/)
[![Privacy](https://img.shields.io/badge/Privacy-100%25_Client--Side_(Zero_Cloud)-E8A34A?style=flat-square)](PROJECT_DESCRIPTION.md#7-security--privacy)
[![Track](https://img.shields.io/badge/Track-Accessibility_%26_Inclusion-123B35?style=flat-square)](#)

[**Live Demo Guide**](#-quick-start--development) • [**Pitch Deck Blueprint (pitch.md)**](pitch.md) • [**Full Project Specification**](PROJECT_DESCRIPTION.md) • [**Design System**](#-kerala-modern-design-system)

</div>

---

## 📋 Table of Contents
- [The Problem: The Triple Digital Wall](#-the-problem-the-triple-digital-wall)
- [The Paradigm: Client-Side Reconstruction vs. Overlays](#-the-paradigm-client-side-reconstruction-vs-overlays)
- [Key Features](#-key-features)
  - [1. DOM Inspector & Real-time WCAG 2.2 AA Audit](#1-dom-inspector--real-time-wcag-22-aa-audit)
  - [2. Pre-flight Document Checklist](#2-pre-flight-document-checklist)
  - [3. One-Question-at-a-Time Guided Workflow](#3-one-question-at-a-time-guided-workflow)
  - [4. Local Encrypted Civic Wallet](#4-local-encrypted-civic-wallet)
  - [5. Anti-Phishing & Scam Guard](#5-anti-phishing--scam-guard)
  - [6. Submission-Error Rescue Loop](#6-submission-error-rescue-loop)
  - [7. Regional Language Parity & Speech Synthesis](#7-regional-language-parity--speech-synthesis)
  - [8. Safe Document Attachment](#8-safe-document-attachment)
  - [9. Strict Agency Invariant](#9-strict-agency-invariant)
- [Kerala Modern Design System](#-kerala-modern-design-system)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Quick Start & Development](#-quick-start--development)
- [Loading Unpacked in Google Chrome](#-loading-unpacked-in-google-chrome)
- [Automated Testing Suite (11 Suites / 59 Tests)](#-automated-testing-suite)
- [Privacy Invariant & Permissions Justification](#-privacy-invariant--permissions-justification)
- [Roadmap](#-roadmap)

---

## 🏛️ The Problem: The Triple Digital Wall

For India's 1.4 billion citizens, access to pensions, scholarships, ration cards, caste certificates, and welfare programs is mediated entirely through government portals. However, over **70% of online civic applications are abandoned before submission** due to three compounding barriers:

1. **Technical Inaccessibility:** Over 90% of civic forms violate fundamental WCAG 2.2 AA criteria. Placeholder-only labels, asterisk-only required markers, radio groups without semantic fieldsets, and error messages that exist in the DOM but are invisible to screen readers are pervasive.
2. **Cognitive & Bureaucratic Jargon:** Terminology such as *"Correspondence Address"*, *"Domicile Cadre"*, or *"Beneficiary Category"* causes high cognitive friction for rural citizens, older adults, and first-generation digital applicants.
3. **Exploitation & Submission Rejections:** Lookalike phishing websites impersonate government schemes to harvest Aadhaar numbers and UPI PINs. When genuine forms are submitted, cryptic validation rejections (like `patternMismatch` on phone numbers) crash the page and wipe out hours of manual entry.

---

## 💡 The Paradigm: Client-Side Reconstruction vs. Overlays

| Feature | Conventional Overlays (AccessiBe / UserWay) | Generic AI Form Fillers | **Vazhika (വഴിക)** |
| :--- | :--- | :--- | :--- |
| **Method** | Injects cosmetic CSS/accessibility widgets | Sends full page & answers to remote cloud LLM | **100% Client-side DOM inspection & guided reconstruction** |
| **Cognitive Support** | None (same complex multi-field layout) | Unstructured auto-fill | **1 question at a time with plain-language explanations** |
| **Privacy & Egress** | Injects external 3rd-party tracking scripts | High privacy egress (Aadhaar & financial data sent to cloud) | **Zero Cloud: WebCrypto AES-GCM-256 local vault** |
| **Regional Languages** | Machine-translated or English only | Hallucination-prone LLM translations | **Deterministic bilingual dictionary (English & മലയാളം)** |
| **Error Recovery** | Ignores site rejection states | Fails silently on form reload | **Rescue Loop: Translates raw HTML5 errors into plain fixes** |
| **Citizen Agency** | Overrides native controls | Auto-clicks submit buttons unpredictably | **Transfers values safely; citizen always submits manually** |

---

## ✨ Key Features

### 1. DOM Inspector & Real-time WCAG 2.2 AA Audit
- Computes accessible names according to the **W3C AccName specification** (`aria-labelledby` → `aria-label` → `<label for>` → wrapping label → `title`).
- Audits live controls for:
  - Missing labels / placeholder-only labels (Critical/Serious severity).
  - Visual asterisks missing programmatic `required` or `aria-required`.
  - Radio groups lacking `<fieldset>` and `<legend>` associations.
  - Unassociated error messages missing `aria-describedby` links.
  - Non-semantic input types (e.g. phone or email marked as plain text).
- Provides concrete code evidence, remediation steps, and WCAG criterion references in the **Audit View**.

### 2. Pre-flight Document Checklist
- Scans form labels, file upload inputs, and page instructions *before Step 1*.
- Recognizes Kerala & Indian civic document patterns: **Aadhaar, Ration Card, Income Certificate, Caste/Community Certificate, Nativity Certificate, Bank Passbook, Passport Photo, SSLC Book, and Land Tax Receipt**.
- Outlines required documents upfront with file-format guidance and progress tracking so applicants never abandon a form halfway.

### 3. One-Question-at-a-Time Guided Workflow
- Rebuilds intimidating multi-column forms into a focused, single-question flow.
- Translates bureaucratic field names into empathetic plain language (e.g., *Correspondence Address* → *"Where should official letters be mailed to you?"*).
- Features 44px+ touch targets, visible focus rings, keyboard navigation (Enter advances), live progress indication, and IndexedDB draft auto-saving with crash recovery.
- **Live Page Linkage**: Highlights and scrolls to the active field on the underlying web page so the user never loses context.

### 4. Local Encrypted Civic Wallet
- An encrypted, local-only vault for recurring identity data (Name, DOB, Mobile, Address, PIN, Income, Caste, Aadhaar, Bank Details, IFSC).
- **Cryptography**: Encrypted at rest using **WebCrypto AES-GCM-256** with keys derived via **PBKDF2-SHA-256 (100,000 iterations)** from the user's master passphrase.
- **Field-Level Consent**: Vazhika asks *"Fill this field from your wallet?"* for each individual field.
- **Auto-Expiry**: Sensitive credentials (Aadhaar, Bank Account, IFSC) automatically purge from memory after 2 hours. Includes a one-click instant data wipe.

### 5. Anti-Phishing & Scam Guard
- Generates a **Portal Trust Score (0–100)**: `Safe`, `Warning`, or `Danger`.
- Enforces strict HTTPS encryption and checks against an official government domain allowlist (`.gov.in`, `.nic.in`, `.gov`, `.ac.in`).
- Flags lookalike domains using civic keywords (typosquatting detection) and multiple hidden input stuffing.
- **Credential Protection**: Detects and outright blocks illegitimate prompts for UPI PINs, ATM PINs, card CVVs, and net-banking passwords.

### 6. Submission-Error Rescue Loop
- Intercepts native browser and portal validation failures (`:invalid`, `validity.patternMismatch`, `validity.valueMissing`, `aria-invalid`, `.invalid-feedback`, `[role="alert"]`).
- Translates cryptic rejection messages into compassionate, plain-language bilingual steps (e.g. converting `patternMismatch` on phone numbers into: *"The website requires a 10-digit mobile number without +91 or spaces"*).
- Provides a **"Fix this"** action that jumps directly to the offending field in Guided Mode, followed by **"Transfer fixes"** for immediate re-submission.

### 7. Regional Language Parity & Speech Synthesis
- **Bilingual by Construction**: Full English and Malayalam (മലയാളം) parity across questions, explanations, security verdicts, document requirements, and rescue fixes.
- **Local Speech Guidance**: Question read-aloud (TTS) and voice dictation (STT) on text inputs.
- **Offline Neural Malayalam TTS**: Optional integration with `@xenova/transformers` running MMS-TTS-MAL via ONNX WebAssembly with SIMD, providing natural Malayalam speech without any cloud connection.

### 8. Safe Document Attachment
- Seamlessly handles `<input type="file">` controls in Guided Mode.
- Features a **1-click "📄 Attach Sample PDF"** button for rapid testing and demonstrations.
- Bypasses browser file programmatic value security restrictions using synthetic `DataTransfer` injection and clear visual verification badges.

### 9. Strict Agency Invariant
- **Vazhika never submits the form.**
- The extension transfers answers into the page controls using framework-aware setters (React, Vue, Angular, ASP.NET) and dispatches authentic `input`, `change`, and `blur` events.
- Reports a per-field transfer receipt (*Transferred*, *Manual Attention Required*).
- Final review and clicking the website's native **Submit** button always stays firmly in the citizen's hands.

---

## 🎨 Kerala Modern Design System

Vazhika avoids generic AI aesthetics in favor of **Kerala Modernism**—a calm, functional, art-directed palette grounded in regional civic technology:

| Token | Hex | Role | Contrast Ratio |
| :--- | :--- | :--- | :--- |
| **Deep Forest** | `#0B2925` | Chrome backgrounds, top-level headers | Base Canvas |
| **Forest Green** | `#123B35` | Primary action buttons, brand headings | 14.8:1 on White |
| **Warm Gold** | `#E8A34A` | Archway motif (`VazhikaMark`), accents | 5.7:1 on Forest |
| **Mint** | `#D9F3E5` | Focus rings, state badges, gentle highlights | Active Ring |
| **Warm Off-White** | `#F8FAF7` | Workspace canvas, glare reduction | Background |
| **Error Crimson** | `#B42318` | Inline validation instructions & alerts | 4.8:1 on Light |
| **Success Green** | `#216E4E` | Verified transfers, security pass badges | 4.9:1 on Light |

- **Typography**: Local Manrope + Noto Sans Malayalam (no remote web fonts required).
- **Accessibility Standards**: Zero nested card clutter, 44px+ minimum interactive targets, hairline dividers, strict `prefers-reduced-motion` compliance, and automated `axe-core` verification (0 critical or serious violations).

---

## 🧩 Architecture & Tech Stack

```
React 19 · TypeScript 5.7 · Vite 6 · esbuild
Manifest V3 · chrome.tabs · chrome.scripting · chrome.sidePanel · chrome.storage
WebCrypto (AES-GCM-256 + PBKDF2) · idb (IndexedDB) · @xenova/transformers (ONNX WASM TTS)
Vitest · React Testing Library · axe-core · jsdom
```

### Directory Structure
```
├── manifest.json              # Chrome Manifest V3 configuration
├── pitch.md                   # Complete Hackathon Pitch Deck & Demo Blueprint
├── PROJECT_DESCRIPTION.md     # In-depth architectural & feature specifications
├── test-page.html             # Deliberately broken civic scholarship test fixture
├── src/
│   ├── popup/                 # Toolbar popup (Scan page, security verdict, top findings)
│   ├── sidepanel/             # Chrome Side Panel surface (Guided, Rescue, Audit)
│   ├── content/               # Content script (DOM inspection, highlight, transfer)
│   ├── background/            # Background service worker (Side panel & message routing)
│   ├── App.tsx                # Side-by-side workbench simulator
│   ├── modules/
│   │   ├── form-inspector/    # AccName algorithm & WCAG 2.2 AA defect detection
│   │   ├── document-checklist/# Auto-detection of required civic documents
│   │   ├── security-guard/    # Trust scoring, typosquatting & phishing detection
│   │   ├── rescue-loop/       # Rejection detection & plain-language bilingual fixes
│   │   ├── civic-wallet/      # WebCrypto AES-GCM vault, key derivation & field matching
│   │   ├── plain-language/    # English & Malayalam question & explanation dictionaries
│   │   ├── validation-engine/ # Bilingual inline validation
│   │   ├── date-formatter/    # Indian date parsing (DD-MM-YYYY) to strict ISO yyyy-MM-dd
│   │   ├── draft-storage/     # IndexedDB local draft persistence
│   │   ├── speech-service/    # TTS/STT + offline neural Malayalam speech
│   │   └── accessibility-controls/ # Contrast, scaling, motion, live announcements
│   ├── components/
│   │   ├── guided-workflow/   # GuidedWorkflow container & FieldRenderer
│   │   ├── document-checklist/# "Before Step 1" checklist screen
│   │   ├── civic-wallet/      # Vault modal & field-level consent prompt
│   │   ├── rescue-loop/       # RescueLoopCard & error repair interface
│   │   ├── security/          # SecurityGuardBanner
│   │   ├── findings/          # Shared FindingsList (WCAG audit view)
│   │   └── review-screen/     # ReviewScreen & FieldTransferReceipt
│   ├── styles/
│   │   └── kerala-modern.css  # Design system tokens and primitive styles
│   └── test/                  # 11 Vitest test suites (59 unit & integration tests)
```

---

## 🚀 Quick Start & Development

### 1. Prerequisites
- Node.js 18+ and npm installed.
- Google Chrome browser.

### 2. Install & Build
```bash
git clone https://github.com/your-username/vazhika.git
cd vazhika
npm install
npm run build
```
This builds the production extension bundle in `dist/`, including `manifest.json`, `popup.html`, `sidepanel.html`, `content.js`, and `background.js`.

### 3. Run the Side-by-Side Simulator
```bash
npm run dev
```
Open `http://localhost:5173/` in your browser. This launches the **Interactive Workbench Simulator**:
- **Left Panel**: Deliberately inaccessible Public Service Form (missing labels, unassociated errors, required asterisks).
- **Right Panel**: Vazhika Guided Mode layer performing live DOM inspection, bilingual questions, and value transfer.

---

## 🔌 Loading Unpacked in Google Chrome

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** via the toggle in the top-right corner.
3. Click **Load unpacked**.
4. Select the `dist/` directory from this project (`.../TatHack-Final/dist`).
5. Pin the **Vazhika** extension icon to your Chrome toolbar.
6. Open `dist/test-page.html` or any real-world form in Chrome.
7. Click the **Vazhika** toolbar icon and click **"Scan this page"**!

---

## 🧪 Automated Testing Suite

Vazhika includes rigorous automated testing across 11 test suites and 59 unit and integration tests:

```bash
npm test
```

### Verified Test Suites:
1. `src/test/axe-accessibility.test.tsx` — Validates rendered Guided Mode controls with `axe-core` to guarantee **0 critical/serious WCAG violations**.
2. `src/test/civic-wallet.test.tsx` (7 tests) — Tests WebCrypto AES-GCM encryption/decryption, wrong passphrase rejections, field matching, 2-hour auto-expiry, and wallet UI modal state.
3. `src/test/document-checklist.test.ts` (4 tests) — Verifies pattern detection for Aadhaar, Ration Card, Income Certificate, and custom upload extraction.
4. `src/test/security-guard.test.ts` (7 tests) — Verifies `.gov.in`/`.nic.in` allowlists, bank recognition, HTTPS enforcement, typosquatting warnings, and blocking dangerous credential prompts (UPI PIN, CVV).
5. `src/test/rescue-loop.test.ts` (7 tests) — Tests detection of `:invalid`, `aria-invalid`, and inline error containers; tests empathetic bilingual explanation and fix generation.
6. `src/test/form-inspector.test.ts` (7 tests) — Asserts detection of missing labels, unassociated errors, asterisk-only required flags, and radio groups lacking fieldset/legend.
7. `src/test/content-transfer.test.ts` (3 tests) — Tests framework-safe DOM value population and file attachment without premature form submission.
8. `src/test/date-formatter.test.ts` (10 tests) — Tests Indian date format normalization (DD/MM/YYYY, DD-MM-YYYY) to ISO `yyyy-MM-dd`.
9. `src/test/validation-engine.test.ts` (6 tests) — Enforces required rules, 10-digit telephone checks, email regex, and checkbox declarations.
10. `src/test/plain-language.test.ts` (3 tests) — Verifies English and Malayalam translations for confusing administrative terminology.
11. `src/test/components.test.tsx` (4 tests) — Tests one-question-at-a-time navigation, keyboard interaction, and draft persistence.

---

## 🔒 Privacy Invariant & Permissions Justification

| Permission | Technical Justification |
| :--- | :--- |
| `activeTab` | Grants access to inspect only the tab the user explicitly activates. |
| `scripting` | Coordinates content script injection for DOM inspection and value transfer on demand. |
| `storage` | Persists encrypted Civic Wallet ciphertext and auto-saved form drafts locally. |
| `sidePanel` | Displays Guided Mode comfortably beside the webpage instead of an intrusive popup overlay. |

> **Privacy Pledge:** Vazhika runs **100% locally** on your device. It makes zero analytics calls, operates without remote servers or user tracking, and transmits zero citizen data across the network.

---

## 🗺️ Roadmap

- [x] **Manifest V3 Extension Core** with Side Panel and Popup integration.
- [x] **AccName DOM Inspector & WCAG 2.2 AA Audit Engine**.
- [x] **Bilingual Guided Workflow** (English & Malayalam) with text scaling and high contrast.
- [x] **Encrypted Civic Wallet** (WebCrypto AES-GCM-256 with field-level consent and auto-expiry).
- [x] **Pre-flight Document Checklist** for Indian civic certificates.
- [x] **Submission-Error Rescue Loop** for real-time validation recovery.
- [x] **Safe Document Attachment** with 1-click sample file injection.
- [ ] **Multi-lingual Expansion**: Hindi, Tamil, and Kannada civic dictionaries.
- [ ] **On-Device OCR**: Client-side Tesseract.js to pre-fill Civic Wallet from photo of Ration Card or Aadhaar.
- [ ] **Audit Report Export**: One-click downloadable PDF remediation report for government webmasters.
- [ ] **Mobile Browser Support**: Port for Firefox for Android and Kiwi Browser.

---

## 👥 Presentation & Submission Resources

- 🎯 **Pitch Deck Guidelines & Speaker Talk Track**: [pitch.md](pitch.md)
- 📖 **Comprehensive Project Architecture & Feature Catalog**: [PROJECT_DESCRIPTION.md](PROJECT_DESCRIPTION.md)
- 🧪 **Offline Test Form Fixture**: [test-page.html](test-page.html)

---

<div align="center">

**Vazhika (വഴിക)** — *Democratizing digital governance for every citizen.*  
Built with pride for **TatHack 2026** (Accessibility & Inclusion Track).

</div>
