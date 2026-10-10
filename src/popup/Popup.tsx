import React, { useState, useEffect } from 'react';
import { BrandHeader } from '../components/BrandHeader';
import { AccessibilityToolbar } from '../components/AccessibilityToolbar';
import { FindingsList } from '../components/findings/FindingsList';
import { FormInspectionReport } from '../types';
import { useAccessibility } from '../modules/accessibility-controls/AccessibilityProvider';
import { AlertTriangle, ScanLine, ArrowRight, RotateCcw } from 'lucide-react';
import { SecurityGuardBanner } from '../components/security/SecurityGuardBanner';
import { CivicWalletModal } from '../components/civic-wallet/CivicWalletModal';

interface ScanError {
  title: string;
  body: string;
}

export const Popup: React.FC = () => {
  const { language, announce } = useAccessibility();

  const [activeTab, setActiveTab] = useState<{ id?: number; title?: string; url?: string }>({});
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [report, setReport] = useState<FormInspectionReport | null>(null);
  const [scanError, setScanError] = useState<ScanError | null>(null);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          setActiveTab({
            id: tabs[0].id,
            title: tabs[0].title,
            url: tabs[0].url,
          });
        }
      });
    }
  }, []);

  const hostname = (() => {
    try {
      return activeTab.url ? new URL(activeTab.url).hostname : '';
    } catch {
      return '';
    }
  })();

  const handleScanPage = () => {
    setIsScanning(true);
    setScanError(null);
    setReport(null);
    announce(language === 'ml' ? 'വെബ്‌പേജ് സ്കാൻ ചെയ്യുന്നു...' : 'Scanning active webpage for forms...');

    if (typeof chrome === 'undefined' || !chrome.tabs || !activeTab.id) {
      setTimeout(() => {
        setIsScanning(false);
        setScanError({
          title: language === 'ml' ? 'ബ്രൗസർ കണക്ഷൻ ഇല്ല' : 'Extension context unavailable',
          body:
            language === 'ml'
              ? 'പരീക്ഷണ ഫോം തുറന്ന് വഴിക പരീക്ഷിക്കുക.'
              : 'Open the public service test form to try Vazhika.',
        });
      }, 400);
      return;
    }

    if (
      activeTab.url?.startsWith('chrome://') ||
      activeTab.url?.startsWith('edge://') ||
      activeTab.url?.startsWith('about:')
    ) {
      setIsScanning(false);
      setScanError({
        title: language === 'ml' ? 'ഈ പേജ് സ്കാൻ ചെയ്യാൻ കഴിയില്ല' : 'This page cannot be scanned',
        body:
          language === 'ml'
            ? 'ക്രോമിന്റെ ആന്തരിക പേജുകൾ എക്സ്റ്റൻഷനുകൾക്ക് പ്രവർത്തിക്കാൻ അനുവദിക്കുന്നില്ല. ഒരു ഫോം ഉള്ള വെബ്‌സൈറ്റ് തുറക്കുക.'
            : 'Chrome’s internal pages do not allow extensions to run. Open a website that contains a form.',
      });
      return;
    }

    const tabId = activeTab.id;

    chrome.tabs.sendMessage(tabId, { type: 'VAZHIKA_SCAN_PAGE' }, (response) => {
      setIsScanning(false);
      if (chrome.runtime.lastError || !response) {
        chrome.scripting.executeScript(
          {
            target: { tabId },
            files: ['content.js'],
          },
          () => {
            if (chrome.runtime.lastError) {
              setScanError({
                title: language === 'ml' ? 'പേജ് ആക്സസ് ചെയ്യാൻ കഴിഞ്ഞില്ല' : 'Unable to access this page',
                body:
                  language === 'ml'
                    ? 'സുരക്ഷിത പേജുകൾ ചിലപ്പോൾ പ്രവർത്തനം തടയും. മറ്റൊരു ഫോം ഉള്ള പേജ് ശ്രമിക്കുക.'
                    : 'Protected pages can block extensions. Try another page with a form.',
              });
              return;
            }
            chrome.tabs.sendMessage(tabId, { type: 'VAZHIKA_SCAN_PAGE' }, (secondResponse) => {
              if (secondResponse?.report) {
                setReport(secondResponse.report);
                announce(
                  `Scan complete. ${secondResponse.report.fields.length} fields, ${secondResponse.report.findings.length} findings.`
                );
              } else {
                setScanError({
                  title: language === 'ml' ? 'ഫോം കണ്ടെത്തിയില്ല' : 'No form on this page',
                  body:
                    language === 'ml'
                      ? 'ഈ പേജിൽ ഫോം കോളങ്ങൾ ഒന്നും കണ്ടെത്തിയില്ല.'
                      : 'No form controls were detected on this page.',
                });
              }
            });
          }
        );
      } else if (response.report) {
        setReport(response.report);
        announce(
          `Scan complete. ${response.report.fields.length} fields, ${response.report.findings.length} findings.`
        );
      } else {
        setScanError({
          title: language === 'ml' ? 'ഫോം കണ്ടെത്തിയില്ല' : 'No form on this page',
          body:
            language === 'ml'
              ? 'ഈ പേജിൽ ഫോം കോളങ്ങൾ ഒന്നും കണ്ടെത്തിയില്ല.'
              : 'No form controls were detected on this page.',
        });
      }
    });
  };

  const handleOpenGuidedMode = () => {
    if (typeof chrome !== 'undefined' && chrome.sidePanel && activeTab.id) {
      chrome.sidePanel.open({ tabId: activeTab.id }).catch(() => {
        chrome.tabs.create({ url: chrome.runtime.getURL('sidepanel.html') });
      });
    } else if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: chrome.runtime.getURL('sidepanel.html') });
    } else {
      window.open('/sidepanel.html', '_blank');
    }
  };

  const handleOpenDemoPage = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: chrome.runtime.getURL('test-page.html') });
    } else {
      window.open('/test-page.html', '_blank');
    }
  };

  const testFormLink = (
    <button type="button" className="km-btn km-btn--quiet km-btn--sm" onClick={handleOpenDemoPage}>
      {language === 'ml' ? 'പരീക്ഷണ ഫോം തുറക്കുക' : 'Open the test form'}
    </button>
  );

  return (
    <div className="km-popup">
      <BrandHeader compact />

      {/* One secondary route to accessibility preferences */}
      <AccessibilityToolbar compact />

      <div className="km-popup__body">
        {/* Current page context */}
        <div className="km-popup__context">
          <div className="km-popup__context-label">
            {language === 'ml' ? 'ഇപ്പോഴത്തെ പേജ്' : 'This page'}
          </div>
          <div className="km-popup__context-title">
            {activeTab.title || (language === 'ml' ? 'നിലവിലെ ടാബ്' : 'Current tab')}
          </div>
          {hostname && <div className="km-popup__context-url">{hostname}</div>}
        </div>

        {/* Loading */}
        {isScanning && (
          <div role="status">
            <div className="km-scanline" />
            <p className="km-sub" style={{ marginTop: '0.6rem' }}>
              {language === 'ml'
                ? 'ഫോം കോളങ്ങൾ പരിശോധിക്കുന്നു…'
                : 'Reading form controls and labels…'}
            </p>
          </div>
        )}

        {/* Failure */}
        {scanError && !isScanning && (
          <div className="km-notice km-notice--warning" role="alert">
            <AlertTriangle size={16} aria-hidden="true" />
            <div>
              <strong className="km-notice__title">{scanError.title}</strong>
              {scanError.body}
            </div>
          </div>
        )}

        {/* Evidence-based result */}
        {report && !isScanning && (
          <div className="km-popup__section">
            {report.securityReport && (
              <SecurityGuardBanner report={report.securityReport} compact />
            )}

            {report.rescueReport?.hasErrors && (
              <div
                className="km-notice km-notice--warning"
                style={{ marginBottom: '0.85rem', cursor: 'pointer' }}
                onClick={handleOpenGuidedMode}
                role="alert"
              >
                <RotateCcw size={16} aria-hidden="true" style={{ color: 'var(--km-warning)', flexShrink: 0 }} />
                <div>
                  <strong className="km-notice__title">
                    {language === 'ml'
                      ? `റെസ്ക്യൂ ലൂപ്പ്: ${report.rescueReport.totalErrors} തെറ്റുകൾ കണ്ടെത്തി`
                      : `Rescue Loop: ${report.rescueReport.totalErrors} submission errors`}
                  </strong>
                  <p style={{ margin: '0.2rem 0 0', fontSize: 'var(--km-fs-meta)', lineHeight: 1.35 }}>
                    {language === 'ml'
                      ? 'സൈറ്റ് നിരസിച്ച കോളങ്ങൾ എളുപ്പത്തിൽ തിരുത്താൻ ഗൈഡഡ് മോഡ് തുറക്കുക.'
                      : 'Open Guided Mode to review and repair rejected fields.'}
                  </p>
                </div>
              </div>
            )}

            <div className="km-summary-line">
              <span>
                <strong>{report.totalControlsFound}</strong>{' '}
                {language === 'ml' ? 'കോളങ്ങൾ' : 'controls'}
              </span>
              <span>
                <strong>{report.findings.length}</strong>{' '}
                {language === 'ml' ? 'കണ്ടെത്തലുകൾ' : 'findings'}
              </span>
              <span>
                <strong>{report.fields.length}</strong>{' '}
                {language === 'ml' ? 'ഗൈഡഡ് ചോദ്യങ്ങൾ' : 'guided questions'}
              </span>
            </div>
            <p className="km-sub" style={{ marginTop: '0.35rem' }}>
              {report.formTitle}
            </p>

            <div className="km-popup__findings">
              <FindingsList report={report} density="compact" limit={3} />
            </div>
          </div>
        )}

        {/* The one dominant action for this state */}
        <div className="km-stack" style={{ gap: '0.5rem' }}>
          {isScanning ? (
            <button type="button" className="km-btn km-btn--primary km-btn--block" disabled>
              <span>{language === 'ml' ? 'സ്കാൻ ചെയ്യുന്നു…' : 'Scanning this page…'}</span>
            </button>
          ) : report ? (
            <button type="button" className="km-btn km-btn--primary km-btn--block" onClick={handleOpenGuidedMode}>
              <span>
                {language === 'ml' ? 'ഗൈഡഡ് മോഡിലേക്ക് തുടരുക' : 'Continue to Guided Mode'}
              </span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          ) : (
            <button type="button" className="km-btn km-btn--primary km-btn--block" onClick={handleScanPage}>
              <ScanLine size={16} aria-hidden="true" />
              <span>{language === 'ml' ? 'ഈ പേജ് സ്കാൻ ചെയ്യുക' : 'Scan this page'}</span>
            </button>
          )}

          {!isScanning && (report || scanError) && (
            <button
              type="button"
              className="km-btn km-btn--secondary km-btn--block"
              onClick={handleScanPage}
            >
              {language === 'ml' ? 'വീണ്ടും സ്കാൻ ചെയ്യുക' : 'Scan again'}
            </button>
          )}
        </div>

        {/* Bottom-anchored secondary route */}
        <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>{testFormLink}</div>
      </div>

      <CivicWalletModal />
    </div>
  );
};
