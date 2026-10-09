import React from 'react';
import { VazhikaMark } from './VazhikaMark';

interface Props {
  /** Short plain-text context shown at the right of the bar (no pills). */
  badge?: string;
  compact?: boolean;
}

export const BrandHeader: React.FC<Props> = ({ badge, compact = false }) => {
  return (
    <header role="banner" className={`km-topbar${compact ? ' km-topbar--compact' : ''}`}>
      <div className="km-brand">
        <VazhikaMark size={compact ? 22 : 26} tone="on-dark" />
        <span className="km-wordmark">
          <span className="km-wordmark__name">vazhika</span>
          <span className="km-wordmark__ml" lang="ml">
            വഴിക
          </span>
        </span>
      </div>

      {badge && <span className="km-topbar__aside">{badge}</span>}
    </header>
  );
};
