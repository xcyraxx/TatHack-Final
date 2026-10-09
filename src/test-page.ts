import './content/index';

function init() {
  const form = document.getElementById('public-service-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const entries = Object.fromEntries(formData.entries());

    const resultBox = document.getElementById('submission-result');
    const dataBox = document.getElementById('submission-data');
    if (resultBox && dataBox) {
      resultBox.style.display = 'block';
      dataBox.innerHTML = '<pre>' + JSON.stringify(entries, null, 2) + '</pre>';
      resultBox.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
