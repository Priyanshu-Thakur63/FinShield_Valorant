import React from 'react';
import Icon from './Icon.jsx';

export function BrandMark() {
  return <div className="brand-mark"><span /><span /><span /><span /></div>;
}

export function RiskPill({ risk }) {
  return <span className={`risk-pill ${risk.toLowerCase()}`}><i />{risk}</span>;
}

export function PlatformIcon({ alert }) {
  return <span className={`platform-icon ${alert.color}`}>{alert.initials}</span>;
}

export function EmptyState({ children }) {
  return <div className="empty-state"><Icon name="search" size={18} />{children}</div>;
}

export function WorkspaceNote({ icon = 'shield', children }) {
  return <div className="workspace-note"><Icon name={icon} size={15} /><span>{children}</span></div>;
}

export function PageHeading({ eyebrow, title, mutedTitle, description, action, onAction, actionIcon = '↗' }) {
  return (
    <div className="workspace-page-heading">
      <div><div className="eyebrow"><span className="live-dot" />{eyebrow}</div><h1>{title} <span>{mutedTitle}</span></h1><p className="page-description">{description}</p></div>
      {action && <button className="export-button" onClick={onAction}><span>{actionIcon}</span>{action}</button>}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder, label }) {
  return <label className="search-box"><Icon name="search" size={16} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={label} />{value && <button type="button" className="clear-search" aria-label="Clear search" onClick={() => onChange('')}><Icon name="close" size={13}/></button>}</label>;
}

export function StatCards({ items }) {
  return <div className="workspace-stat-row">{items.map((item) => <div className="workspace-stat" key={item.label}><span>{item.label}</span><b className={item.warning ? 'stat-warn' : ''}>{item.value}</b><small>{item.detail}</small></div>)}</div>;
}

export function Modal({ title, kicker, description, onClose, children, onSubmit, submitLabel, submitIcon = 'arrow', hideActions = false }) {
  const Content = onSubmit ? 'form' : 'section';
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <Content className="watchlist-modal" role={onSubmit ? undefined : 'dialog'} aria-modal="true" aria-labelledby="modal-title" onSubmit={onSubmit}>
        <div className="modal-heading"><div><div className="section-kicker">{kicker}</div><h2 id="modal-title">{title}</h2></div><button type="button" className="icon-button" aria-label="Close dialog" onClick={onClose}><Icon name="close" size={17}/></button></div>
        {description && <p>{description}</p>}
        {children}
        {!hideActions && <div className="modal-actions"><button type="button" className="secondary-action" onClick={onClose}>Cancel</button>{submitLabel && <button type="submit" className="primary-action">{submitLabel} <Icon name={submitIcon} size={14}/></button>}</div>}
      </Content>
    </div>
  );
}
