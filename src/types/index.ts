export type IssueSeverity = 'critical' | 'serious' | 'moderate' | 'minor';

export interface AccessibilityFinding {
  id: string;
  ruleId: string;
  severity: IssueSeverity;
  elementSummary: string;
  fieldId?: string;
  fieldName?: string;
  evidence: string;
  suggestedRemediation: string;
  canAutoRepair: boolean;
  wcagCriteria?: string;
}

export type SupportedFieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'date'
  | 'number'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'textarea'
  | 'file';

export interface FieldOption {
  value: string;
  label: string;
  description?: string;
}

export interface FieldValidationRules {
  required?: boolean;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  min?: string | number;
  max?: string | number;
  customValidator?: (value: any) => string | null;
}

export interface FieldDefinition {
  id: string;
  originalId?: string;
  name: string;
  selector: string;
  originalType: string;
  type: SupportedFieldType;
  label: string;
  questionText: string;
  explanation: {
    en: string;
    ml: string;
  };
  placeholder?: string;
  required: boolean;
  options?: FieldOption[];
  validation: FieldValidationRules;
  errorMessage?: string;
  unsupportedReason?: string;
  isSafeToRepair: boolean;
  currentValue?: any;
}

export interface FormInspectionReport {
  formId: string;
  formTitle: string;
  url: string;
  totalControlsFound: number;
  findings: AccessibilityFinding[];
  fields: FieldDefinition[];
  unsupportedFields: {
    id: string;
    tagName: string;
    reason: string;
  }[];
  inspectedAt: string;
  isCompliant: boolean;
}

export interface FormDraftState {
  formId: string;
  currentStepIndex: number;
  answers: Record<string, any>;
  lastSavedAt: string;
  completed: boolean;
}

export interface FieldTransferFailure {
  fieldId: string;
  label: string;
  reason: string;
}

export interface TransferResult {
  success: boolean;
  transferredCount: number;
  totalFields: number;
  failedFields: FieldTransferFailure[];
  originalFormSubmittable: boolean;
  notice: string;
}

/* Extension Messaging Protocol */
export type ExtensionMessage =
  | { type: 'VAZHIKA_PING' }
  | { type: 'VAZHIKA_PONG'; alive: boolean }
  | { type: 'VAZHIKA_SCAN_PAGE' }
  | { type: 'VAZHIKA_SCAN_RESULT'; report: FormInspectionReport }
  | { type: 'VAZHIKA_HIGHLIGHT_FIELD'; fieldId: string; selector?: string }
  | { type: 'VAZHIKA_CLEAR_HIGHLIGHT' }
  | { type: 'VAZHIKA_FILL_FIELDS'; answers: Record<string, any> }
  | { type: 'VAZHIKA_FILL_RESULT'; result: TransferResult }
  | { type: 'VAZHIKA_OPEN_SIDEPANEL'; tabId?: number };
