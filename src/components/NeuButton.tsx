import React, { ButtonHTMLAttributes, ReactNode } from 'react';

export type NeuButtonVariant = 'forest' | 'gold' | 'mint' | 'white';

export interface NeuButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: NeuButtonVariant;
  children?: ReactNode;
  className?: string;
}

/**
 * Tactile Kerala Modern NeuButton
 * Accessible neubrutalist button with hard 3px offset shadow,
 * crisp borders, and accessible high-contrast focus rings.
 */
export const NeuButton: React.FC<NeuButtonProps> = ({
  variant = 'forest',
  children = 'Hover me',
  className = '',
  type = 'button',
  ...props
}) => {
  return (
    <button
      type={type}
      className={`km-neu-button km-neu-button--${variant} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * Centered Demo Container as specified in the prompt
 */
export const NeuButtonDemo: React.FC<{ variant?: NeuButtonVariant; label?: string }> = ({
  variant = 'forest',
  label = 'Hover me',
}) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--km-warm-white, #F8FAF7)',
        minHeight: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <NeuButton variant={variant}>{label}</NeuButton>
    </div>
  );
};

export default NeuButton;
