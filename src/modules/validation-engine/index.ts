import { FieldDefinition } from '../../types';

export interface ValidationError {
  fieldId: string;
  message: {
    en: string;
    ml: string;
  };
}

/**
 * Validation Engine
 * Enforces original constraints without weakening them, and provides human-centered,
 * plain-language instructions on how to correct any issues.
 */
export function validateFieldValue(
  field: FieldDefinition,
  value: any,
  _lang: 'en' | 'ml' = 'en'
): ValidationError | null {
  const { required, pattern, minLength, maxLength } = field.validation;
  const isValueEmpty =
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim() === '') ||
    (field.type === 'checkbox' && value !== true) ||
    (field.type === 'file' && (!value || (value instanceof FileList && value.length === 0)));

  // Required Field Check
  if (required && isValueEmpty) {
    if (field.type === 'checkbox') {
      return {
        fieldId: field.id,
        message: {
          en: `Please check the box to confirm: "${field.label}".`,
          ml: `ദയവായി തുടരുന്നതിന് "${field.label}" അംഗീകരിക്കുക.`,
        },
      };
    }
    if (field.type === 'file') {
      return {
        fieldId: field.id,
        message: {
          en: `A document file is required. Please choose a file to upload.`,
          ml: `രേഖ അപ്‌ലോഡ് ചെയ്യേണ്ടതുണ്ട്. ദയവായി ഒരു ഫയൽ തിരഞ്ഞെടുക്കുക.`,
        },
      };
    }
    return {
      fieldId: field.id,
      message: {
        en: `This question cannot be skipped. Please enter your ${field.label.toLowerCase()}.`,
        ml: `ഇത് നിർബന്ധമായ ചോദ്യമാണ്. ദയവായി നിങ്ങളുടെ ${field.label} നൽകുക.`,
      },
    };
  }

  // If empty and not required, pass
  if (isValueEmpty && !required) {
    return null;
  }

  const strValue = typeof value === 'string' ? value.trim() : String(value || '');

  // Type-specific validations
  if (field.type === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(strValue)) {
      return {
        fieldId: field.id,
        message: {
          en: 'Please enter a valid email address with an "@" symbol and a domain (e.g. name@example.com).',
          ml: 'സാധുവായ ഇമെയിൽ വിലാസം നൽകുക (ഉദാ: name@example.com).',
        },
      };
    }
  }

  if (field.type === 'tel') {
    const digitsOnly = strValue.replace(/\D/g, '');
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      return {
        fieldId: field.id,
        message: {
          en: 'Please enter a complete 10-digit mobile telephone number without spaces or letters.',
          ml: 'ദയവായി 10 അക്ക മൊബൈൽ നമ്പർ നൽകുക.',
        },
      };
    }
  }

  if (field.type === 'date') {
    const parsedDate = new Date(strValue);
    if (isNaN(parsedDate.getTime())) {
      return {
        fieldId: field.id,
        message: {
          en: 'Please choose or enter a valid date in YYYY-MM-DD format.',
          ml: 'ദയവായി ശരിയായ തീയതി തിരഞ്ഞെടുക്കുക.',
        },
      };
    }
    // Check if future date for birth
    if (field.id.includes('dob') || field.name.includes('dob') || field.id.includes('birth')) {
      if (parsedDate > new Date()) {
        return {
          fieldId: field.id,
          message: {
            en: 'Date of birth cannot be in the future. Please check the year and month.',
            ml: 'ജനനത്തീയതി ഭാവിയിലെ തീയതി ആകാൻ പാടില്ല. ദയവായി ശരിയായ തീയതി നൽകുക.',
          },
        };
      }
    }
  }

  // Length constraints
  if (minLength && strValue.length < minLength) {
    return {
      fieldId: field.id,
      message: {
        en: `Your response is too short. Please enter at least ${minLength} characters (currently ${strValue.length}).`,
        ml: `കുറഞ്ഞത് ${minLength} അക്ഷരങ്ങൾ നൽകണം (ഇപ്പോൾ നൽകിയത്: ${strValue.length}).`,
      },
    };
  }

  if (maxLength && strValue.length > maxLength) {
    return {
      fieldId: field.id,
      message: {
        en: `Your response exceeds the limit of ${maxLength} characters.`,
        ml: `പരമാവധി ${maxLength} അക്ഷരങ്ങൾ മാത്രമേ അനുവദിക്കൂ.`,
      },
    };
  }

  // Regex pattern constraints
  if (pattern) {
    try {
      const regex = new RegExp(pattern);
      if (!regex.test(strValue)) {
        return {
          fieldId: field.id,
          message: {
            en: `The format is incorrect. Please follow the required pattern.`,
            ml: `നൽകിയ വിവരങ്ങളുടെ ഫോർമാറ്റ് ശരിയല്ല. ദയവായി തിരുത്തുക.`,
          },
        };
      }
    } catch {
      // Ignore invalid regex in source
    }
  }

  return null;
}
