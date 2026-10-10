import React, { useState, useEffect } from 'react';
import { BrandHeader } from '../components/BrandHeader';
import { AccessibilityToolbar } from '../components/AccessibilityToolbar';
import { GuidedWorkflow } from '../components/guided-workflow/GuidedWorkflow';
import { FindingsList } from '../components/findings/FindingsList';
import { FormInspectionReport, TransferResult, FieldDefinition, FieldOption } from '../types';
import { useAccessibility } from '../modules/accessibility-controls/AccessibilityProvider';
import { clearDraft } from '../modules/draft-storage';
import { RefreshCw, ExternalLink, ArrowRight, ShieldCheck, CheckCircle2, Shield } from 'lucide-react';
import { SecurityGuardBanner } from '../components/security/SecurityGuardBanner';
import { RescueLoopCard } from '../components/rescue-loop/RescueLoopCard';
import { CivicWalletModal } from '../components/civic-wallet/CivicWalletModal';
import { civicWallet } from '../modules/civic-wallet';

type SidePanelView = 'guided' | 'rescue' | 'audit';

export const SidePanel: React.FC = () => {
  const { language, announce } = useAccessibility();

  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [report, setReport] = useState<FormInspectionReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<SidePanelView>('guided');
  const [jumpToFieldId, setJumpToFieldId] = useState<string | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);

  const scanActiveTab = () => {
    setIsLoading(true);
    setLoadError(null);

    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (!tab || tab.id === undefined) {
          setIsLoading(false);
          setLoadError('No active browser tab found.');
          return;
        }

        if (
          tab.url?.startsWith('chrome://') ||
          tab.url?.startsWith('edge://') ||
          tab.url?.startsWith('about:')
        ) {
          setIsLoading(false);
          setLoadError(
            'Chrome internal pages cannot be modified. Please open any webpage with a form, or click the Public Service Test Form below.'
          );
          return;
        }

        const tabId: number = tab.id;
        setActiveTabId(tabId);

        chrome.tabs.sendMessage(tabId, { type: 'VAZHIKA_SCAN_PAGE' }, (response: any) => {
          setIsLoading(false);
          if (chrome.runtime.lastError || !response) {
            chrome.scripting.executeScript(
              {
                target: { tabId },
                files: ['content.js'],
              },
              () => {
                if (chrome.runtime.lastError) {
                  setLoadError('Unable to access this page. Please open a webpage with a form or use the demo form.');
                  return;
                }
                chrome.tabs.sendMessage(tabId, { type: 'VAZHIKA_SCAN_PAGE' }, (secondResponse: any) => {
                  if (secondResponse?.report) {
                    setReport(secondResponse.report);
                  } else {
                    setLoadError('No form detected on this page.');
                  }
                });
              }
            );
          } else if (response.report) {
            setReport(response.report);
          } else {
            setLoadError('No form detected on this page.');
          }
        });
      });
    } else {
      // Standalone preview fallback
      import('../fixtures/sample-report').then((mod) => {
        setReport(mod.sampleInaccessibleReport);
        setIsLoading(false);
      });
    }
  };

  useEffect(() => {
    scanActiveTab();
  }, []);

  const handleHighlightField = (selector: string, fieldId: string) => {
    if (activeTabId && typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.sendMessage(activeTabId, {
        type: 'VAZHIKA_HIGHLIGHT_FIELD',
        selector,
        fieldId,
      });
    }
  };

  const runRescueDetection = () => {
    if (activeTabId && typeof chrome !== "undefined" && chrome.tabs) {
      setIsLoading(true);
      chrome.tabs.sendMessage(activeTabId, { type: "VAZHIKA_DETECT_RESCUE" }, (response) => {
        setIsLoading(false);
        if (response?.rescue && report) {
          setReport({ ...report, rescueReport: response.rescue });
        }
      });
    } else {
      // Demo mode refresh
      if (report) {
        setReport({ ...report });
      }
    }
  };

  const handleClearHighlight = () => {
    if (activeTabId && typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.sendMessage(activeTabId, { type: 'VAZHIKA_CLEAR_HIGHLIGHT' });
    }
  };

  const handleTransferAnswers = async (answers: Record<string, any>): Promise<TransferResult> => {
    if (activeTabId && typeof chrome !== 'undefined' && chrome.tabs) {
      return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(activeTabId, { type: 'VAZHIKA_FILL_FIELDS', answers }, (response) => {
          if (chrome.runtime.lastError || !response?.result) {
            reject(new Error(chrome.runtime.lastError?.message || 'Transfer failed.'));
          } else {
            resolve(response.result);
          }
        });
      });
    }

    // Demo simulation mode
    await new Promise((r) => setTimeout(r, 600));
    return {
      success: true,
      transferredCount: report?.fields.length || 6,
      totalFields: report?.fields.length || 6,
      failedFields: [],
      originalFormSubmittable: true,
      notice: 'Demo mode: Answers verified and mapped to form schema successfully.',
    };
  };

  const handleSyncSingleField = async (field: FieldDefinition, value: any): Promise<void> => {
    if (activeTabId && typeof chrome !== 'undefined' && chrome.tabs) {
      return new Promise((resolve) => {
        chrome.tabs.sendMessage(
          activeTabId,
          { type: 'VAZHIKA_FILL_SINGLE_FIELD', fieldId: field.id, value },
          () => resolve()
        );
      });
    }
  };

  const handleRefreshFieldOptions = async (field: FieldDefinition): Promise<FieldOption[] | null> => {
    if (activeTabId && typeof chrome !== 'undefined' && chrome.tabs) {
      return new Promise((resolve) => {
        chrome.tabs.sendMessage(
          activeTabId,
          { type: 'VAZHIKA_GET_FIELD_OPTIONS', fieldId: field.id },
          (response) => {
            if (response?.options && Array.isArray(response.options)) {
              resolve(response.options);
            } else {
              resolve(null);
            }
          }
        );
      });
    }
    return null;
  };

  const handleClearDraft = async () => {
    if (report) {
      await clearDraft(report.formId);
      announce('Draft cleared.');
      window.location.reload();
    }
  };

  const openTestForm = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: chrome.runtime.getURL('test-page.html') });
    } else {
      window.location.href = '/test-page.html';
    }
  };

  return (
    <div className="km-app">
      <BrandHeader badge="Guided Mode" />
      <AccessibilityToolbar onClearDraft={handleClearDraft} />

      {/* Views navigation over the scanned page */}
      {report && !isLoading && (
        <nav className="km-tabs" role="navigation" aria-label={language === 'ml' ? 'കാഴ്ചകൾ' : 'Views'}>
          <button
            type="button"
            className={`km-tab${activeView === 'guided' ? ' km-tab--on' : ''}`}
            aria-current={activeView === 'guided' ? 'page' : undefined}
            onClick={() => setActiveView('guided')}
          >
            {language === 'ml' ? 'ഗൈഡഡ് മോഡ്' : 'Guided'}
          </button>

          <button
            type="button"
            className={`km-tab${activeView === 'rescue' ? ' km-tab--on' : ''}`}
            aria-current={activeView === 'rescue' ? 'page' : undefined}
            onClick={() => { setActiveView('rescue'); runRescueDetection(); }}
          >
            {language === 'ml' ? 'റെസ്ക്യൂ ലൂപ്പ്' : 'Rescue Loop'}
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
            className={`km-tab${activeView === 'audit' ? ' km-tab--on' : ''}`}
            aria-current={activeView === 'audit' ? 'page' : undefined}
            onClick={() => setActiveView('audit')}
          >
            {language === 'ml' ? 'ഓഡിറ്റ്' : 'Audit'} ({report.findings.length})
          </button>

          <span className="km-tabs__end">
            <button
              type="button"
              className="km-btn km-btn--quiet km-btn--sm"
              onClick={() => civicWallet.openModal()}
              title={language === 'ml' ? 'സിവിക് വാലറ്റ് (Civic Wallet)' : 'Civic Wallet'}
            >
              <Shield size={14} aria-hidden="true" />
              <span>{language === 'ml' ? 'വാലറ്റ്' : 'Wallet'}</span>
            </button>

            <button
              type="button"
              className="km-btn km-btn--quiet km-btn--sm"
              onClick={scanActiveTab}
              title={language === 'ml' ? 'വീണ്ടും സ്കാൻ ചെയ്യുക' : 'Rescan this page'}
            >
              <RefreshCw size={14} aria-hidden="true" />
              <span>{language === 'ml' ? 'വീണ്ടും സ്കാൻ' : 'Rescan'}</span>
            </button>
          </span>
        </nav>
      )}

      <main style={{ flex: 1 }}>
        {/* Security / Phishing Guard Banner */}
        {report && !isLoading && report.securityReport && (
          <div style={{ padding: '0.85rem 1.25rem 0', maxWidth: '860px' }}>
            <SecurityGuardBanner report={report.securityReport} />
          </div>
        )}

        {/* Scanning */}
        {isLoading && (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }} role="status">
            <div className="km-scanline" />
            <p className="km-sub" style={{ marginTop: '0.75rem' }}>
              {language === 'ml' ? 'ഫോം കോളങ്ങൾ പരിശോധിക്കുന്നു…' : 'Reading form controls and labels…'}
            </p>
          </div>
        )}

        {/* Nothing to work on */}
        {loadError && !isLoading && (
          <div className="km-state" style={{ margin: '2.5rem 1.5rem' }}>
            <h2 className="km-state__title">{language === 'ml' ? 'ഫോം കണ്ടെത്തിയില്ല' : 'No form to work on'}</h2>
            <p className="km-state__body">{loadError}</p>
            <div className="km-state__actions" style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button type="button" className="km-btn km-btn--primary" onClick={openTestForm}>
                <ExternalLink size={16} aria-hidden="true" />
                <span>{language === 'ml' ? 'പരീക്ഷണ ഫോം തുറക്കുക' : 'Open the public service test form'}</span>
              </button>
              <button type="button" className="km-btn km-btn--secondary" onClick={() => civicWallet.openModal()}>
                <Shield size={16} aria-hidden="true" />
                <span>{language === 'ml' ? 'സിവിക് വാലറ്റ്' : 'Civic Wallet'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Guided Completion */}
        {report && !isLoading && activeView === 'guided' && (
          <GuidedWorkflow
            report={report}
            initialFieldId={jumpToFieldId}
            onHighlightField={handleHighlightField}
            onClearHighlight={handleClearHighlight}
            onTransferAnswers={handleTransferAnswers}
            onSyncSingleField={handleSyncSingleField}
            onRefreshFieldOptions={handleRefreshFieldOptions}
            onExit={scanActiveTab}
          />
        )}

        {/* Rescue Loop */}
        {report && !isLoading && activeView === 'rescue' && (
          <div style={{ padding: '1.25rem 1.5rem', maxWidth: '860px' }}>
            {report.rescueReport?.hasErrors ? (
              <RescueLoopCard
                rescueReport={report.rescueReport}
                onFixFieldInGuided={(fieldId) => {
                  setJumpToFieldId(fieldId);
                  setActiveView('guided');
                }}
                onRetryTransfer={() => setActiveView('guided')}
              />
            ) : (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
                <div style={{ color: 'var(--km-success)', marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="km-title" style={{ fontSize: '1.25rem' }}>
                  {language === 'ml' ? 'പിശകുകൾ ഒന്നും കണ്ടെത്തിയില്ല' : 'No Validation Errors Detected'}
                </h3>
                <p className="km-sub" style={{ marginTop: '0.45rem', maxWidth: '440px', marginInline: 'auto' }}>
                  {language === 'ml'
                    ? 'ഈ ഫോമിൽ തടസ്സപ്പെടുത്തുന്ന ഇൻപുട്ട് പിശകുകളോ അസാധുവായ ഫീൽഡുകളോ കണ്ടെത്തിയിട്ടില്ല. ഫോം സുഗമമായി പൂരിപ്പിക്കാം.'
                    : 'No submission rejections or invalid fields found on this page. If the site rejects your form later, rescan to activate Rescue Loop.'}
                </p>
                <div style={{ marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    className="km-btn km-btn--primary"
                    onClick={() => setActiveView('guided')}
                  >
                    <span>{language === 'ml' ? 'ഗൈഡഡ് മോഡിലേക്ക് തുടരുക' : 'Continue to Guided Completion'}</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Audit — evidence for everything found on this page */}
        {report && !isLoading && activeView === 'audit' && (
          <div style={{ padding: '2rem 1.5rem', maxWidth: '860px' }}>
            <h2 className="km-title">{language === 'ml' ? 'കണ്ടെത്തിയ പ്രശ്നങ്ങൾ' : 'What we found on this page'}</h2>
            <p className="km-sub" style={{ marginTop: '0.4rem' }}>
              {language === 'ml' ? 'ഫോം: ' : 'Form: '}
              {report.formTitle} · {language === 'ml' ? 'ഡബ്ല്യുസിഎഎഎജി 2.2 AA' : 'WCAG 2.2 AA'}
            </p>

            <div className="km-summary-line" style={{ marginTop: '1.1rem' }}>
              <span>
                <strong>{report.totalControlsFound}</strong>{' '}
                {language === 'ml' ? 'കോളങ്ങൾ' : 'controls'}
              </span>
              <span>
                <strong>{report.findings.length}</strong>{' '}
                {language === 'ml' ? 'കണ്ടെത്തലുകൾ' : 'findings'}
              </span>
              <span>
                <strong>{report.fields.filter((f) => f.isSafeToRepair).length}</strong>{' '}
                {language === 'ml' ? 'കവർ ചെയ്യുന്ന ചോദ്യങ്ങൾ' : 'covered by guided questions'}
              </span>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <FindingsList report={report} density="full" />
            </div>

            <div style={{ marginTop: '1.75rem' }}>
              <button type="button" className="km-btn km-btn--primary" onClick={() => setActiveView('guided')}>
                <span>{language === 'ml' ? 'ഗൈഡഡ് മോഡിലേക്ക് പോകുക' : 'Go to Guided Completion'}</span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </main>

      <CivicWalletModal />
    </div>
  );
};
