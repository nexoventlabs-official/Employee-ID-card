import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import IDGenerator from './pages/IDGenerator.jsx';
import ViewCard from './pages/ViewCard.jsx';

export default function App() {
  const { pathname } = useLocation();
  const isPublic = pathname.startsWith('/view');

  if (isPublic) {
    return (
      <Routes>
        <Route path="/view" element={<ViewCard />} />
      </Routes>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/id-generator" element={<IDGenerator />} />
        </Routes>
      </main>
    </div>
  );
}
