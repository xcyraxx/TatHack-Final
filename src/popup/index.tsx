import React from 'react';
import ReactDOM from 'react-dom/client';
import { Popup } from './Popup';
import { AccessibilityProvider } from '../modules/accessibility-controls/AccessibilityProvider';
import '../styles/kerala-modern.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AccessibilityProvider>
      <Popup />
    </AccessibilityProvider>
  </React.StrictMode>
);
