import React from 'react';
import Icon from './Icon.jsx';
import { BrandMark } from './shared.jsx';

const sources = [
  ['Telegram', 'telegram-dot', '2'],
  ['Instagram', 'instagram-dot', '1'],
  ['Facebook', 'facebook-dot', '1'],
  ['X / Twitter', 'web-dot', '1'],
  ['Open web', 'web-dot', '2'],
];

export default function Sidebar({ navItems, activeNav, onNavigate, onToast, onSource, mobileOpen, onClose, workspaceSettings }) {
  return (
    <>
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-row">
          <BrandMark />
          <div className="brand-copy"><span className="brand-name">finshield<span> AI</span></span><span className="brand-subtitle">FINANCIAL THREAT INTELLIGENCE</span></div>
          <button className="mobile-close icon-button" aria-label="Close navigation" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="workspace-switcher"><span className="workspace-icon"><Icon name="shield" size={17} /></span><span className="workspace-label"><b>{workspaceSettings?.workspaceName || 'Financial Integrity'}</b><small>Workspace · India</small></span><span className="workspace-caret">⌄</span></div>
        <div className="nav-heading">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => <button key={item.label} className={`nav-link ${activeNav === item.label ? 'active' : ''}`} aria-current={activeNav === item.label ? 'page' : undefined} onClick={() => { onNavigate(item.label); onClose(); }}><Icon name={item.icon} size={17} /><span>{item.label}</span>{item.badge && <span className="nav-badge">{item.badge}</span>}</button>)}
        </nav>
        <div className="nav-heading sources-heading">SAMPLE SOURCE SET <button className="tiny-plus" aria-label="Add source" onClick={() => onToast('Public source registration requires a connected collection service.')}>+</button></div>
        <div className="source-list">{sources.map(([source, dot, count]) => <button key={source} className="source-item" onClick={() => onSource(source)}><span className={`source-dot ${dot}`} />{source}<span className="source-count">{count}</span></button>)}</div>
        <div className="sidebar-spacer" />
        <div className="plan-card"><div className="plan-top"><span className="plan-spark">✳</span><span>ILLUSTRATIVE COVERAGE</span></div><div className="coverage-number">78<span>%</span><small>demo-only sample</small></div><div className="coverage-track"><i /></div><button className="plan-link" onClick={() => onToast('Coverage is illustrative and does not measure live platform access.')}>View coverage <Icon name="arrow" size={14} /></button></div>
        <button className="profile-button" onClick={() => onNavigate('Settings')}><span className="avatar">{workspaceSettings?.analystName?.split(' ').map((part) => part[0]).join('').slice(0, 2) || 'AS'}</span><span className="profile-copy"><b>{workspaceSettings?.analystName || 'Analyst workspace'}</b><small>Investigator · Tier 2</small></span><Icon name="more" size={16} /></button>
      </aside>
      {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation overlay" onClick={onClose} />}
    </>
  );
}
