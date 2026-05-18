import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IdCard, Upload, FileSpreadsheet, Activity, ArrowRight } from 'lucide-react';
import api from '../lib/api.js';

export default function Dashboard() {
  const [stats, setStats] = useState({ totalGenerated: 0, totalUploads: 0, lastBatch: null });

  useEffect(() => {
    api.get('/api/stats').then((r) => setStats(r.data)).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">Overview of your ID card generation activity.</p>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="icon-wrap"><IdCard size={20} /></div>
          <div className="stat-label">Cards Generated</div>
          <div className="stat-value">{stats.totalGenerated}</div>
        </div>
        <div className="stat-card">
          <div className="icon-wrap"><Upload size={20} /></div>
          <div className="stat-label">Total Uploads</div>
          <div className="stat-value">{stats.totalUploads}</div>
        </div>
        <div className="stat-card">
          <div className="icon-wrap"><FileSpreadsheet size={20} /></div>
          <div className="stat-label">Last Batch Size</div>
          <div className="stat-value">{stats.lastBatch?.count ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="icon-wrap"><Activity size={20} /></div>
          <div className="stat-label">Status</div>
          <div className="stat-value" style={{ color: '#22c55e', fontSize: 18 }}>Operational</div>
        </div>
      </div>

      <div className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div className="panel-title">Generate Employee ID Cards</div>
          <p className="muted" style={{ maxWidth: 520 }}>
            Upload a CSV or Excel file containing employee details and image URLs. Customize a colour theme,
            preview the cards, then generate &amp; download all cards in a single click.
          </p>
        </div>
        <Link to="/id-generator" className="btn btn-primary">
          Open ID Generator <ArrowRight size={16} />
        </Link>
      </div>

      {stats.lastBatch && (
        <div className="panel" style={{ marginTop: 18 }}>
          <div className="panel-title">Last Upload</div>
          <div className="muted">
            <strong style={{ color: 'var(--text)' }}>{stats.lastBatch.fileName}</strong> &middot; {stats.lastBatch.count} employees &middot;{' '}
            {new Date(stats.lastBatch.at).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
