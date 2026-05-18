import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Dialog({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="dialog-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`dialog ${size === 'lg' ? 'dialog-lg' : ''}`}>
        <div className="dialog-header">
          <div className="dialog-title">{title}</div>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="dialog-body">{children}</div>
        {footer && <div className="dialog-footer">{footer}</div>}
      </div>
    </div>
  );
}
