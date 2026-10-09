import React, { useState, useRef } from 'react';
import { BrandHeader } from './components/BrandHeader';
import { AccessibilityToolbar } from './components/AccessibilityToolbar';
import { GuidedWorkflow } from './components/guided-workflow/GuidedWorkflow';
import { FindingsList } from './components/findings/FindingsList';
import { inspectFormElement } from './modules/form-inspector';
import { evaluateSecurity } from './modules/security-guard';
import { detectFormValidationErrors } from './modules/rescue-loop';
import { SecurityGuardBanner } from './components/security/SecurityGuardBanner';
import { RescueLoopCard } from './components/rescue-loop/RescueLoopCard';
import { fillFields, highlightField, clearHighlight } from './content';
import { FormInspectionReport, TransferResult } from './types';
import { useAccessibility } from './modules/accessibility-controls/AccessibilityProvider';
import { Search, ArrowRight, CheckCircle2 } from 'lucide-react';

type AppTab = 'harness' | 'rescue' | 'audit';

export const App: React.FC = () => {
  const { announce } = useAccessibility();

  const [activeTab, setActiveView] = useState<AppTab>('harness');
  const [report, setReport] = useState<FormInspectionReport | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [formSubmittedData, setFormSubmittedData] = useState<Record<string, any> | null>(null);

  const formContainerRef = useRef<HTMLDivElement>(null);

  const handleScanForm = () => {
    setIsScanning(true);
    announce('Scanning embedded test form...');

    setTimeout(() => {
      const formEl = document.getElementById('embedded-demo-form');
      if (formEl) {
        const result = inspectFormElement(formEl, window.location.href);
        result.securityReport = evaluateSecurity(window.location.href, formEl);
        result.rescueReport = detectFormValidationErrors(formEl, result.fields);
        setReport(result);
        announce(
          `Scan complete. Found ${result.fields.length} fields and ${result.findings.length} accessibility issues.`
        );
      }
      setIsScanning(false);
    }, 300);
  };

  const handleTransferToEmbeddedForm = async (answers: Record<string, any>): Promise<TransferResult> => {
    const res = fillFields(answers);
    announce(`Transferred ${res.transferredCount} fields to live form.`);
    return res;
  };

  const runRescueDetection = () => {
    if (!report) return;
    const form = document.getElementById("embedded-demo-form") as HTMLFormElement;
    if (form) {
      const rescue = detectFormValidationErrors(form, report.fields);
      setReport({ ...report, rescueReport: rescue });
    }
  };

  const handleOriginalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = document.getElementById('embedded-demo-form') as HTMLFormElement;
    if (form) {
      if (report) {
        const rescue = detectFormValidationErrors(form, report.fields);
        if (rescue.hasErrors) {
          setReport({ ...report, rescueReport: rescue });
          announce('Form submission failed validation. Rescue Loop activated.');
          return;
        }
      }
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      setFormSubmittedData(data);
      announce('Original form submitted by user.');
    }
  };

  return (
    <div className="km-app">
      <BrandHeader badge="Extension Workbench & Simulator" />
      <AccessibilityToolbar />

      {/* What this page is */}
      <section style={{ backgroundColor: 'var(--km-white)', borderBottom: '1px solid var(--km-border)', padding: '1.5rem 1.5rem 1.35rem' }}>
        <div style={{ maxWidth: 'var(--km-width-page)', margin: '0 auto' }}>
          <h1 className="km-title">Vazhika workbench</h1>
          <p className="km-sub" style={{ marginTop: '0.35rem', maxWidth: '640px' }}>
            The original form on the left, Guided Mode on the right. Scan the fixture to watch a
            difficult form become one question at a time.
          </p>
        </div>
      </section>

      {/* Views over the same scan */}
      <nav className="km-tabs" aria-label="Workbench views">
        <button
          type="button"
          className={`km-tab${activeTab === 'harness' ? ' km-tab--on' : ''}`}
          aria-current={activeTab === 'harness' ? 'page' : undefined}
          onClick={() => setActiveView('harness')}
        >
          Side-by-side workbench
        </button>

        {report && (
          <>

            <button
              type="button"
              className={`km-tab${activeTab === 'rescue' ? ' km-tab--on' : ''}`}
              aria-current={activeTab === 'rescue' ? 'page' : undefined}
              onClick={() => { setActiveView('rescue'); runRescueDetection(); }}
            >
              Rescue Loop
              {report.rescueReport?.hasErrors ? (
                <span
                  style={{
                    marginLeft: '0.35rem',
                    backgroundColor: 'var(--km-error)',
                    color: '#FFFFFF',
                    borderRadius: '10px',
                    padding: '1px 6px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                  }}
                >
                  {report.rescueReport.totalErrors}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              className={`km-tab${activeTab === 'audit' ? ' km-tab--on' : ''}`}
              aria-current={activeTab === 'audit' ? 'page' : undefined}
              onClick={() => setActiveView('audit')}
            >
              Inspection findings ({report.findings.length})
            </button>
          </>
        )}

        <span className="km-tabs__end" style={{ display: 'flex', gap: '0.9rem', padding: '0.45rem 0' }}>
          <a className="km-link" href="/popup.html" target="_blank" rel="noreferrer">
            Popup view
          </a>
          <a className="km-link" href="/sidepanel.html" target="_blank" rel="noreferrer">
            Side panel view
          </a>
          <a className="km-link" href="/test-page.html" target="_blank" rel="noreferrer">
            Test page
          </a>
        </span>
      </nav>

      <main className="km-workbench" style={activeTab !== 'harness' ? { display: 'block' } : undefined}>
        {activeTab === 'harness' && (
          <>
            {/* Left — the fixture page as a person would meet it */}
            <section className="km-panel km-panel--flush" ref={formContainerRef}>
              <div className="km-panel__head">
                <div>
                  <h2 className="km-title">Public Service Registration Portal</h2>
                  <p className="km-sub" style={{ marginTop: '0.2rem' }}>
                    Kerala e-Seva Citizen Application — target page
                  </p>
                </div>
                <button type="button" onClick={handleScanForm} disabled={isScanning} className="km-btn km-btn--secondary">
                  <Search size={16} aria-hidden="true" />
                  <span>{isScanning ? 'Inspecting…' : 'Scan with Vazhika'}</span>
                </button>
              </div>

              <div className="km-panel__body">
                <p className="km-fixture-note">
                  <strong>Deliberately inaccessible fixture:</strong> missing accessible names,
                  unassociated errors, asterisk-only required indicators, unsemantic input types,
                  and confusing terminology.
                </p>

                <form id="embedded-demo-form" onSubmit={handleOriginalSubmit}>
                  {/* 1. Missing label */}
                  <div className="km-fixture-field">
                    <span className="km-fixture-defect">
                      [Defect: Missing &lt;label&gt; — placeholder used as only description]
                    </span>
                    <input
                      id="fullname"
                      name="fullname"
                      type="text"
                      placeholder="Applicant full legal name as per Aadhaar"
                      className="km-fixture-control"
                    />
                  </div>

                  {/* 2. Visual asterisk without programmatic required */}
                  <div className="km-fixture-field">
                    <label htmlFor="email" className="km-fixture-label">
                      Email Address <span style={{ color: 'var(--km-error)' }}>*</span>
                    </label>
                    <input id="email" name="email" type="text" placeholder="name@example.com" className="km-fixture-control" />
                  </div>

                  {/* 3. Telephone */}
                  <div className="km-fixture-field">
                    <label htmlFor="phone" className="km-fixture-label">
                      Mobile Number <span style={{ color: 'var(--km-error)' }}>*</span>
                    </label>
                    <input id="phone" name="phone" type="text" placeholder="10-digit mobile number" className="km-fixture-control" />
                  </div>

                  {/* 4. Date of birth */}
                  <div className="km-fixture-field">
                    <label htmlFor="dob" className="km-fixture-label">
                      Date of Birth
                    </label>
                    <input id="dob" name="dob" type="date" className="km-fixture-control" />
                  </div>

                  {/* 5. Correspondence address */}
                  <div className="km-fixture-field">
                    <label htmlFor="correspondence_address" className="km-fixture-label">
                      Correspondence Address
                    </label>
                    <textarea
                      id="correspondence_address"
                      name="correspondence_address"
                      rows={3}
                      placeholder="Permanent/Present Postal Communication Address"
                      className="km-fixture-control"
                    />
                  </div>

                  {/* 6. Radio group without fieldset / legend */}
                  <div className="km-fixture-field">
                    <span className="km-fixture-defect">[Defect: Radio group without &lt;fieldset&gt; / &lt;legend&gt;]</span>
                    <div className="km-fixture-label">Select Beneficiary Category</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="radio" name="category" value="general" />
                        <span>General Public Citizen</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="radio" name="category" value="senior" />
                        <span>Senior Citizen (60+ years)</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="radio" name="category" value="differently_abled" />
                        <span>Person with Disability (Divyangjan)</span>
                      </label>
                    </div>
                  </div>

                  {/* 7. Terms & conditions */}
                  <div className="km-fixture-field">
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', cursor: 'pointer' }}>
                      <input type="checkbox" id="terms" name="terms" style={{ marginTop: '3px' }} />
                      <span style={{ fontSize: '0.92rem', lineHeight: 1.45 }}>
                        I hereby declare that the particulars furnished above are true to the best of my knowledge.
                      </span>
                    </label>
                  </div>

                  {/* The original page's own submit — always a manual action */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                      type="submit"
                      style={{
                        padding: '0.85rem 1.8rem',
                        backgroundColor: '#1E293B',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Submit Application
                    </button>
                    <span className="km-meta">Original form — manual action</span>
                  </div>
                </form>

                {formSubmittedData && (
                  <div className="km-notice km-notice--success" style={{ marginTop: '1.5rem' }} role="status">
                    <div>
                      <strong className="km-notice__title">Submitted by the original form</strong>
                      <pre style={{ margin: '0.4rem 0 0', fontSize: 'var(--km-fs-meta)', overflowX: 'auto' }}>
                        {JSON.stringify(formSubmittedData, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Right — the guided layer */}
            <section className="km-panel km-panel--flush" aria-label="Vazhika Guided Mode">
              {report && report.securityReport && (
                <div style={{ padding: '0.85rem 1.15rem 0' }}>
                  <SecurityGuardBanner report={report.securityReport} compact />
                </div>
              )}

              {!report ? (
                <div className="km-state">
                  <h2 className="km-state__title">Nothing scanned yet</h2>
                  <p className="km-state__body">
                    Scan the form on the left. Vazhika reads its controls and labels, then rebuilds it
                    as one question at a time.
                  </p>
                  <div className="km-state__actions">
                    <button type="button" onClick={handleScanForm} disabled={isScanning} className="km-btn km-btn--primary">
                      <Search size={16} aria-hidden="true" />
                      <span>{isScanning ? 'Inspecting…' : 'Scan the form'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <GuidedWorkflow
                  report={report}
                  onHighlightField={(selector, fieldId) => highlightField(selector, fieldId)}
                  onClearHighlight={() => clearHighlight()}
                  onTransferAnswers={handleTransferToEmbeddedForm}
                  onExit={() => setReport(null)}
                />
              )}
            </section>
          </>
        )}



        {/* Rescue Loop */}
        {activeTab === 'rescue' && report && (
          <div style={{ maxWidth: '860px', margin: '0 auto', width: '100%', padding: '1.25rem 0' }}>
            {report.rescueReport?.hasErrors ? (
              <RescueLoopCard
                rescueReport={report.rescueReport}
                onFixFieldInGuided={() => {
                  setActiveView('harness');
                }}
                onRetryTransfer={() => {
                  handleTransferToEmbeddedForm({});
                }}
              />
            ) : (
              <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                <div style={{ color: 'var(--km-success)', marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>
                  <CheckCircle2 size={42} />
                </div>
                <h3 className="km-title">No Validation Errors Detected</h3>
                <p className="km-sub" style={{ marginTop: '0.45rem', maxWidth: '440px', marginInline: 'auto' }}>
                  The embedded form inputs currently pass standard validation. Try clearing a required field and clicking 'Submit Application' to trigger the Rescue Loop.
                </p>
              </div>
            )}
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="km-btn km-btn--primary" onClick={() => setActiveView('harness')}>
                <span>Back to the workbench</span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* Audit */}
        {activeTab === 'audit' && report && (
          <div style={{ maxWidth: '860px' }}>
            <h2 className="km-title">What we found on this page</h2>
            <p className="km-sub" style={{ marginTop: '0.4rem' }}>
              Form: {report.formTitle} · WCAG 2.2 AA
            </p>

            <div className="km-summary-line" style={{ marginTop: '1.1rem' }}>
              <span>
                <strong>{report.totalControlsFound}</strong> controls
              </span>
              <span>
                <strong>{report.findings.length}</strong> findings
              </span>
              <span>
                <strong>{report.fields.filter((f) => f.isSafeToRepair).length}</strong> covered by
                guided questions
              </span>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <FindingsList report={report} density="full" />
            </div>

            <div style={{ marginTop: '1.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button type="button" className="km-btn km-btn--primary" onClick={() => setActiveView('harness')}>
                <span>Back to the workbench</span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
