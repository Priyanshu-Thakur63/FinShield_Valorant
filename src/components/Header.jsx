import React from 'react';
import Icon from './Icon.jsx';

export default function Header({ activeNav, onMenu, onSettings, onNotifications, onSearch }) {
  return (
    <header className="topbar">
      <div className="topbar-left"><button className="mobile-menu icon-button" aria-label="Open navigation" onClick={onMenu}><Icon name="menu" /></button><div className="breadcrumb"><span>Workspace</span><Icon name="chevron" size={13} /><b>{activeNav}</b></div></div>
      <div className="topbar-actions"><div className="system-status"><span className="status-dot" />Local demo mode</div><div className="topbar-divider" /><button className="header-search icon-button" aria-label="Search" title="Search (Ctrl+K)" onClick={onSearch}><Icon name="search" size={17}/></button><button className="icon-button notification-button" aria-label="Notifications" onClick={onNotifications}><Icon name="bell" size={18} /><i /></button><button className="icon-button" aria-label="Settings" onClick={onSettings}><Icon name="settings" size={18} /></button><span className="top-avatar">AS</span></div>
    </header>
  );
}
