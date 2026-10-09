sed -i '/const handleClearDraft = /i \
  const runRescueDetection = () => {\
    if (!report) return;\
    const iframe = document.getElementById("demo-frame") as HTMLIFrameElement;\
    if (iframe?.contentWindow) {\
      setReport({ ...report });\
    }\
  };\
' src/App.tsx
