import { SecurityReport, SecurityRiskFactor, SecurityRiskLevel } from '../../types';

// Official government and recognized institution domains
const OFFICIAL_GOV_SUFFIXES = ['.gov.in', '.nic.in', '.gov'];
const OFFICIAL_ACADEMIC_SUFFIXES = ['.ac.in', '.edu.in', '.res.in'];

// Recognized banking and financial domains in India
const KNOWN_BANK_DOMAINS = [
  'sbi.co.in',
  'onlinesbi.sbi',
  'onlinesbi.com',
  'hdfcbank.com',
  'icicibank.com',
  'axisbank.com',
  'canarabank.com',
  'pnbindia.in',
  'bankofbaroda.in',
  'unionbankofindia.co.in',
  'indianbank.in',
  'bankofindia.co.in',
  'kotak.com',
  'rbi.org.in',
  'npci.org.in',
];

// Sensitive keywords commonly abused in citizen phishing
const CIVIC_KEYWORDS = [
  'kerala',
  'aadhaar',
  'pmkisan',
  'epfo',
  'ration',
  'sevana',
  'eseva',
  'digilocker',
  'voter',
  'challan',
  'subsidy',
  'pension',
  'scholarship',
];

// Dangerous field triggers that legitimate government forms never request
const DANGEROUS_PATTERNS = [
  {
    regex: /\b(upi[\s_-]*pin|mpin|atm[\s_-]*pin|card[\s_-]*pin)\b/i,
    name: 'UPI / ATM PIN',
    nameMl: 'യു.പി.ഐ / എ.ടി.എം പിൻ (UPI PIN)',
    adviceEn: 'Legitimate government portals NEVER ask for your UPI PIN to process applications, subsidies, or refunds. Entering your PIN sends money out of your account.',
    adviceMl: 'സർക്കാർ ആനുകൂല്യങ്ങൾക്കോ അപേക്ഷകൾക്കോ വേണ്ടി ഔദ്യോഗിക പോർട്ടലുകൾ ഒരിക്കലും യു.പി.ഐ പിൻ ചോദിക്കില്ല. പിൻ നൽകിയാൽ പണം നഷ്ടപ്പെടാം.',
  },
  {
    regex: /\b(cvv|cvv2|cvc|card[\s_-]*security[\s_-]*code)\b/i,
    name: 'Card CVV / Security Code',
    nameMl: 'കാർഡ് സി.വി.വി (CVV)',
    adviceEn: 'Citizen service portals should never collect your 3-digit card CVV directly on application forms. Payments must only be processed via certified banking gateways.',
    adviceMl: 'അപേക്ഷാ ഫോമുകളിൽ നേരിട്ട് കാർഡ് സി.വി.വി രേഖപ്പെടുത്തരുത്. ഔദ്യോഗിക പേയ്‌മെന്റ് ഗേറ്റ്‌വേകൾ വഴി മാത്രമേ പണമിടപാടുകൾ നടത്താവൂ.',
  },
  {
    regex: /\b(net[\s_-]*banking[\s_-]*pass|transaction[\s_-]*password|login[\s_-]*password)\b/i,
    name: 'Net Banking Password',
    nameMl: 'നെറ്റ് ബാങ്കിംഗ് പാസ്‌വേഡ്',
    adviceEn: 'Never enter your internet banking password on third-party application forms. Legitimate portals redirect to your official bank login page.',
    adviceMl: 'മൂന്നാം കക്ഷി വെബ്സൈറ്റുകളിൽ നെറ്റ് ബാങ്കിംഗ് പാസ്‌വേഡ് നൽകരുത്.',
  },
];

/**
 * Checks if a hostname belongs to an official Indian government portal (.gov.in or .nic.in)
 */
export function isOfficialGovDomain(hostname: string): boolean {
  const host = hostname.toLowerCase().trim();
  return OFFICIAL_GOV_SUFFIXES.some((suffix) => host.endsWith(suffix) || host === suffix.slice(1));
}

/**
 * Checks if a hostname is a known banking domain
 */
export function isKnownBankDomain(hostname: string): boolean {
  const host = hostname.toLowerCase().trim();
  return KNOWN_BANK_DOMAINS.some((bank) => host === bank || host.endsWith('.' + bank));
}

/**
 * Evaluates whether a domain is suspicious, looking for typosquatting / government impersonation
 */
export function checkDomainImpersonation(hostname: string): { isImpersonating: boolean; matchedKeyword?: string } {
  const host = hostname.toLowerCase().trim();
  
  // If it's already an official .gov.in/.nic.in or known bank or localhost, it's not an impersonator
  if (isOfficialGovDomain(host) || isKnownBankDomain(host) || host === 'localhost' || host === '127.0.0.1') {
    return { isImpersonating: false };
  }

  // Check if non-gov domain contains civic keywords suggesting official status
  const matched = CIVIC_KEYWORDS.find((keyword) => host.includes(keyword));
  if (matched) {
    return { isImpersonating: true, matchedKeyword: matched };
  }

  return { isImpersonating: false };
}

/**
 * Comprehensive security evaluation of the current webpage & form
 */
export function evaluateSecurity(url: string, formElement?: HTMLElement | null): SecurityReport {
  let parsedUrl: URL | null = null;
  try {
    parsedUrl = new URL(url);
  } catch {
    // fallback if relative URL
    try {
      parsedUrl = new URL(url, 'https://example.com');
    } catch {
      parsedUrl = null;
    }
  }

  const hostname = parsedUrl ? parsedUrl.hostname : 'unknown-domain';
  const isHttps = parsedUrl ? parsedUrl.protocol === 'https:' : false;
  const isGov = isOfficialGovDomain(hostname);
  const isBank = isKnownBankDomain(hostname);
  const impersonation = checkDomainImpersonation(hostname);

  const factors: SecurityRiskFactor[] = [];
  const blockedSensitiveFields: string[] = [];
  let trustScore = 100;

  // 1. Check Protocol (HTTPS)
  if (!isHttps && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    trustScore -= 35;
    factors.push({
      id: 'SEC-NO-HTTPS',
      level: 'danger',
      title: {
        en: 'Unencrypted Connection (Not HTTPS)',
        ml: 'സുരക്ഷിതമല്ലാത്ത കണക്ഷൻ (HTTPS ഇല്ല)',
      },
      description: {
        en: 'This page transmits your data over an unencrypted connection. Information entered here can be intercepted by third parties.',
        ml: 'ഈ പേജ് എൻക്രിപ്റ്റ് ചെയ്തിട്ടില്ലാത്തതിനാൽ ഇവിടെ നൽകുന്ന വിവരങ്ങൾ ചോർത്തപ്പെടാൻ സാധ്യതയുണ്ട്.',
      },
      recommendation: {
        en: 'Do not enter passwords, identity numbers, or personal documents on non-HTTPS pages.',
        ml: 'പാസ്‌വേഡുകളോ തിരിച്ചറിയൽ രേഖകളോ നൽകരുത്.',
      },
    });
  } else {
    factors.push({
      id: 'SEC-HTTPS-OK',
      level: 'safe',
      title: {
        en: 'Secure Encryption (HTTPS)',
        ml: 'സുരക്ഷിത എൻക്രിപ്ഷൻ (HTTPS)',
      },
      description: {
        en: 'Connection is securely encrypted using modern transport layer security.',
        ml: 'കണക്ഷൻ എൻക്രിപ്റ്റ് ചെയ്തിരിക്കുന്നു.',
      },
    });
  }

  // 2. Check Domain Authenticity
  if (isGov) {
    factors.push({
      id: 'SEC-OFFICIAL-GOV',
      level: 'safe',
      title: {
        en: 'Official Government Domain (.gov.in / .nic.in)',
        ml: 'ഔദ്യോഗിക സർക്കാർ വെബ്സൈറ്റ് (.gov.in / .nic.in)',
      },
      description: {
        en: `This portal is hosted on the official national civic infrastructure (${hostname}).`,
        ml: `ഇത് ഔദ്യോഗിക സർക്കാർ ഇൻഫ്രാസ്ട്രക്ചറിലുള്ള പോർട്ടലാണ് (${hostname}).`,
      },
    });
  } else if (isBank) {
    factors.push({
      id: 'SEC-KNOWN-BANK',
      level: 'safe',
      title: {
        en: 'Recognized Financial Institution Domain',
        ml: 'പരിശോധിച്ചുറപ്പിച്ച ബാങ്ക് വെബ്സൈറ്റ്',
      },
      description: {
        en: `This domain is verified against recognized banking infrastructure (${hostname}).`,
        ml: `ഇത് പരിശോധിച്ചുറപ്പിച്ച ഔദ്യോഗിക ബാങ്കിംഗ് വെബ്സൈറ്റാണ് (${hostname}).`,
      },
    });
  } else if (impersonation.isImpersonating) {
    trustScore -= 45;
    factors.push({
      id: 'SEC-IMPERSONATION-RISK',
      level: 'danger',
      title: {
        en: `Potential Government Portal Impersonation ("${impersonation.matchedKeyword}")`,
        ml: `സർക്കാർ പോർട്ടൽ വ്യാജമായി ചമയാൻ സാധ്യത ("${impersonation.matchedKeyword}")`,
      },
      description: {
        en: `This site uses official administrative terminology ("${impersonation.matchedKeyword}") but is NOT on an official .gov.in or .nic.in domain. Fraudulent sites frequently imitate government schemes.`,
        ml: `ഈ സൈറ്റ് ഔദ്യോഗിക സർക്കാർ വാക്കുകൾ ("${impersonation.matchedKeyword}") ഉപയോഗിക്കുന്നുണ്ടെങ്കിലും ഇത് .gov.in വെബ്സൈറ്റ് അല്ല. വ്യാജ സൈറ്റുകൾ ഇത്തരത്തിൽ വഞ്ചിക്കാൻ സാധ്യതയുണ്ട്.`,
      },
      recommendation: {
        en: 'Verify the URL against official gazettes before entering Aadhaar or personal information.',
        ml: 'വ്യക്തിവിവരങ്ങൾ നൽകുന്നതിന് മുൻപ് ലിങ്ക് ഔദ്യോഗികമാണെന്ന് ഉറപ്പുവരുത്തുക.',
      },
    });
  } else {
    // Normal non-gov domain
    trustScore -= 10;
    factors.push({
      id: 'SEC-NON-GOV',
      level: 'warning',
      title: {
        en: 'Third-Party / Non-Government Domain',
        ml: 'സർക്കാർ ഇതര വെബ്സൈറ്റ്',
      },
      description: {
        en: `This website (${hostname}) is not an official .gov.in government domain. Proceed with standard caution.`,
        ml: `ഈ വെബ്സൈറ്റ് (${hostname}) ഒരു ഔദ്യോഗിക സർക്കാർ ഡൊമെയ്ൻ അല്ല. ജാഗ്രത പാലിക്കുക.`,
      },
    });
  }

  // 3. Scan Form Elements for Phishing / Dangerous Prompts
  let hasSuspiciousAction = false;
  let hasHiddenCapture = false;

  if (formElement) {
    // Check form action target
    const formAction = (formElement.getAttribute('action') || '').trim();
    if (formAction && !formAction.startsWith('#') && !formAction.startsWith('/') && !formAction.startsWith('javascript:')) {
      try {
        const actionUrl = new URL(formAction, url);
        if (actionUrl.hostname !== hostname && !actionUrl.hostname.endsWith('.' + hostname)) {
          hasSuspiciousAction = true;
          trustScore -= 25;
          factors.push({
            id: 'SEC-CROSS-ORIGIN-ACTION',
            level: 'warning',
            title: {
              en: 'Cross-Origin Form Submission Target',
              ml: 'മറ്റൊരു വെബ്സൈറ്റിലേക്ക് വിവരങ്ങൾ അയക്കുന്നു',
            },
            description: {
              en: `This form submits user data to a different domain: ${actionUrl.hostname}.`,
              ml: `ഈ ഫോമിൽ നൽകുന്ന വിവരങ്ങൾ മറ്റൊരു വെബ്സൈറ്റിലേക്കാണ് (${actionUrl.hostname}) സമർപ്പിക്കപ്പെടുന്നത്.`,
            },
            recommendation: {
              en: 'Ensure you trust the recipient endpoint before submitting confidential files or details.',
              ml: 'വിവരങ്ങൾ കൈമാറുന്നതിന് മുൻപ് ലക്ഷ്യസ്ഥാനം വിശ്വസനീയമാണെന്ന് ഉറപ്പാക്കുക.',
            },
          });
        }
      } catch {
        // ignore parse error
      }
    }

    // Check for Dangerous Input Prompts (UPI PIN, CVV, Net Banking Pass)
    const inputs = Array.from(formElement.querySelectorAll<HTMLElement>('input, select, textarea, label, span, p'));
    const combinedTexts = inputs.map((el) => {
      const id = el.id || '';
      const name = (el as HTMLInputElement).name || '';
      const placeholder = (el as HTMLInputElement).placeholder || '';
      const text = el.textContent || '';
      return `${id} ${name} ${placeholder} ${text}`;
    }).join(' ');

    for (const danger of DANGEROUS_PATTERNS) {
      if (danger.regex.test(combinedTexts)) {
        trustScore -= 40;
        blockedSensitiveFields.push(danger.name);
        factors.push({
          id: `SEC-DANGEROUS-PROMPT-${danger.name.replace(/[^A-Z]/g, '')}`,
          level: 'danger',
          title: {
            en: `Dangerous Field Detected: Asking for ${danger.name}`,
            ml: `അപകടകരമായ ഫീൽഡ്: ${danger.nameMl} ചോദിക്കുന്നു`,
          },
          description: {
            en: danger.adviceEn,
            ml: danger.adviceMl,
          },
          recommendation: {
            en: `NEVER submit your ${danger.name}. Close this form if you did not initiate a bank payment.`,
            ml: `നിങ്ങളുടെ ${danger.nameMl} ഒരിക്കലും ഇവിടെ നൽകരുത്.`,
          },
        });
      }
    }

    // Check for suspicious hidden tracking fields
    const hiddenInputs = Array.from(formElement.querySelectorAll<HTMLInputElement>('input[type="hidden"]'));
    if (hiddenInputs.length > 5) {
      hasHiddenCapture = true;
      factors.push({
        id: 'SEC-HIDDEN-FIELDS',
        level: 'warning',
        title: {
          en: `Multiple Hidden Fields (${hiddenInputs.length} detected)`,
          ml: `നിരവധി മറഞ്ഞിരിക്കുന്ന ഫീൽഡുകൾ (${hiddenInputs.length} കണ്ടെത്തി)`,
        },
        description: {
          en: 'This form contains numerous hidden fields silently passed along with your submission.',
          ml: 'ഈ ഫോമിൽ നിരവധി വിവരങ്ങൾ ഉപയോക്താവ് അറിയാതെ സമർപ്പിക്കപ്പെടുന്നുണ്ട്.',
        },
      });
    }
  }

  // Calculate final risk level
  trustScore = Math.max(0, Math.min(100, trustScore));
  let riskLevel: SecurityRiskLevel = 'safe';
  if (trustScore < 50 || blockedSensitiveFields.length > 0) {
    riskLevel = 'danger';
  } else if (trustScore < 80 || !isGov) {
    riskLevel = 'warning';
  }

  // Summary message
  const summary = {
    en:
      riskLevel === 'danger'
        ? 'High Suspicion Detected: This page asks for sensitive credentials that legitimate civic portals never request.'
        : riskLevel === 'warning'
        ? isGov
          ? 'Official portal with minor transmission advisories.'
          : 'Third-party portal: Exercise standard care before submitting personal documents.'
        : 'Verified Safe: Official and encrypted civic portal.',
    ml:
      riskLevel === 'danger'
        ? 'വ്യാജ വെബ്സൈറ്റ് ജാഗ്രത: ഔദ്യോഗിക പോർട്ടലുകൾ ഒരിക്കലും ചോദിക്കാത്ത രഹസ്യ വിവരങ്ങൾ ഇവിടെ ആവശ്യപ്പെടുന്നു.'
        : riskLevel === 'warning'
        ? isGov
          ? 'ഔദ്യോഗിക സർക്കാർ പോർട്ടൽ.'
          : 'സർക്കാർ ഇതര വെബ്സൈറ്റ്: വിവരങ്ങൾ നൽകുന്നതിൽ ശ്രദ്ധ പുലർത്തുക.'
        : 'സുരക്ഷിതം: പരിശോധിച്ചുറപ്പിച്ച ഔദ്യോഗിക സർക്കാർ പോർട്ടൽ.',
  };

  return {
    domain: hostname,
    isHttps,
    isOfficialGovDomain: isGov,
    isKnownBankDomain: isBank,
    riskLevel,
    trustScore,
    summary,
    factors,
    blockedSensitiveFields,
    hasSuspiciousFormAction: hasSuspiciousAction,
    hasHiddenCaptureFields: hasHiddenCapture,
    evaluatedAt: new Date().toISOString(),
  };
}
