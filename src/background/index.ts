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

// Listen for messages from popup or sidepanel
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
        return true;
      }
    }
    return false;
  });
}
