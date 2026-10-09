sed -i '/const clearHighlight/i \
  const runRescueDetection = () => {\
    if (!report) return;\
    const iframe = document.getElementById("demo-frame") as HTMLIFrameElement;\
    if (iframe?.contentWindow) {\
      // We simulate detection\
      setReport({ ...report });\
    }\
  };\
' src/App.tsx

sed -i "s/onClick={() => setActiveView('rescue')}/onClick={() => { setActiveView('rescue'); runRescueDetection(); }}/g" src/App.tsx
