import React, { useState, useEffect } from 'react';
import { BrandHeader } from '../components/BrandHeader';
import { AccessibilityToolbar } from '../components/AccessibilityToolbar';
import { GuidedWorkflow } from '../components/guided-workflow/GuidedWorkflow';
import { FindingsList } from '../components/findings/FindingsList';
import { FormInspectionReport, TransferResult } from '../types';
import { useAccessibility } from '../modules/accessibility-controls/AccessibilityProvider';
import { clearDraft } from '../modules/draft-storage';
import { RefreshCw, ExternalLink, ArrowRight } from 'lucide-react';

export const SidePanel: React.FC = () => {
  const { language, announce } = useAccessibility();

  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [report, setReport] = useState<FormInspectionReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<'guided' | 'audit'>('guided');
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

      {/* Two views over the same scan */}
      {report && !isLoading && (
        <nav className="km-tabs" role="navigation" aria-label={language === 'ml' ? 'കാഴ്ചകൾ' : 'Views'}>
          <button
            type="button"
            className={`km-tab${activeView === 'guided' ? ' km-tab--on' : ''}`}
            aria-current={activeView === 'guided' ? 'page' : undefined}
            onClick={() => setActiveView('guided')}
          >
            {language === 'ml' ? 'ഗൈഡഡ് മോഡ്' : 'Guided Completion'}
          </button>

          <button
            type="button"
            className={`km-tab${activeView === 'audit' ? ' km-tab--on' : ''}`}
            aria-current={activeView === 'audit' ? 'page' : undefined}
            onClick={() => setActiveView('audit')}
          >
            {language === 'ml' ? 'ഓഡിറ്റ്' : 'Accessibility Audit'} ({report.findings.length})
          </button>

          <span className="km-tabs__end">
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
            <div className="km-state__actions">
              <button type="button" className="km-btn km-btn--primary" onClick={openTestForm}>
                <ExternalLink size={16} aria-hidden="true" />
                <span>{language === 'ml' ? 'പരീക്ഷണ ഫോം തുറക്കുക' : 'Open the public service test form'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Guided Completion */}
        {report && !isLoading && activeView === 'guided' && (
          <GuidedWorkflow
            report={report}
            onHighlightField={handleHighlightField}
            onClearHighlight={handleClearHighlight}
            onTransferAnswers={handleTransferAnswers}
            onExit={scanActiveTab}
          />
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
    </div>
  );
};
