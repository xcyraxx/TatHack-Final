# Vazhika (വഴിക) — Full Project Description

> **Every form. A clearer way.**
> An accessibility-first Chrome extension (Manifest V3) that inspects difficult online forms on live
> government and public-service websites and rebuilds them as guided, plain-language,
> one-question-at-a-time workflows — with anti-phishing, submission-error rescue, document
> preparation, and an encrypted local identity wallet.

**Track:** Accessibility & Inclusion
**Surfaces:** Chrome toolbar popup · Chrome Side Panel · content script · side-by-side workbench
**Languages:** English · Malayalam (മലയാളം), switchable at runtime
**Offline:** 100% local processing — no servers, no accounts, no data egress

---

## 1. The Problem

Government and public-service forms are where digital exclusion becomes visible:

- **Accessibility defects are the norm, not the exception.** Placeholder-only labels, asterisk-only
  "required" indicators, radio groups without fieldsets, error messages that exist in the DOM but are
  never announced to screen readers. Our own inspector routinely finds critical and serious WCAG
  failures on ordinary form markup.
- **Language is bureaucratic, not human.** "Correspondence Address", "Beneficiary Category",
  "Domicile" — citizens guess wrong, applications get rejected.
- **Rejection messages are technical.** A site answers `patternMismatch` or "The specified value does
  not conform to the required format" and the applicant is stranded.
- **Citizens are being phished.** Look-alike sites use civic keywords (aadhaar, ration, pension,
  sevana) on non-government domains and ask for UPI PINs and card CVVs inside fake "application
  forms."
- **Forms are abandoned halfway.** Long forms, unclear document requirements, and a page refresh
  that erases everything.

The result: people with visual, motor, or cognitive disabilities, older adults, and citizens with
low digital literacy either depend on a helper or fail the application entirely.

---

## 2. The Solution (30-second pitch)

Vazhika sits beside any live web page and does three jobs in one click:

1. **Understands the form** — scans the DOM, computes accessible names (W3C AccName), and reports
   every accessibility defect mapped to WCAG 2.2 AA criteria, with evidence and remediation.
2. **Rebuilds the experience** — converts the form into a guided flow: one dominant question at a
   time, plain-language explanations in English and Malayalam, read-aloud speech, voice dictation,
   big touch targets, auto-saved drafts, and a review screen.
3. **Protects the citizen** — a trust & phishing verdict for the portal, a "Rescue Loop" that
   translates the site's own rejection errors into fixable plain-language steps, a pre-flight
   document checklist, and an encrypted local Civic Wallet that fills what they already know.

Then it **transfers the answers into the original page controls** using framework-aware events —
and **never submits the form**. Final submission always stays in the citizen's hands.

---

## 3. Who It Is For

| User | What they get |
| --- | --- |
| Screen-reader / low-vision users | Correct labels, live announcements, high contrast, text scaling, read-aloud |
| Motor-impaired users | One question per screen, 44px controls, keyboard-first navigation |
| Older adults & low digital literacy | Plain language, huge readable type, no jargon, guided progress |
| Malayalam-first citizens | Every question, error, security verdict, and document requirement in മലയാളം |
| First-time applicants | Document checklist before Step 1, draft recovery, honest transfer status |
| Anyone | Phishing verdict before entering Aadhaar/bank data; Rescue Loop when the site rejects them |

---

## 4. How It Works (end-to-end flow)

```
[Toolbar popup]  →  Scan this page
       ↓
[Content script]  →  findTargetForm() scores real forms, ignores search/nav
       ↓
[Inspector]       →  AccName + WCAG rules → FormInspectionReport
                     ├─ SecurityReport (trust score, phishing factors)
                     ├─ RescueReport    (live rejection errors)
                     └─ FieldDefinition[] (typed, bilingual, validated)
       ↓
[Side panel]      →  Security Guard banner · summary line · findings
       ↓
[Document Checklist]  →  "Before Step 1": what papers to gather (EN/ML), ready-tracking
       ↓
[Guided Mode]     →  Step X of Y · dominant question · highlight on the live page
                     · voice read-aloud / dictation · auto-saved draft (IndexedDB)
       ↓
[Review screen]   →  every answer, "Required" flags, missing-answer summary, edit any row
       ↓
[Transfer]        →  framework-aware value setting + input/change/blur events
                     → per-field success/failure report → completion screen
       ↓
[Original page]   →  citizen reviews and clicks the site's own Submit (manual, always)
       ↓
[Rescue Loop]     →  if the site rejects: raw error → bilingual plain-language cause + fix
                     → "Fix this" jumps straight to the offending question → re-transfer
```

---

## 5. Feature Catalog

### 5.1 Form Inspection Engine (`modules/form-inspector`)
- **Form discovery:** `findTargetForm()` scores every `<form>`/container by real data controls,
  penalises search/nav/header/footer forms, prefers forms with submit actions and application
  fields — so it never mistakes a search bar for an application.
- **Accessible-name computation:** implements the W3C AccName order (`aria-labelledby` →
  `aria-label` → `<label for>` → wrapping label → value/text → `title`).
- **WCAG 2.2 AA rule set** producing severity + evidence + remediation + WCAG criteria:
  - `missing-label` / `placeholder-as-label` (critical / serious)
  - `required-not-programmatic` — visual `*` without `required`/`aria-required`
  - `radiogroup-missing-fieldset-legend`
  - `unassociated-error-message` — error node exists but no `aria-describedby`
  - `missing-semantic-input-type` — email/tel as `type="text"` (Input Purpose)
  - `date-input-unstructured`, `ambiguous-button-label`, `button-name`,
    `custom-button-keyboard` (role=button without tabindex)
- **Field extraction:** text, email, tel, date, number, select, radio group, checkbox, textarea,
  file — each typed, labelled, required-flagged, pattern/minLength/maxLength captured, with
  `isSafeToRepair` and an explicit `unsupportedFields` list for anything it refuses to transform.
- **Output:** a single `FormInspectionReport` (controls count, findings, fields, compliance flag,
  security + rescue sub-reports) shared by every surface.

### 5.2 Guided Completion (`components/guided-workflow`)
- **One question at a time** — the question is the dominant element; original context, "Original
  field" provenance, and Required status stay visible but secondary.
- **Question rewritten in plain language** via `modules/plain-language` (EN + ML): e.g.
  *Correspondence Address → "Where should official letters be mailed to you?"* with explanation
  and example placeholder.
- **Progress that reassures:** "Step X of Y", thin progress line (`role="progressbar"`),
  "Draft saved 14:32".
- **Field rendering** — native-styled 44px controls, radio/checkbox groups as fieldsets with
  per-input `aria-describedby`/`aria-invalid`/`aria-required`, validation errors in `role="alert"`.
- **Live page linkage** — the current question highlights the real input on the original page
  (outline + scroll into view) so the citizen sees where the answer goes.
- **Keyboard-first:** Enter advances from text-like inputs, Back/Continue, auto-focus on step
  change, full tab order.
- **Speech:** "Read this question aloud" (TTS) and a voice-dictation button (STT) on text fields —
  hidden automatically where the browser lacks support.
- **Draft recovery** (`modules/draft-storage`) — every change is persisted to IndexedDB (localStorage
  fallback); reload, crash, or tab switch restores answers and step. Draft clears after a
  successful transfer; a "Clear draft" utility exists in the toolbar.

### 5.3 Pre-flight Document Checklist (`modules/document-checklist`)
- Appears **before Step 1** when the form (or page text) references documents.
- Pattern library of Kerala/India civic documents: Aadhaar, Ration Card, Income Certificate,
  Caste/Community, Nativity/Residence, Bank Passbook, Passport Photo, Signature, SSLC/10th, Land
  Tax Receipt — plus any custom upload field it can't classify.
- Detects from **upload inputs, page instructions, and extracted field labels**; marks
  `upload_field` vs `reference`, required vs optional.
- Bilingual titles/descriptions, per-item read-aloud, "ready" toggles with progress count, and a
  file-format tip — so the applicant finishes in one sitting instead of abandoning halfway.

### 5.4 Rescue Loop (`modules/rescue-loop`) — submission-error recovery
- When the **website itself rejects** the submission, Vazhika reads:
  HTML5 `validity`/`validationMessage`, `aria-invalid`, `is-invalid`/`error` classes,
  `aria-describedby`/`aria-errormessage` targets, common inline-error containers
  (`.invalid-feedback`, `.text-danger`, `[role="alert"]`, …), and form-level alert banners.
- Each raw error is translated into an **empathetic bilingual explanation + concrete fix**:
  `patternMismatch` on phone → "The website requires a 10-digit mobile number without +91,
  spaces, or dashes" → "Remove +91, spaces and hyphens (e.g. 9876543210)."
- Surfaced in the popup (count + entry point), the Side Panel **Rescue Loop** tab, and the workbench.
- **"Fix this"** jumps directly to the offending question in Guided Mode; **"Transfer fixes"**
  pushes corrected values back and lets the citizen re-submit on the site.

### 5.5 Scam & Phishing Guard (`modules/security-guard`)
- **Trust score (0–100)** → `safe` / `warning` / `danger`, with a plain bilingual summary.
- Signals: HTTPS enforcement · official `.gov.in` / `.nic.in` / `.gov` (plus `.ac.in`, `.edu.in`,
  `.res.in`) allowlist · recognized bank domains (SBI, HDFC, ICICI, Axis, RBI, NPCI, …) ·
  **typosquatting/impersonation** — civic keywords on non-official domains · **dangerous field
  prompts** — UPI/ATM PIN, card CVV, net-banking password (never legitimate on civic forms) ·
  **cross-origin form action** · **hidden-field stuffing** (>5 hidden inputs).
- Every factor is shown with its reasoning and recommendation; blocked sensitive credentials get
  a red, explicit warning.
- Rendered as a compact banner in popup, side panel, and workbench.

### 5.6 Answer Transfer (`content/index.ts`)
- **Framework-aware writes:** native `value` setter re-invoked (React/Vue controlled inputs) then
  `input` + `change` + `blur` dispatched; checkbox via native `checked` setter; select by value;
  radio groups matched by option value.
- **Date correctness** (`modules/date-formatter`) — DD-MM-YYYY / DD/MM/YYYY / ISO → strict
  `yyyy-MM-dd` for `type="date"`, and placeholder-aware `dd/mm` re-formatting when the original
  field is plain text.
- **Honest reporting:** per-field `FieldTransferFailure` with a human reason; completion screen
  separates *transferred*, *needs manual attention*, and *form not submitted*.
- **Safety invariant:** Vazhika never calls `form.submit()` and never clicks the site's submit
  button.

### 5.7 Accessibility Controls & Speech (`modules/accessibility-controls`, `modules/speech-service`)
- **High-contrast mode**, **text scaling**, **voice guidance toggle**, **reduced motion**
  (honours `prefers-reduced-motion` and an explicit toggle), all persisted.
- **Live-region announcements** for every state change ("Scanning…", "Step 3 of 10", "Draft
  restored", "Transfer completed: 6 fields").
- **Language switch EN ↔ ML** that also sets `document.documentElement.lang`.
- **TTS:** questions, explanations, review answers, and document requirements read aloud; Indian
  English / Malayalam voice selection with graceful fallback. In extension contexts TTS/STT are
  **delegated to the content script** (Chrome blocks `speechSynthesis`/`SpeechRecognition` inside
  popup/side panel).
- **STT dictation** on text fields with bilingual, actionable microphone error messages.
- **Offline neural Malayalam TTS** (optional): MMS-TTS-MAL via `@xenova/transformers` running
  ONNX WASM with SIMD + multi-threading, sentence-streamed playback and an audio cache — so
  Malayalam read-aloud works without any cloud service.

### 5.8 Civic Wallet (`modules/civic-wallet`)
- A **local encrypted vault** for identity data: 14-field schema (personal, address, civic,
  financial) — full name, DOB, mobile, email, address, district, PIN, income, caste, ration card,
  Aadhaar, bank account, IFSC, bank branch.
- **Crypto:** AES-GCM-256 keys derived from the citizen's master passphrase with PBKDF2-SHA-256,
  100,000 iterations, random salt + IV per save. Ciphertext only ever sits in
  `chrome.storage.local` / `localStorage`.
- **Sensitive fields auto-expire** (Aadhaar, bank account, IFSC default 2 hours) and are purged from
  memory; lock, unlock, and one-tap **wipe all data**.
- **Smart mapping:** `matchFieldToKey()` recognises bilingual field tokens (aadhaar/ആധാർ,
  ifsc, ration/റേഷൻ, income/വരുമാനം, DOB, tel, email, PIN, district, address, name) and
  offers the stored value inside Guided Mode behind an explicit consent prompt.

### 5.9 Audit View (shared `FindingsList`)
- Full evidence list: severity, element summary, evidence, suggested remediation, WCAG criteria,
  and whether **Guided Mode covers that field** ("Vazhika can address this in Guided Mode" vs
  "needs attention on the original page").
- Summary line: controls found · findings · fields covered by guided questions.
- Available in the Side Panel, the workbench, and (compact, top 3) the popup.

### 5.10 Surfaces
| Surface | Role |
| --- | --- |
| **Toolbar popup** | Page context, one-tap scan, Security Guard verdict, rescue alert, 3-finding preview, one dominant action → Guided Mode, test-form link |
| **Side Panel** | The main workspace: Guided · Rescue Loop · Audit tabs, Security Guard banner, Civic Wallet, rescan, clear draft |
| **Content script** | Form discovery, inspection, highlighting, value transfer, page-level TTS/STT |
| **Background service worker** | Side-panel opening, message routing (incl. passing dictation events to extension pages) |
| **Workbench (index.html)** | Split-view simulator: deliberately broken fixture form on the left, Guided Mode on the right, Rescue Loop and Audit tabs — the demo vehicle |
| **Test page (test-page.html)** | Standalone deliberately inaccessible Kerala public-service form for judges and tests |

---

## 6. Accessibility & Localization Commitment

- **WCAG 2.2 AA** is the design target, not a checkbox: semantic landmarks, one `h1` per surface,
  labelled controls, `role="alert"` errors, `aria-live` announcements, visible focus, ≥30px
  interactive targets (44px primary controls), colour contrast ≥4.5:1 (gold accent on forest =
  5.7:1; muted text on white = 6.3:1).
- **Our own UI is gated by axe-core:** the automated suite asserts **0 critical/serious violations**
  on rendered Guided Mode controls.
- **Bilingual by construction:** every question, explanation, validation message, security factor,
  rescue explanation, and document requirement carries `{ en, ml }` — no machine translation at
  runtime.
- **Motion safety:** two subtle, dismissible-by-preference animations only (`km-rise`,
  `km-indeterminate`), disabled under reduced-motion.
- **Voice is optional scaffolding:** every speech feature has a visible, keyboard-operable
  counterpart, and controls self-hide when the browser lacks the capability.

---

## 7. Security & Privacy

| Permission | Justification |
| --- | --- |
| `activeTab` | Inspects only the tab the user explicitly activates |
| `scripting` | Injects the inspector/transfer script on demand |
| `storage` | Local drafts + encrypted Civic Wallet vault |
| `sidePanel` | Guided Mode beside the page instead of over it |

- **No network calls, no analytics, no accounts.** Page content, answers, drafts, and wallet data
  never leave the device.
- **Civic Wallet is encrypted at rest** (AES-GCM-256 / PBKDF2-100k) and time-expires sensitive
  fields.
- **Never submits.** The extension fills; the citizen submits.
- CSP: `script-src 'self' 'wasm-unsafe-eval'` (required for the optional offline WASM TTS).

---

## 8. Design Direction — Kerala Modernism

An art-directed, anti-"vibecoded" interface instead of generic AI-tool styling:

- **Palette:** forest `#123B35`, deep forest `#0B2925`, mint `#D9F3E5`, warm white `#F8FAF7`,
  warm gold `#E8A34A` accent, error `#B42318`, success `#216E4E`.
- **Type:** local Manrope + Noto Sans Malayalam (no remote font fetches), a 5-step scale
  (12 / 13 / 15 / 18 / 22px) — the guided question sits at the top of the scale.
- **Rules that keep it calm:** no nested rounded cards, no pills/badges for decoration, no
  gradients, glassmorphism, emoji, or decorative iconography; **exactly one primary action per
  screen**; thin progress lines; hairline dividers; dividers and whitespace instead of boxes.
- **Identity:** a single `VazhikaMark` archway motif (gateway = "വഴിക", the way/path) used at
  two sizes, plus a quiet wordmark — repeated in the app chrome and the guided tool chrome only.

---

## 9. Architecture & Tech Stack

```
React 19 · TypeScript 5.7 · Vite 6 · esbuild (content/background bundles)
Manifest V3 · chrome.tabs / scripting / sidePanel / storage
idb (IndexedDB) · @xenova/transformers (optional offline ML TTS) · lucide-react
Vitest + React Testing Library + axe-core + jsdom
```

```
src/
├── popup/                     # toolbar popup surface
├── sidepanel/                 # Chrome Side Panel surface
├── App.tsx                    # workbench / simulator surface
├── background/                # MV3 service worker
├── content/                   # DOM scan · highlight · transfer · TTS/STT delegation
├── components/
│   ├── guided-workflow/       # GuidedWorkflow + FieldRenderer
│   ├── review-screen/         # Review + Completion
│   ├── document-checklist/    # pre-Step-1 preparation screen
│   ├── rescue-loop/           # RescueLoopCard
│   ├── security/              # SecurityGuardBanner
│   ├── civic-wallet/          # vault modal + consent prompt
│   ├── findings/              # shared FindingsList (audit)
│   └── VazhikaMark · BrandHeader · AccessibilityToolbar …
├── modules/
│   ├── form-inspector/        # AccName + WCAG rules + field extraction
│   ├── security-guard/        # trust score + phishing factors
│   ├── rescue-loop/           # rejection detection + bilingual fixes
│   ├── document-checklist/    # document pattern detection
│   ├── plain-language/        # EN/ML question & explanation dictionary
│   ├── validation-engine/     # original-rule enforcement + bilingual errors
│   ├── speech-service/        # TTS/STT (+ optional neural ML TTS)
│   ├── draft-storage/         # IndexedDB draft persistence
│   ├── civic-wallet/          # AES-GCM vault, field matching, expiry
│   ├── date-formatter/        # Indian date → yyyy-MM-dd normalisation
│   └── accessibility-controls/ # contrast, scale, motion, i18n, announcements
├── styles/kerala-modern.css   # the design system (tokens → primitives → screens)
└── test/                      # 11 suites · 56 tests
```

---

## 10. Quality & Verification

- **`npm test` — 11 suites, 56 tests, all passing:** security-guard, rescue-loop,
  document-checklist, form-inspector, validation-engine, plain-language, content-transfer,
  date-formatter, civic-wallet, components (guided navigation/keyboard/draft), axe-accessibility
  (0 critical/serious).
- **`npm run build` — clean:** `tsc` typecheck → Vite build → esbuild content/background bundles.
- **Design review:** every required UI state (popup before/during/after scan, no-form, guided text,
  select, validation error, long instructions, review, successful transfer, partial transfer,
  Malayalam, side-panel audit, workbench) was rendered and machine-audited for contrast,
  overflow, unnamed controls, small targets, and duplicate copy — 0 contrast and 0 overflow
  failures.
- **Fixture-driven:** a deliberately inaccessible public-service form ships in the repo so every
  rule, flow, and test runs against known-bad markup.

---

## 11. What Makes It Different

| Approach | Limitation | Vazhika |
| --- | --- | --- |
| Screen-reader extension | Helps only existing AT users | Rebuilds the form for *everyone*, in plain language |
| Auto-fill | Fills, never explains; risky on phishing sites | Explains each question, verifies portal trust first |
| Site-side remediation | Requires every portal to fix markup | Works on any live page, today, without permission |
| Generic AI form filler | Cloud round-trips, hallucinated answers | Deterministic inspection, local-only, no data egress |
| Browser built-in translation/form autofill | No accessibility repair, no rejection recovery | Full loop: inspect → prepare → guide → transfer → rescue |

Key differentiators:

1. **Inspection and repair are the same engine** — every guided question traces back to a concrete
   WCAG finding with evidence, so the product is self-verifying.
2. **The safety invariant is explicit** — never submits; reports exactly which fields transferred
   and which didn't.
3. **Trust is checked before identity data is entered** — phishing verdict precedes Aadhaar entry,
   and dangerous prompts (UPI PIN/CVV) are blocked outright.
4. **Recovery, not just onboarding** — the Rescue Loop is the only flow that meets the citizen
   *after* the site says no.
5. **Bilingual, offline, encrypted** — Malayalam-first by design, WebCrypto vault, zero egress.

---

## 12. Demo Script (for judges)

1. Open **`test-page.html`** (or any live form) → click **Vazhika → Scan this page**.
2. Popup shows the **Security Guard verdict**, controls/findings/summary, top-3 findings →
   **Continue to Guided Mode**.
3. Side Panel opens: **Document Checklist** appears before Step 1 ("Have these ready").
4. Answer Step 1 → watch the **original input highlight on the page**; try an empty required field
   → `role="alert"` error; use **read-aloud** / **dictation**; switch to **മലയാളം**.
5. Finish → **Review Your Answers** → edit a row → **Transfer Answers to Webpage**.
6. Completion screen reports exactly what transferred; the original form now holds the values —
   click the site's own **Submit Application** (Vazhika never will).
7. Submit with a required field emptied → **Rescue Loop** tab explains the site's rejection in
   plain language → **Fix this** → jump back → re-transfer.
8. Open the **Civic Wallet**, save with a passphrase, and watch a later question offer the stored
   value; note sensitive fields expire after 2 hours.
9. **Audit tab** lists every WCAG finding with evidence and what Guided Mode covers.

---

## 13. Build & Run

```bash
npm install
npm run build     # → dist/ (load unpacked at chrome://extensions)
npm run dev       # workbench simulator at http://localhost:5173/
npm test          # 11 suites, 56 tests
```

**Roadmap candidates:** section/page grouping in review (inspector currently emits flat fields),
broader document-pattern coverage, site-level remediation report export (PDF), Firefox MV3 port,
and expanding the offline neural TTS to a compact English-Indian voice.
