import React from 'react';
import { AccessibilityFinding, FormInspectionReport } from '../../types';

/** Human titles for the inspection rules the engine actually emits. */
const RULE_TITLES: Record<string, string> = {
  'button-name': 'Button with no name',
  'ambiguous-button-label': 'Ambiguous button label',
  'custom-button-keyboard': 'Button not reachable by keyboard',
  'radiogroup-missing-fieldset-legend': 'Radio group without a group label',
  'placeholder-as-label': 'Placeholder used as the only label',
  'missing-label': 'Missing label',
  'required-not-programmatic': 'Required not announced to assistive technology',
  'missing-semantic-input-type': 'Generic field type',
  'date-input-unstructured': 'Date field without a clear format',
  'unassociated-error-message': 'Error message not linked to the field',
};

const humanTitle = (finding: AccessibilityFinding) =>
  RULE_TITLES[finding.ruleId] ?? finding.ruleId.replace(/-/g, ' ');

interface Props {
  report: FormInspectionReport;
  /**
   * 'compact' — popup density: what was detected, on which field, why.
   * 'full' — audit density: adds remediation, WCAG reference, coverage.
   */
  density?: 'compact' | 'full';
  /** Cap the number of rendered findings (remaining ones are counted). */
  limit?: number;
}

export const FindingsList: React.FC<Props> = ({ report, density = 'full', limit }) => {
  const { findings, fields, unsupportedFields } = report;

  /** The affected field, phrased for a person rather than for a DOM inspector. */
  const affectedField = (finding: AccessibilityFinding): string | null => {
    const match =
      fields.find((f) => f.id === finding.fieldId || f.name === finding.fieldName) ?? null;
    if (match) return match.label;
    if (finding.fieldName) return finding.fieldName;
    return null;
  };

  const shown = typeof limit === 'number' ? findings.slice(0, limit) : findings;
  const hidden = findings.length - shown.length;

  if (findings.length === 0) {
    return (
      <p className="km-sub" role="status">
        No labelling or grouping problems were detected on this page.
      </p>
    );
  }

  return (
    <div>
      <div className="km-findings">
        {shown.map((finding) => {
          const field = affectedField(finding);
          return (
            <article key={finding.id} className="km-finding">
              <div className="km-finding__head">
                <h3 className="km-finding__name">{humanTitle(finding)}</h3>
                <span className={`km-sev km-sev--${finding.severity}`}>
                  {finding.severity}
                </span>
                {density === 'full' && finding.wcagCriteria && (
                  <span className="km-finding__wcag">{finding.wcagCriteria}</span>
                )}
              </div>

              <p className="km-finding__row">
                <strong>{field ? `${field} field` : 'Page control'}</strong>
                {' · '}
                <code>{finding.elementSummary}</code>
              </p>

              <p className="km-finding__row">{finding.evidence}</p>

              {density === 'full' && (
                <>
                  <p className="km-finding__row km-finding__row--action">
                    <strong>Fix:</strong> {finding.suggestedRemediation}
                  </p>
                  <p
                    className={`km-finding__support${
                      finding.canAutoRepair ? '' : ' km-finding__support--manual'
                    }`}
                  >
                    {finding.canAutoRepair
                      ? field
                        ? 'Guided Mode covers this field.'
                        : 'Vazhika can address this in Guided Mode.'
                      : 'Guided Mode cannot cover this — it needs attention on the original page.'}
                  </p>
                </>
              )}
            </article>
          );
        })}
      </div>

      {hidden > 0 && (
        <p className="km-meta" style={{ marginTop: '0.6rem' }}>
          {hidden} more {hidden === 1 ? 'finding' : 'findings'} not shown here.
        </p>
      )}

      {density === 'full' && unsupportedFields.length > 0 && (
        <section style={{ marginTop: '1.5rem' }}>
          <h3 className="km-eyebrow">Not covered by Guided Mode</h3>
          <div className="km-findings" style={{ marginTop: '0.5rem' }}>
            {unsupportedFields.map((item) => (
              <article key={item.id} className="km-finding">
                <p className="km-finding__row">
                  <strong>
                    <code>&lt;{item.tagName}&gt;</code>
                  </strong>{' '}
                  — {item.reason}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
