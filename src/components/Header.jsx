import React from 'react';
import Icon from './Icon.jsx';

export default function Header({ activeNav, onMenu, onSettings, onNotifications, onSearch, onSyncLive, isSyncing, backendConnected }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="mobile-menu icon-button" aria-label="Open navigation" onClick={onMenu}>
          <Icon name="menu" />
        </button>
        <div className="breadcrumb">
          <span>Workspace</span>
          <Icon name="chevron" size={13} />
          <b>{activeNav}</b>
        </div>
      </div>
      <div className="topbar-actions">
        <div className="system-status" title={backendConnected ? "Connected to PostgreSQL Database" : "Using local mock data"}>
          <span className={`status-dot ${backendConnected ? 'green-dot' : ''}`} />
          {backendConnected ? 'PostgreSQL Live' : 'Local demo'}
        </div>
        {onSyncLive && (
          <button 
            className="live-sync-btn"
            title="Fetch live scam posts from Reddit r/Scams into PostgreSQL"
            onClick={onSyncLive}
            disabled={isSyncing}
          >
            <Icon name="network" size={13} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Live Feed'}</span>
          </button>
        )}
        <div className="topbar-divider" />
        <button className="header-search icon-button" aria-label="Search" title="Search (Ctrl+K)" onClick={onSearch}>
          <Icon name="search" size={17}/>
        </button>
        <button className="icon-button notification-button" aria-label="Notifications" onClick={onNotifications}>
          <Icon name="bell" size={18} />
          <i />
        </button>
        <button className="icon-button" aria-label="Settings" onClick={onSettings}>
          <Icon name="settings" size={18} />
        </button>
        <span className="top-avatar">AS</span>
      </div>
    </header>
  );
}
