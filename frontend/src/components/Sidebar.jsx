import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, IdCard, Settings, Users } from 'lucide-react';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/id-generator', label: 'ID Generator', icon: IdCard },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-logo">AC</div>
        <div>
          <div className="sidebar-brand-text">Acme Admin</div>
          <div className="sidebar-brand-sub">ID Suite</div>
        </div>
      </div>

      <div className="nav-section-title">Main</div>
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Icon size={17} className="nav-icon" />
          <span>{label}</span>
        </NavLink>
      ))}

      <div className="nav-section-title">Other</div>
      <a className="nav-link" href="#" onClick={(e) => e.preventDefault()}>
        <Users size={17} className="nav-icon" />
        <span>Employees</span>
      </a>
      <a className="nav-link" href="#" onClick={(e) => e.preventDefault()}>
        <Settings size={17} className="nav-icon" />
        <span>Settings</span>
      </a>
    </aside>
  );
}
