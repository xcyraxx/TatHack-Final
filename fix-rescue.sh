sed -i '/const handleClearHighlight/i \
  const runRescueDetection = () => {\
    if (activeTabId && typeof chrome !== "undefined" && chrome.tabs) {\
      setIsLoading(true);\
      chrome.tabs.sendMessage(activeTabId, { type: "VAZHIKA_DETECT_RESCUE" }, (response) => {\
        setIsLoading(false);\
        if (response?.rescue && report) {\
          setReport({ ...report, rescueReport: response.rescue });\
        }\
      });\
    } else {\
      // Demo mode refresh\
      if (report) {\
        setReport({ ...report });\
      }\
    }\
  };\
' src/sidepanel/SidePanel.tsx

sed -i "s/onClick={() => setActiveView('rescue')}/onClick={() => { setActiveView('rescue'); runRescueDetection(); }}/g" src/sidepanel/SidePanel.tsx
