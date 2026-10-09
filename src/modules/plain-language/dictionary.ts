export interface PlainLanguageEntry {
  question: {
    en: string;
    ml: string;
  };
  explanation: {
    en: string;
    ml: string;
  };
  placeholder?: {
    en: string;
    ml: string;
  };
}

export const plainLanguageDictionary: Record<string, PlainLanguageEntry> = {
  // Names
  fullname: {
    question: {
      en: "What is your full legal name?",
      ml: "നിങ്ങളുടെ പൂർണ്ണമായ ഔദ്യോഗിക പേര് എന്താണ്?",
    },
    explanation: {
      en: "Enter your first and last name exactly as they appear on your government identity card.",
      ml: "നിങ്ങളുടെ തിരിച്ചറിയൽ കാർഡിൽ ഉള്ളതുപോലെ ആദ്യ പേരും അവസാന പേരും ഇവിടെ നൽകുക.",
    },
    placeholder: {
      en: "e.g. Rahul Sharma",
      ml: "ഉദാ: രാഹുൽ ശർമ്മ",
    },
  },
  name: {
    question: {
      en: "What is your name?",
      ml: "നിങ്ങളുടെ പേര് എന്താണ്?",
    },
    explanation: {
      en: "Please enter your name.",
      ml: "ദയവായി നിങ്ങളുടെ പേര് നൽകുക.",
    },
  },

  // Contact
  email: {
    question: {
      en: "What is your email address?",
      ml: "നിങ്ങളുടെ ഇമെയിൽ വിലാസം എന്താണ്?",
    },
    explanation: {
      en: "We will send registration updates and confirmation receipts to this address.",
      ml: "രജിസ്ട്രേഷൻ വിവരങ്ങളും രസീതും ഈ ഇമെയിൽ വിലാസത്തിലേക്ക് അയക്കും.",
    },
    placeholder: {
      en: "name@example.com",
      ml: "name@example.com",
    },
  },
  phone: {
    question: {
      en: "What is your mobile telephone number?",
      ml: "നിങ്ങളുടെ മൊബൈൽ ഫോൺ നമ്പർ എന്താണ്?",
    },
    explanation: {
      en: "Enter a 10-digit mobile number where you can receive SMS alerts or verification codes.",
      ml: "എസ്.എം.എസ് അറിയിപ്പുകൾ ലഭിക്കാൻ സാധിക്കുന്ന 10 അക്ക മൊബൈൽ നമ്പർ നൽകുക.",
    },
    placeholder: {
      en: "9876543210",
      ml: "9876543210",
    },
  },

  // Address
  correspondenceaddress: {
    question: {
      en: "Where should official letters be mailed to you?",
      ml: "ഔദ്യോഗിക കത്തുകൾ അയക്കേണ്ട വിലാസം എന്താണ്?",
    },
    explanation: {
      en: "The address where you want to receive physical letters and notifications about this application.",
      ml: "ഈ അപേക്ഷ സംബന്ധിച്ച തപാൽ കത്തുകൾ ലഭിക്കാൻ ആഗ്രഹിക്കുന്ന വിലാസം.",
    },
    placeholder: {
      en: "House no., Street, City, PIN code",
      ml: "വീട്ടുപേര്, റോഡ്, നഗരം, പിൻകോഡ്",
    },
  },
  address: {
    question: {
      en: "What is your residential address?",
      ml: "നിങ്ങളുടെ താമസസ്ഥലത്തെ വിലാസം എന്താണ്?",
    },
    explanation: {
      en: "Enter the place where you currently live.",
      ml: "നിങ്ങൾ ഇപ്പോൾ താമസിക്കുന്ന വിലാസം നൽകുക.",
    },
  },

  // Date of Birth
  dob: {
    question: {
      en: "When were you born?",
      ml: "നിങ്ങളുടെ ജനനത്തീയതി എപ്പോഴാണ്?",
    },
    explanation: {
      en: "Select your date of birth from the calendar or enter Day, Month, and Year.",
      ml: "നിങ്ങളുടെ ജനന തീയതി, മാസം, വർഷം എന്നിവ തിരഞ്ഞെടുക്കുക.",
    },
  },
  dateofbirth: {
    question: {
      en: "When were you born?",
      ml: "നിങ്ങളുടെ ജനനത്തീയതി എപ്പോഴാണ്?",
    },
    explanation: {
      en: "Your official birth date as registered in your records.",
      ml: "ഔദ്യോഗിക രേഖകളിലുള്ള ജനനത്തീയതി നൽകുക.",
    },
  },

  // Identification / Number
  idnumber: {
    question: {
      en: "What is your official identification number (e.g., Aadhaar / Voter ID)?",
      ml: "നിങ്ങളുടെ ഔദ്യോഗിക തിരിച്ചറിയൽ രേഖാ നമ്പർ എന്താണ്?",
    },
    explanation: {
      en: "Enter the number from your government photo identification document.",
      ml: "നിങ്ങളുടെ സർക്കാർ തിരിച്ചറിയൽ കാർഡിലുള്ള നമ്പർ രേഖപ്പെടുത്തുക.",
    },
  },

  // Service / Category
  category: {
    question: {
      en: "Which service category do you belong to?",
      ml: "നിങ്ങൾ ഏത് സേവന വിഭാഗത്തിലാണ് ഉൾപ്പെടുന്നത്?",
    },
    explanation: {
      en: "Choose the category that matches your eligibility requirement.",
      ml: "നിങ്ങൾക്ക് അനുയോജ്യമായ വിഭാഗം തിരഞ്ഞെടുക്കുക.",
    },
  },
  service_type: {
    question: {
      en: "Which public service are you registering for?",
      ml: "ഏത് പൊതുസേവനത്തിനാണ് നിങ്ങൾ രജിസ്റ്റർ ചെയ്യുന്നത്?",
    },
    explanation: {
      en: "Select the specific government scheme or benefit you wish to apply for.",
      ml: "നിങ്ങൾ അപേക്ഷിക്കാൻ ആഗ്രഹിക്കുന്ന സർക്കാർ പദ്ധതി അല്ലെങ്കിൽ ആനുകൂല്യം തിരഞ്ഞെടുക്കുക.",
    },
  },

  // Preferred Communication Mode
  comm_pref: {
    question: {
      en: "How would you prefer us to contact you?",
      ml: "നിങ്ങളെ ബന്ധപ്പെടാൻ ഏത് മാർഗ്ഗമാണ് താല്പര്യം?",
    },
    explanation: {
      en: "Choose whether you prefer updates via SMS text message, Email, or Postal mail.",
      ml: "അറിയിപ്പുകൾ എസ്.എം.എസ്, ഇമെയിൽ അല്ലെങ്കിൽ തപാൽ വഴി ലഭിക്കണോ എന്ന് തിരഞ്ഞെടുക്കുക.",
    },
  },

  // File Upload
  document: {
    question: {
      en: "Please upload your supporting identification document",
      ml: "നിങ്ങളുടെ തിരിച്ചറിയൽ രേഖ ഇവിടെ അപ്‌ലോഡ് ചെയ്യുക",
    },
    explanation: {
      en: "Attach a copy of your document (PDF, PNG, or JPG under 5MB).",
      ml: "രേഖയുടെ പകർപ്പ് (PDF, PNG അല്ലെങ്കിൽ JPG, 5MB ൽ താഴെ) തിരഞ്ഞെടുക്കുക.",
    },
  },

  // Additional Details / Remarks
  remarks: {
    question: {
      en: "Do you have any additional notes or accessibility requirements?",
      ml: "നിങ്ങൾക്ക് എന്തെങ്കിലും പ്രത്യേക കുറിപ്പുകളോ ആവശ്യങ്ങളോ ഉണ്ടോ?",
    },
    explanation: {
      en: "You can write any special accommodations or instructions you want the officers to know.",
      ml: "ഉദ്യോഗസ്ഥർ അറിയേണ്ട എന്തെങ്കിലും പ്രത്യേക ആവശ്യങ്ങളുണ്ടെങ്കിൽ ഇവിടെ എഴുതാം.",
    },
  },

  // Consent
  terms: {
    question: {
      en: "Do you agree to the declaration and verification rules?",
      ml: "വ്യവസ്ഥകളും നിബന്ധനകളും നിങ്ങൾ അംഗീകരിക്കുന്നുണ്ടോ?",
    },
    explanation: {
      en: "Checking this box confirms that the information you provided is true and correct to your knowledge.",
      ml: "നിങ്ങൾ നൽകിയ വിവരങ്ങൾ സത്യസന്ധമാണെന്ന് സ്ഥിരീകരിക്കാൻ ഈ ബോക്സ് ടിക്ക് ചെയ്യുക.",
    },
  },
};

/**
 * Returns plain language explanations for a field based on its id, name, or label.
 */
export function getPlainLanguageHelp(
  fieldId: string = '',
  fieldName: string = '',
  fieldLabel: string = ''
): PlainLanguageEntry {
  const normalizedKey = (fieldId + ' ' + fieldName + ' ' + fieldLabel)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  for (const [key, entry] of Object.entries(plainLanguageDictionary)) {
    if (normalizedKey.includes(key)) {
      return entry;
    }
  }

  // Fallback defaults
  const cleanLabel = fieldLabel || fieldName || fieldId || 'This field';
  return {
    question: {
      en: `Please enter: ${cleanLabel}`,
      ml: `ദയവായി നൽകുക: ${cleanLabel}`,
    },
    explanation: {
      en: `Provide the requested information for ${cleanLabel}.`,
      ml: `${cleanLabel} സംബന്ധിച്ച വിവരങ്ങൾ നൽകുക.`,
    },
  };
}
