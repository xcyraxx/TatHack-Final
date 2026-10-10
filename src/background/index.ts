/**
 * Vazhika — Background Service Worker (Manifest V3)
 * Coordinates extension lifecycle, side panel activation, and message routing.
 */

// Handle side panel behavior
if (typeof chrome !== 'undefined' && chrome.sidePanel) {
  // Allow opening side panel on action click or via message
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: false })
    .catch((error) => console.log('Side panel config error:', error));
}

// Listen for messages from popup, sidepanel, and content scripts
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'VAZHIKA_OPEN_SIDEPANEL') {
      const tabId = message.tabId;
      if (tabId && chrome.sidePanel) {
        chrome.sidePanel.open({ tabId }).then(() => {
          sendResponse({ success: true });
        }).catch((err) => {
          console.error('Failed to open side panel:', err);
          sendResponse({ success: false, error: err.message });
        });
        return true; // keep channel open for async response
      }
    }

    // IMPORTANT: Dictation messages from content script need to propagate to the
    // side panel's chrome.runtime.onMessage listener. Do NOT return false here for
    // these message types — returning false/undefined lets Chrome continue
    // dispatching the message to other listeners (side panel, popup).
    if (
      message.type === 'VAZHIKA_DICTATION_RESULT' ||
      message.type === 'VAZHIKA_DICTATION_ERROR' ||
      message.type === 'VAZHIKA_DICTATION_END'
    ) {
      // Let the message pass through to other extension pages (side panel)
      return false;
    }

    return false;
  });
}
