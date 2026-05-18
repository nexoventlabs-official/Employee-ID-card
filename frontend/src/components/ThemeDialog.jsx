import React, { useState } from 'react';
import Dialog from './Dialog.jsx';
import IDCard from './IDCard.jsx';

export const PRESETS = [
  { name: 'Gold',     accent: '#E8A820', frontBg: '#f8f6f0', onAccent: '#ffffff' },
  { name: 'Royal',    accent: '#3F51B5', frontBg: '#f4f5fb', onAccent: '#ffffff' },
  { name: 'Emerald',  accent: '#10B981', frontBg: '#f1faf6', onAccent: '#ffffff' },
  { name: 'Rose',     accent: '#E11D48', frontBg: '#fbf3f5', onAccent: '#ffffff' },
  { name: 'Slate',    accent: '#334155', frontBg: '#f4f6f8', onAccent: '#ffffff' },
  { name: 'Ocean',    accent: '#0EA5E9', frontBg: '#f1f9fc', onAccent: '#ffffff' },
  { name: 'Plum',     accent: '#7C3AED', frontBg: '#f6f3fb', onAccent: '#ffffff' },
  { name: 'Crimson',  accent: '#B91C1C', frontBg: '#fbf3f3', onAccent: '#ffffff' },
  { name: 'Charcoal', accent: '#111827', frontBg: '#f4f4f5', onAccent: '#ffffff' },
  { name: 'Coral',    accent: '#F97316', frontBg: '#fdf6f1', onAccent: '#ffffff' },
  { name: 'Teal',     accent: '#0D9488', frontBg: '#f1faf8', onAccent: '#ffffff' },
  { name: 'Magenta',  accent: '#DB2777', frontBg: '#fbf3f7', onAccent: '#ffffff' },
];

export function buildThemeStyle(theme) {
  return {
    '--c-accent': theme.accent,
    '--c-front-bg': theme.frontBg,
    '--c-on-accent': theme.onAccent,
    '--c-photo-border': theme.accent,
    '--c-divider-soft': hexToRgba(theme.accent, 0.1),
  };
}

function hexToRgba(hex, alpha) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  const [, r, g, b] = m.map((x, i) => (i === 0 ? x : parseInt(x, 16)));
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function ThemeDialog({ open, onClose, employees, onConfirm }) {
  const [selected, setSelected] = useState(PRESETS[0]);
  const [custom, setCustom] = useState({ accent: '#E8A820', frontBg: '#f8f6f0' });
  const [useCustom, setUseCustom] = useState(false);

  const activeTheme = useCustom
    ? { ...selected, accent: custom.accent, frontBg: custom.frontBg }
    : selected;

  const previewEmployee = employees?.[0] || {
    fullName: 'Alcide Piccio',
    role: 'Senior Designer',
    department: 'Creative Division',
    employeeId: 'EMP-2024-0391',
    cardType: 'Employee',
    organisation: 'Acme Corp International',
    validUntil: 'Dec 2025',
    bloodGroup: 'O +ve',
    contact: '+91 98765 43210',
    imageUrl: '',
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title="Customize Theme & Preview"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onConfirm?.(activeTheme)}>
            Confirm &amp; Generate ({employees?.length || 0})
          </button>
        </>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 24 }}>
        <div>
          <div className="panel-title" style={{ marginBottom: 10 }}>Choose a colour palette</div>
          <div className="palette-grid">
            {PRESETS.map((p) => (
              <div
                key={p.name}
                className={`palette-swatch ${!useCustom && selected.name === p.name ? 'active' : ''}`}
                style={{ background: p.accent }}
                title={p.name}
                onClick={() => { setSelected(p); setUseCustom(false); }}
              />
            ))}
          </div>

          <div className="palette-custom-row">
            <input
              type="checkbox"
              id="use-custom"
              checked={useCustom}
              onChange={(e) => setUseCustom(e.target.checked)}
            />
            <label htmlFor="use-custom">Use custom colours</label>
          </div>

          {useCustom && (
            <>
              <div className="palette-custom-row">
                <label>Accent (primary)</label>
                <input
                  type="color"
                  className="color-picker"
                  value={custom.accent}
                  onChange={(e) => setCustom({ ...custom, accent: e.target.value })}
                />
                <span className="muted">{custom.accent}</span>
              </div>
              <div className="palette-custom-row">
                <label>Front background</label>
                <input
                  type="color"
                  className="color-picker"
                  value={custom.frontBg}
                  onChange={(e) => setCustom({ ...custom, frontBg: e.target.value })}
                />
                <span className="muted">{custom.frontBg}</span>
              </div>
            </>
          )}

          <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-dim)' }}>
            Preview reflects the first employee in the uploaded list.
            <br />
            <strong style={{ color: 'var(--text)' }}>{employees?.length || 0}</strong> cards will be generated.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <IDCard employee={previewEmployee} theme={buildThemeStyle(activeTheme)} />
        </div>
      </div>
    </Dialog>
  );
}
