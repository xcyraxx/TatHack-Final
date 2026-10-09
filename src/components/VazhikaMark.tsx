import React from 'react';

interface Props {
  size?: number;
  /** 'on-dark' for forest-green chrome, 'on-light' for white/warm surfaces */
  tone?: 'on-dark' | 'on-light';
}

/**
 * The Vazhika symbol: a continuous path entering an open passage.
 * Single stroke weight, optical centring — legible from 16px to 32px.
 */
export const VazhikaMark: React.FC<Props> = ({ size = 24, tone = 'on-light' }) => {
  const archColor = tone === 'on-dark' ? '#E8A34A' : '#123B35';
  const pathColor = tone === 'on-dark' ? '#D9F3E5' : '#E8A34A';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      {/* Open passage */}
      <path
        d="M4.75 20.5V11.75a7.25 7.25 0 0 1 14.5 0v8.75"
        stroke={archColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* The path leading through it */}
      <path d="M12 20.5v-6.25" stroke={pathColor} strokeWidth="2" strokeLinecap="round" />
      {/* Where the path leads */}
      <circle cx="12" cy="10.75" r="1.75" fill={pathColor} />
    </svg>
  );
};
