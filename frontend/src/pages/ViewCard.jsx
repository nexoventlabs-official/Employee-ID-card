import React, { useEffect, useState } from 'react';
import IDCard, { decodeCardData } from '../components/IDCard.jsx';
import { buildThemeStyle, PRESETS } from '../components/ThemeDialog.jsx';
import api from '../lib/api.js';

export default function ViewCard() {
  const [state, setState] = useState({ loading: true, employee: null, theme: null, error: '' });

  useEffect(() => {
    let cancelled = false;

    // Path 1: ?i=<empId> — fetch from backend (short URL, chunky QR)
    const params = new URLSearchParams(window.location.search);
    const id = params.get('i');

    // Path 2: #<lz-encoded payload> — offline fallback (no employee ID)
    const hash = (window.location.hash || '').replace(/^#/, '');

    async function load() {
      if (id) {
        try {
          const { data } = await api.get(`/api/cards/${encodeURIComponent(id)}`);
          if (!cancelled) {
            setState({ loading: false, employee: data.employee, theme: data.theme, error: '' });
          }
          return;
        } catch (err) {
          if (cancelled) return;
          setState({
            loading: false,
            employee: null,
            theme: null,
            error: err.response?.status === 404
              ? `Card "${id}" not found.`
              : 'Could not reach the card service.',
          });
          return;
        }
      }
      if (hash) {
        const decoded = decodeCardData(hash);
        if (decoded?.employee) {
          if (!cancelled) {
            setState({ loading: false, employee: decoded.employee, theme: decoded.theme, error: '' });
          }
          return;
        }
      }
      if (!cancelled) {
        setState({ loading: false, employee: null, theme: null, error: 'Invalid card link.' });
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (state.loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ borderColor: 'rgba(232,168,32,0.3)', borderTopColor: 'var(--accent)', width: 22, height: 22 }} />
      </div>
    );
  }

  const { employee, error } = state;
  const themeRaw = state.theme || PRESETS[0];
  const themeStyle = buildThemeStyle(themeRaw);

  if (!employee) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div className="panel" style={{ maxWidth: 420, textAlign: 'center' }}>
          <div className="page-title" style={{ fontSize: 18 }}>Invalid card link</div>
          <p className="muted" style={{ marginTop: 8 }}>{error || 'This QR/link does not contain valid employee data.'}</p>
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
      <IDCard employee={employee} theme={themeStyle} showLabels={false} />
      <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>
        Issued by <strong style={{ color: 'var(--accent)' }}>{employee.organisation || 'Organisation'}</strong>
      </div>
    </div>
  );
}
