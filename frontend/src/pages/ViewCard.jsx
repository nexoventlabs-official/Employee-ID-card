import React, { useMemo } from 'react';
import IDCard from '../components/IDCard.jsx';
import { buildThemeStyle, PRESETS } from '../components/ThemeDialog.jsx';

function b64decode(s) {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(s))));
  } catch {
    return null;
  }
}

export default function ViewCard() {
  const employee = useMemo(() => {
    const hash = (window.location.hash || '').replace(/^#/, '');
    if (!hash) return null;
    return b64decode(hash);
  }, []);

  if (!employee) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div className="panel" style={{ maxWidth: 420, textAlign: 'center' }}>
          <div className="page-title" style={{ fontSize: 18 }}>Invalid card link</div>
          <p className="muted" style={{ marginTop: 8 }}>
            This QR/link does not contain valid employee data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 18,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div className="page-title" style={{ fontSize: 18 }}>{employee.fullName || 'Employee'}</div>
        <div className="muted">Official Employee ID — Verified Card</div>
      </div>
      <IDCard employee={employee} theme={buildThemeStyle(PRESETS[0])} showLabels={false} />
      <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>
        Issued by <strong style={{ color: 'var(--accent)' }}>{employee.organisation || 'Organisation'}</strong>
      </div>
    </div>
  );
}
