# Vazhika (വഴിക)
> *Every form. A clearer way.*

**Track 5: Accessibility & Inclusion**  
An accessibility-first Chrome browser extension (Manifest V3) that inspects difficult online forms on live websites and transforms them into guided, plain-language, one-question-at-a-time workflows.

---

## 🏛️ What is Vazhika?

Complex government and public-service forms present high barriers for people with visual impairments, motor disabilities, older adults, and citizens with low digital literacy or language barriers.

**Vazhika** operates directly on any live webpage. When activated on a confusing form, it:
1. **Scans the live DOM**: Detects missing labels, unassociated error containers, visual asterisks missing programmatic `required` attributes, unsemantic inputs, and ambiguous buttons.
2. **Translates to Plain Language**: Contextual explanations in both **English and Malayalam (മലയാളം)** for confusing terms like *"Correspondence Address"*.
3. **Presents Guided Mode**: One question at a time with large touch targets, keyboard navigation, high contrast, text scaling, and text-to-speech.
4. **Safely Transfers Answers**: Dispatches framework-aware events directly into the original website controls upon explicit user confirmation.
5. **Never Submits Automatically**: Leaves final submission control firmly in the user's hands.

---

## 🎨 Kerala Modern Visual Identity

Inspired by Kerala's civic-tech heritage, Vazhika avoids generic AI tropes in favor of a calm, accessible palette:

| Token | Hex | Role |
| :--- | :--- | :--- |
| **Forest Green** | `#123B35` | Primary actions, headings, brand mark |
| **Deep Forest** | `#0B2925` | High-contrast chrome, header background |
| **Mint** | `#D9F3E5` | Active focus rings, state badges, highlights |
| **Warm Off-White** | `#F8FAF7` | Page backgrounds, reduced glare |
| **Warm Gold** | `#E8A34A` | Accent call-to-actions, archway motif |
| **Error / Alert** | `#B42318` | Inline validation instructions |
| **Success** | `#216E4E` | Verified transfers and compliance checks |

---

## 🧩 Extension Architecture (Manifest V3)

```
├── manifest.json              # Chrome Manifest V3 definition
├── src/
│   ├── popup/                 # Compact toolbar popup (scan & launch)
│   ├── sidepanel/             # Chrome Side Panel (Guided Mode & Audit)
│   ├── content/               # Content script (live DOM inspection & value transfer)
│   ├── background/            # Background service worker (side panel coordinator)
│   ├── modules/
│   │   ├── form-inspector/    # AccName algorithm & WCAG defect detection engine
│   │   ├── plain-language/    # English & Malayalam explanation dictionary
│   │   ├── validation-engine/ # Bilingual inline validation with remediation advice
│   │   ├── speech-service/    # Web Speech API (TTS speech synthesis & voice input)
│   │   ├── draft-storage/     # IndexedDB local draft recovery
│   │   └── accessibility-controls/ # High-contrast, text scaling, live announcements
│   ├── components/            # GuidedWorkflow, FieldRenderer, ReviewScreen, Receipt
│   ├── fixtures/              # Inaccessible Public Service Form fixture
│   └── test/                  # Vitest, React Testing Library, and axe-core test suite
├── test-page.html             # Standalone deliberately broken government service form
└── dist/                      # Production extension package (ready for Chrome unpacked)
```

---

## 🚀 Quick Start & Development

### 1. Install & Build
```bash
npm install
npm run build
```
This bundles the extension into `dist/` containing `manifest.json`, `popup.html`, `sidepanel.html`, `content.js`, `background.js`, and icons.

### 2. Run Local Test Harness
```bash
npm run dev
```
Open `http://localhost:5173/` in your browser. This opens the **Interactive Split-View Simulator**:
- **Left panel**: The deliberately inaccessible Public Service Form.
- **Right panel**: Vazhika Guided Mode layer running live DOM inspection and value transfer.

---

## 🔌 How to Load Unpacked in Google Chrome

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select the `dist/` directory from this project repository (`/home/xcyraxx/TatHack-Final/dist`).
5. Open `dist/test-page.html` or any web form in Chrome.
6. Click the **Vazhika** toolbar icon in Chrome to scan and simplify!

---

## 🧪 Automated Test Suite

Run the full automated test suite with Vitest and axe-core:
```bash
npm test
```

### Verified Test Suites:
- `src/test/form-inspector.test.ts`: Detects missing labels, unassociated errors, asterisk-only required fields, radio groups without fieldset/legend, ambiguous button labels.
- `src/test/validation-engine.test.ts`: Enforces original required rules, 10-digit telephone validation, email regex, date checks, checkbox declarations.
- `src/test/plain-language.test.ts`: Verifies English and Malayalam translations for confusing administrative terms.
- `src/test/content-transfer.test.ts`: Verifies framework-safe DOM value population without triggering premature form submissions.
- `src/test/components.test.tsx`: Tests one-question-at-a-time navigation, keyboard interaction, and draft review.
- `src/test/axe-accessibility.test.tsx`: Runs `axe-core` across rendered controls to verify 0 critical/serious WCAG violations.

---

## 🔒 Permissions & Privacy Justification

| Permission | Justification |
| :--- | :--- |
| `activeTab` | Inspects only the active tab when explicitly clicked by the user. |
| `scripting` | Coordinates the live page inspection and value transfer script. |
| `storage` | Preserves in-progress form drafts locally so refreshes do not erase answers. |
| `sidePanel` | Allows Guided Mode to sit alongside the webpage without obscuring it. |

**Privacy Pledge**: Vazhika runs **100% locally** in the browser. No answers, keystrokes, or page contents are sent to any external server.

---

## 🎯 Judge Demonstration Script

1. **Open the Test Form**: Open `http://localhost:5173/` or open `dist/test-page.html` in Chrome with the extension loaded.
2. **Observe the Defects**: Note the unlabelled full name, confusing "Correspondence Address", missing date hints, un-grouped radio buttons, and generic "Submit" button.
3. **Scan with Vazhika**: Click "Scan With Vazhika" (or open popup and click "Scan this page"). Observe real DOM findings extracted with WCAG references.
4. **Step Through Guided Mode**:
   - Answer Question 1 ("Full Name") — observe instant focus and plain-language help.
   - Switch language to **മലയാളം** — observe questions and explanations adapt to Malayalam.
   - Test speech — click **Voice: ON** or click the speaker icon to hear the question read aloud.
   - Trigger a validation error (enter an invalid email or leave a required field blank) — note the polite error announcement and instructions on how to correct it.
5. **Review Screen**: Reach the review summary. Click "Listen to All" to hear all answers read back.
6. **Transfer to Page**: Click **"Transfer Answers to Webpage"**.
7. **Verify Non-Submission**: Observe the values accurately populated into the original form. Confirm that the original webpage **has not** submitted automatically, allowing the user final review and manual submission!
