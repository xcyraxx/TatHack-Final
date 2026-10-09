import React, { useState, useEffect, useCallback } from 'react';
import { CheckSquare, X, Copy } from 'lucide-react';
import { NeuButton } from './NeuButton';

export interface NotificationItem {
  id: string | number;
  title?: string;
  text: string;
}

const NOTIFICATION_TTL = 4000;

interface NotificationToastProps extends NotificationItem {
  onRemove: (id: string | number) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  id,
  title = 'Copied to clipboard',
  text,
  onRemove,
}) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onRemove(id), 220);
  }, [id, onRemove]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, NOTIFICATION_TTL);
    return () => clearTimeout(timer);
  }, [handleClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`km-toast ${isExiting ? 'km-toast--exiting' : ''}`}
    >
      <CheckSquare className="km-toast__icon" size={17} aria-hidden="true" />
      <div className="km-toast__content">
        <strong className="km-toast__title">{title}</strong>
        {text && <span className="km-toast__text">{text}</span>}
      </div>
      <button
        type="button"
        onClick={handleClose}
        aria-label="Close notification"
        className="km-toast__close"
      >
        <X size={15} aria-hidden="true" />
      </button>
    </div>
  );
};

export interface CopyButtonProps {
  textToCopy: string;
  label?: string;
  copiedTitle?: string;
  copiedSubtitle?: string;
  className?: string;
  variant?: 'forest' | 'gold' | 'mint' | 'white';
}

/**
 * Copy to clipboard button with tactile NeuButton styling & slide-in toast
 */
export const CopyButton: React.FC<CopyButtonProps> = ({
  textToCopy,
  label = 'Copy to clipboard',
  copiedTitle = 'Copied to clipboard!',
  copiedSubtitle,
  className = '',
  variant = 'forest',
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else if (typeof document !== 'undefined' && document.execCommand) {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
        } finally {
          if (textArea.parentNode) {
            textArea.parentNode.removeChild(textArea);
          }
        }
      }
    } catch {
      // Continue to show user feedback notification even if clipboard permissions are restricted
    }

    const notifId = Date.now() + Math.random();
    setNotifications((prev) => [
      {
        id: notifId,
        title: copiedTitle,
        text: copiedSubtitle || (textToCopy.length > 50 ? `${textToCopy.slice(0, 50)}…` : textToCopy),
      },
      ...prev,
    ]);
  };

  const removeNotification = (id: string | number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <>
      <NeuButton
        variant={variant}
        onClick={handleCopy}
        className={className}
      >
        <Copy size={16} aria-hidden="true" />
        <span>{label}</span>
      </NeuButton>

      {/* Slide-in Notifications Portal */}
      <div className="km-toast-container" aria-label="Notifications">
        {notifications.map((n) => (
          <NotificationToast
            key={n.id}
            id={n.id}
            title={n.title}
            text={n.text}
            onRemove={removeNotification}
          />
        ))}
      </div>
    </>
  );
};

/**
 * SlideInNotifications component modeled after user snippet in Kerala Modern colors
 */
export const SlideInNotifications: React.FC<{ textToCopy?: string }> = ({
  textToCopy = 'Application Draft Reference: VZ-2026-KL-091',
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const removeNotif = (id: string | number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy);
      }
    } catch {
      // Fallback
    }

    const newNotif: NotificationItem = {
      id: Math.random(),
      title: 'Successfully copied to clipboard!',
      text: textToCopy,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

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
      <NeuButton variant="forest" onClick={handleCopy}>
        <Copy size={16} aria-hidden="true" />
        <span>Copy Application Reference</span>
      </NeuButton>

      <div className="km-toast-container">
        {notifications.map((n) => (
          <NotificationToast
            key={n.id}
            id={n.id}
            title={n.title}
            text={n.text}
            onRemove={removeNotif}
          />
        ))}
      </div>
    </div>
  );
};

export default SlideInNotifications;
