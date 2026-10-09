import React from 'react';
import ReactDOM from 'react-dom/client';
import { SidePanel } from './SidePanel';
import { AccessibilityProvider } from '../modules/accessibility-controls/AccessibilityProvider';
import '../styles/kerala-modern.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AccessibilityProvider>
      <SidePanel />
    </AccessibilityProvider>
  </React.StrictMode>
);
