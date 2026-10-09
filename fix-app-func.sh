sed -i '/const handleOriginalSubmit = /i \
  const runRescueDetection = () => {\
    if (!report) return;\
    const form = document.getElementById("embedded-demo-form") as HTMLFormElement;\
    if (form) {\
      const rescue = detectFormValidationErrors(form, report.fields);\
      setReport({ ...report, rescueReport: rescue });\
    }\
  };\
' src/App.tsx
