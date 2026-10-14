import React, { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { PageHeading, RiskPill, WorkspaceNote } from '../components/shared.jsx';
import usePersistentState from '../hooks/usePersistentState.js';

export default function AlertsPage({ alerts, onSelectAlert, onNavigate, onToast }) {
  const [readIds, setReadIds] = usePersistentState('finshield:alert-read:v1', []);
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState('All severities');
  const [view, setView] = useState('All alerts');
  const [statuses, setStatuses] = usePersistentState('finshield:alert-status:v1', {});
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const feed = useMemo(() => safeAlerts.map((alert, index) => {
    const risk = alert?.risk || 'low';
    return {
      id: `ALT-${String(301 + index).padStart(4, '0')}`,
      alert,
      severity: risk,
      title: risk === 'critical' ? 'Urgent account-sale advertisement detected' : `${risk[0].toUpperCase()}${risk.slice(1)}-risk financial promotion flagged`,
      description: `${alert?.handle || 'User'} · ${(alert?.tags || []).join(' and ')}`,
      timestamp: alert?.time || 'Recently',
    };
  }).filter((item) => `${item.id} ${item.title} ${item.description} ${item.alert?.id || ''}`.toLowerCase().includes(query.toLowerCase())
    && (severity === 'All severities' || item.severity === severity.toLowerCase())
    && (view === 'All alerts' || (view === 'Unread' ? !readIds.includes(item.id) : readIds.includes(item.id)))), [safeAlerts, query, readIds, severity, view]);
  const unread = Math.max(0, safeAlerts.length - readIds.length);

  function toggleRead(id) {
    setReadIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return <section className="workspace-page">
    <PageHeading eyebrow="ALERT TRIAGE / SAMPLE FEED" title="Alerts" mutedTitle="center" description="Prioritize synthetic risk notifications and track their review state."/>
    <div className="alert-center-toolbar"><div className="alert-view-tabs">{['All alerts', 'Unread', 'Read'].map((name) => <button key={name} className={view === name ? 'active' : ''} onClick={() => setView(name)}>{name}{name === 'Unread' && <b>{unread}</b>}</button>)}</div>    <div className="workspace-filters"><input className="alert-search" aria-label="Search alerts" placeholder="Search alerts…" value={query} onChange={(event) => setQuery(event.target.value)}/><select aria-label="Filter alert severity" value={severity} onChange={(event) => setSeverity(event.target.value)}><option>All severities</option>{['Critical', 'High', 'Medium', 'Low'].map((item) => <option key={item}>{item}</option>)}</select><button className="table-export" onClick={() => { const visibleIds = feed.map((item) => item.id); setReadIds((current) => [...new Set([...current, ...visibleIds])]); onToast(`${visibleIds.length} visible sample alerts marked as read.`); }}>Mark all read</button></div></div>
    <div className="alert-feed">{feed.map((item) => <article className={`panel alert-card ${readIds.includes(item.id) ? 'is-read' : ''}`} key={item.id}>
      <span className={`alert-severity-dot ${item.severity}`}/><div className="alert-card-main"><div className="alert-card-meta"><span>{item.id}</span><span><Icon name="clock" size={12}/>{item.timestamp}</span>{readIds.includes(item.id) && <em>READ</em>}</div><h2>{item.title}</h2><p>{item.description}</p><div className="alert-related"><RiskPill risk={item.severity}/><span>Advertisement {item.alert.id}</span><span>Investigation status: {readIds.includes(item.id) ? 'Viewed' : 'Needs review'}</span></div></div>
      <div className="alert-card-actions"><select aria-label={`Investigation status for ${item.id}`} value={statuses[item.id] || 'Needs review'} onChange={(event) => { setStatuses((current) => ({ ...current, [item.id]: event.target.value })); onToast(`${item.id} marked ${event.target.value.toLowerCase()}.`); }}><option>Needs review</option><option>In progress</option><option>Closed</option></select><button className="secondary-action" onClick={() => toggleRead(item.id)}>{readIds.includes(item.id) ? 'Mark unread' : 'Mark read'}</button><button className="primary-action" onClick={() => { onSelectAlert(item.alert); onNavigate('Advertisement explorer'); }}>View details <Icon name="arrow" size={13}/></button></div>
    </article>)}{!feed.length && <div className="panel empty-state alert-empty"><Icon name="search" size={18}/>No alerts match these filters.</div>}</div>
    <WorkspaceNote icon="bell">Alert times and records are illustrative. This frontend does not monitor live social-media or web feeds.</WorkspaceNote>
  </section>;
}
