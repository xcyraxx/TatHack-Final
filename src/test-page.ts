import './content/index';

function init() {
  const form = document.getElementById('public-service-form') as HTMLFormElement | null;
  if (!form) return;

  const sampleFileBtn = document.getElementById('btn-sample-file');
  const incomeInput = document.getElementById('income_cert') as HTMLInputElement | null;
  const fileStatus = document.getElementById('file-status');

  if (sampleFileBtn && incomeInput) {
    sampleFileBtn.addEventListener('click', () => {
      try {
        if (typeof DataTransfer !== 'undefined') {
          const dt = new DataTransfer();
          const sampleFile = new File(
            ['[Government of Kerala Revenue Income Certificate Document Mock]'],
            'income_certificate_2026.pdf',
            { type: 'application/pdf', lastModified: Date.now() }
          );
          dt.items.add(sampleFile);
          incomeInput.files = dt.files;
          incomeInput.dispatchEvent(new Event('input', { bubbles: true }));
          incomeInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        incomeInput.removeAttribute('required');
        incomeInput.setAttribute('data-vazhika-file', 'income_certificate_2026.pdf');

        if (fileStatus) {
          fileStatus.style.display = 'block';
          fileStatus.textContent = '✓ Sample certificate attached: income_certificate_2026.pdf (Ready to submit)';
        }
      } catch (e) {
        console.warn('Sample file attach error:', e);
      }
    });
  }

  // Monitor live changes to input
  if (incomeInput && fileStatus) {
    incomeInput.addEventListener('change', () => {
      if (incomeInput.files && incomeInput.files.length > 0) {
        fileStatus.style.display = 'block';
        fileStatus.textContent = `✓ Attached: ${incomeInput.files[0].name} (${(incomeInput.files[0].size / 1024).toFixed(1)} KB)`;
      }
    });
  }
  // Cascading Prerequisite: PIN Code populates and unlocks District dropdown
  const pinInput = document.getElementById('pincode') as HTMLInputElement | null;
  const districtSelect = document.getElementById('district') as HTMLSelectElement | null;

  if (pinInput && districtSelect) {
    const handlePinLookup = () => {
      const val = pinInput.value.trim();
      if (val.length >= 6) {
        districtSelect.innerHTML = '<option value="">Loading districts from Postal API...</option>';
        setTimeout(() => {
          districtSelect.disabled = false;
          districtSelect.innerHTML = `
            <option value="">Select District</option>
            <option value="ernakulam">Ernakulam</option>
            <option value="thiruvananthapuram">Thiruvananthapuram</option>
            <option value="kozhikode">Kozhikode</option>
            <option value="thrissur">Thrissur</option>
            <option value="kannur">Kannur</option>
          `;
          if (val.startsWith('682')) {
            districtSelect.value = 'ernakulam';
          } else if (val.startsWith('695')) {
            districtSelect.value = 'thiruvananthapuram';
          }
        }, 300);
      }
    };

    pinInput.addEventListener('input', handlePinLookup);
    pinInput.addEventListener('change', handlePinLookup);
    pinInput.addEventListener('blur', handlePinLookup);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const entries: Record<string, any> = {};

    formData.forEach((val, key) => {
      if (val instanceof File) {
        if (val.name) {
          entries[key] = {
            fileName: val.name,
            fileSize: `${(val.size / 1024).toFixed(1)} KB`,
            fileType: val.type || 'application/pdf',
            status: 'Verified & Received',
          };
        } else {
          // If empty file object, check attribute
          const transferred = incomeInput?.getAttribute('data-vazhika-file');
          if (transferred) {
            entries[key] = {
              fileName: transferred,
              fileSize: '24.5 KB',
              fileType: 'application/pdf',
              status: 'Transferred via Vazhika Guided Workflow',
            };
          } else {
            entries[key] = '[No file chosen]';
          }
        }
      } else {
        entries[key] = val;
      }
    });

    const resultBox = document.getElementById('submission-result');
    const dataBox = document.getElementById('submission-data');
    if (resultBox && dataBox) {
      resultBox.style.display = 'block';
      dataBox.innerHTML =
        '<div style="margin-bottom: 0.5rem; color: #166534; font-weight: 700;">✓ Application successfully processed and verified!</div>' +
        '<pre style="background: #ffffff; padding: 1rem; border-radius: 6px; border: 1px solid #cbd5e1; overflow-x: auto;">' +
        JSON.stringify(entries, null, 2) +
        '</pre>';
      resultBox.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
