import React, { useRef, useState } from 'react';
import { Plus, Sparkles, Trash2, FileSpreadsheet, Inbox } from 'lucide-react';
import { toPng } from 'html-to-image';
import api from '../lib/api.js';
import IDCard from '../components/IDCard.jsx';
import UploadDialog from '../components/UploadDialog.jsx';
import ThemeDialog, { PRESETS, buildThemeStyle } from '../components/ThemeDialog.jsx';

function safeFileName(s) {
  return String(s || 'card').replace(/[^a-z0-9_\-]+/gi, '_').slice(0, 60);
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// Force the browser to cache every employee photo (and resolve CORS) up-front
// so the export step never has to wait for the network.
function preloadImages(employees) {
  return Promise.all(
    employees.map((e) => {
      if (!e.imageUrl) return Promise.resolve();
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.referrerPolicy = 'no-referrer';
        img.onload = () => resolve();
        img.onerror = () => resolve(); // fail silently → placeholder kicks in
        img.src = e.imageUrl;
      });
    })
  );
}

// Wait for every <img> inside the node to be fully decoded.
async function waitForImagesIn(node) {
  if (!node) return;
  const imgs = Array.from(node.querySelectorAll('img'));
  await Promise.all(
    imgs.map((img) => {
      if (img.complete && img.naturalWidth > 0) {
        return img.decode?.().catch(() => {}) ?? Promise.resolve();
      }
      return new Promise((resolve) => {
        img.addEventListener('load', () => resolve(), { once: true });
        img.addEventListener('error', () => resolve(), { once: true });
      });
    })
  );
}

function nextFrame() {
  return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
}

export default function IDGenerator() {
  const [employees, setEmployees] = useState([]);
  const [fileName, setFileName] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [theme, setTheme] = useState(PRESETS[0]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const exportRef = useRef(null);
  const [exportEmployee, setExportEmployee] = useState(null);

  const handleParsed = (rows, name) => {
    setEmployees(rows);
    setFileName(name || '');
    // Pre-register cards with default theme so preview QRs immediately resolve.
    api.post('/api/cards/batch', { employees: rows, theme: PRESETS[0] }).catch(() => {});
  };

  const handleConfirmTheme = async (chosenTheme) => {
    setTheme(chosenTheme);
    setThemeOpen(false);
    // Re-register with the chosen theme so QR scans show the correct colours.
    await api.post('/api/cards/batch', { employees, theme: chosenTheme }).catch(() => {});
    await sleep(50);
    await generateAll(chosenTheme);
  };

  const generateAll = async (chosenTheme) => {
    if (!employees.length) return;
    setGenerating(true);
    setProgress({ done: 0, total: employees.length });

    try {
      // 1. Preload every photo & wait for webfonts so first export is crisp
      await Promise.all([
        preloadImages(employees),
        document.fonts?.ready ?? Promise.resolve(),
      ]);

      for (let i = 0; i < employees.length; i++) {
        const emp = employees[i];
        setExportEmployee(emp);

        // 2. Wait for React to commit & for the new images/QR to actually load
        await nextFrame();
        await waitForImagesIn(exportRef.current);
        await nextFrame(); // one more paint for safety

        const node = exportRef.current;
        if (!node) continue;

        // 3. High-DPI export. pixelRatio: 4 → ~960px wide per card
        //    (≈450 DPI on a 2.125" CR80 card). Run twice & keep the 2nd
        //    snapshot — the first warms up the renderer so images never
        //    appear half-painted (kills the flicker).
        const opts = {
          cacheBust: true,
          pixelRatio: 4,
          backgroundColor: '#2a2a2a',
          skipFonts: false,
        };
        await toPng(node, opts).catch(() => null); // warm-up
        const dataUrl = await toPng(node, opts).catch((err) => {
          console.error('export failed for', emp.fullName, err);
          return null;
        });

        if (dataUrl) {
          const link = document.createElement('a');
          link.download = `${safeFileName(emp.employeeId || emp.fullName)}_id_card.png`;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          link.remove();
        }
        setProgress({ done: i + 1, total: employees.length });
        // small delay so the browser doesn't choke on rapid downloads
        await sleep(150);
      }

      // bump dashboard counter
      api.post('/api/stats/increment', { generated: employees.length }).catch(() => {});
    } finally {
      setExportEmployee(null);
      setGenerating(false);
    }
  };

  const clearAll = () => {
    setEmployees([]);
    setFileName('');
  };

  const themeStyle = buildThemeStyle(theme);

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title" style={{ marginBottom: 0 }}>ID Generator</h1>
          {employees.length > 0 && (
            <span className="badge">{employees.length} loaded</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {employees.length > 0 && (
            <>
              <button className="btn btn-ghost" onClick={clearAll} disabled={generating}>
                <Trash2 size={15} /> Clear
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setThemeOpen(true)}
                disabled={generating}
              >
                <Sparkles size={15} /> Generate Cards
              </button>
            </>
          )}
          <button
            className="btn-fab"
            title="Upload CSV / Excel"
            onClick={() => setUploadOpen(true)}
            disabled={generating}
          >
            <Plus size={22} />
          </button>
        </div>
      </div>

      <p className="page-subtitle" style={{ marginTop: -8 }}>
        Click the <strong style={{ color: 'var(--accent)' }}>+</strong> button to upload an Excel or CSV
        file. Customize a theme, preview, then auto-generate &amp; download all cards.
      </p>

      {employees.length === 0 ? (
        <div className="panel">
          <div className="empty-state">
            <div className="icon-bg"><Inbox size={28} /></div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>No data loaded</div>
            <div style={{ marginTop: 6 }}>
              Upload an .xlsx, .xls, or .csv file with employee details to start.
            </div>
            <button
              className="btn btn-primary"
              style={{ marginTop: 16 }}
              onClick={() => setUploadOpen(true)}
            >
              <Plus size={16} /> Upload File
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="panel-title" style={{ marginBottom: 2 }}>Loaded Employees</div>
                <div className="muted">
                  <FileSpreadsheet size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  {fileName} &middot; {employees.length} rows
                </div>
              </div>
              {generating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--accent)', fontSize: 13 }}>
                  <div className="spinner" style={{ borderColor: 'rgba(232,168,32,0.3)', borderTopColor: 'var(--accent)' }} />
                  Generating {progress.done} / {progress.total}…
                </div>
              )}
            </div>

            <div className="table-wrap">
              <table className="emp-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Full Name</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Employee ID</th>
                    <th>Card Type</th>
                    <th>Image</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((e, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{e.fullName || '—'}</td>
                      <td>{e.role || '—'}</td>
                      <td>{e.department || '—'}</td>
                      <td>{e.employeeId || '—'}</td>
                      <td>{e.cardType || 'Employee'}</td>
                      <td>
                        {e.imageUrl ? (
                          <a href={e.imageUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontSize: 12 }}>
                            view
                          </a>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel" style={{ marginTop: 18 }}>
            <div className="panel-title">Live Preview (first 6)</div>
            <div className="preview-grid">
              {employees.slice(0, 6).map((e, i) => (
                <IDCard key={i} employee={e} theme={themeStyle} showLabels={false} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Off-screen export node — renders 1 card at full fidelity. Always
          mounted (just shifted off-screen) so html-to-image never sees a
          mid-mount flicker. */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: -10000,
          top: 0,
          pointerEvents: 'none',
        }}
      >
        {exportEmployee && (
          <IDCard
            ref={exportRef}
            employee={exportEmployee}
            theme={themeStyle}
            showLabels={false}
            sceneStyle={{ padding: 30, gap: 30 }}
          />
        )}
      </div>

      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onParsed={handleParsed}
      />
      <ThemeDialog
        open={themeOpen}
        onClose={() => setThemeOpen(false)}
        employees={employees}
        onConfirm={handleConfirmTheme}
      />
    </div>
  );
}
