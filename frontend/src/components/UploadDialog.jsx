import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, Download } from 'lucide-react';
import api, { apiUrl } from '../lib/api.js';
import Dialog from './Dialog.jsx';

export default function UploadDialog({ open, onClose, onParsed }) {
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      setError('Please upload an .xlsx, .xls, or .csv file');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/api/employees/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (!data.employees?.length) {
        setError('No valid rows found in file.');
      } else {
        onParsed?.(data.employees, file.name);
        onClose?.();
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Upload Employee Data"
      footer={
        <>
          <a href={apiUrl('/api/employees/template')} className="btn btn-ghost" download>
            <Download size={15} /> Download Template
          </a>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </>
      }
    >
      <p className="muted" style={{ marginBottom: 14 }}>
        Upload a CSV or Excel file. Required columns:{' '}
        <strong style={{ color: 'var(--text)' }}>
          Full_Name, Role, Department, Employee ID, Card Type, image URL
        </strong>
        . Optional: Organisation, Valid Until, Blood Group, Contact.
      </p>

      <div
        className={`dropzone ${drag ? 'drag' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {loading ? (
          <>
            <div className="spinner" style={{ margin: '0 auto', width: 24, height: 24, borderColor: 'rgba(232,168,32,0.3)', borderTopColor: 'var(--accent)' }} />
            <div className="dropzone-title">Parsing file…</div>
          </>
        ) : (
          <>
            <Upload size={32} color="var(--accent)" />
            <div className="dropzone-title">Drag &amp; drop file here</div>
            <div className="dropzone-sub">or click to browse — CSV, XLS, XLSX</div>
          </>
        )}
      </div>

      {error && (
        <div style={{ marginTop: 12, color: 'var(--danger)', fontSize: 12 }}>{error}</div>
      )}

      <div style={{ marginTop: 18, padding: 12, background: 'var(--bg-2)', borderRadius: 10, fontSize: 12, color: 'var(--text-dim)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <FileSpreadsheet size={16} color="var(--accent)" style={{ marginTop: 2, flexShrink: 0 }} />
        <div>
          Tip: <strong style={{ color: 'var(--text)' }}>image URL</strong> column should contain a publicly
          accessible image link (e.g. <code style={{ color: 'var(--accent)' }}>https://i.pravatar.cc/200?img=12</code>).
          Server CORS must allow the host for embedding into the downloaded card.
        </div>
      </div>
    </Dialog>
  );
}
