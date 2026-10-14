import React, { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { EmptyState, PageHeading, RiskPill, SearchBox, StatCards, WorkspaceNote, Modal } from '../components/shared.jsx';
import { exportCases } from '../utils/exportCsv.js';

const owners = ['Unassigned', 'A. Sharma', 'R. Mehta', 'S. Iyer'];
const statuses = ['Open', 'In progress', 'Closed'];

export default function InvestigationsPage({ cases, onCasesChange, alerts, onSelectAlert, onNavigate, onToast, query, onQuery, onCreateCase }) {
  const [statusFilter, setStatusFilter] = useState('All cases');
  const [priorityFilter, setPriorityFilter] = useState('All priorities');
  const [showCreate, setShowCreate] = useState(false);
  const [newAlertId, setNewAlertId] = useState(alerts[0]?.id ?? '');
  const rows = useMemo(() => cases.filter((item) => {
    const matchesText = `${item.id} ${item.title} ${item.alertId} ${item.owner}`.toLowerCase().includes(query.toLowerCase());
    return matchesText && (statusFilter === 'All cases' || item.status === statusFilter) && (priorityFilter === 'All priorities' || item.priority === priorityFilter);
  }), [cases, query, statusFilter, priorityFilter]);
  const stats = [
    { label: 'OPEN CASES', value: cases.filter((item) => item.status !== 'Closed').length, detail: 'Awaiting analyst action' },
    { label: 'IN PROGRESS', value: cases.filter((item) => item.status === 'In progress').length, detail: 'Currently being reviewed' },
    { label: 'CRITICAL PRIORITY', value: cases.filter((item) => item.priority === 'Critical' && item.status !== 'Closed').length, detail: 'Escalate promptly', warning: true },
    { label: 'RESOLVED', value: cases.filter((item) => item.status === 'Closed').length, detail: 'Closed investigations' },
  ];

  function updateCase(id, changes) {
    onCasesChange((current) => current.map((item) => item.id === id ? { ...item, ...changes, updated: 'Just now' } : item));
  }

  function createCase(event) {
    event.preventDefault();
    const alert = alerts.find((item) => item.id === newAlertId);
    if (!alert) {
      onToast('Choose an advertisement before creating an investigation.');
      return;
    }
    onCreateCase(alert);
    setShowCreate(false);
  }

  function downloadCases() {
    onToast(exportCases(rows) ? `${rows.length} investigations exported as CSV.` : 'There are no investigations to export.');
  }

  return <section className="workspace-page">
    <PageHeading eyebrow="CASE MANAGEMENT / ANALYST QUEUE" title="Your" mutedTitle="investigations" description="Track suspicious-ad cases, ownership, and next steps in one place." action="New investigation" actionIcon="+" onAction={() => setShowCreate(true)}/>
    <StatCards items={stats}/>
    <section className="panel workspace-table-panel"><div className="workspace-toolbar"><div><div className="section-kicker">INVESTIGATION QUEUE</div><h2>Cases <span className="alert-count">{rows.length}</span></h2></div><div className="workspace-filters"><SearchBox value={query} onChange={onQuery} placeholder="Search cases..." label="Search investigations"/><select aria-label="Filter case status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All cases</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select><select aria-label="Filter case priority" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}><option>All priorities</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select><button className="table-export" onClick={downloadCases} aria-label="Export investigations as CSV">Export CSV</button></div></div>
      <div className="alerts-table-wrap"><table className="alerts-table investigation-table"><thead><tr><th>CASE</th><th>RELATED ALERT</th><th>PRIORITY</th><th>OWNER</th><th>STATUS</th><th>UPDATED</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id}><td><div className="case-title"><b>{item.title}</b><small>{item.id}</small></div></td><td><button className="inline-id" onClick={() => { const alert = alerts.find((entry) => entry.id === item.alertId); if (alert) { onSelectAlert(alert); onNavigate('Ad monitoring'); } }}>{item.alertId} <Icon name="external" size={12}/></button></td><td><RiskPill risk={item.priority.toLowerCase()}/></td><td><label className="owner-select-label"><span className="owner-avatar">{item.owner === 'Unassigned' ? '—' : item.owner.split(' ').map((part) => part[0]).join('')}</span><select className="owner-select" aria-label={`Owner for ${item.id}`} value={item.owner} onChange={(event) => updateCase(item.id, { owner: event.target.value })}>{owners.map((owner) => <option key={owner}>{owner}</option>)}</select></label></td><td><select className={`case-status ${item.status === 'Closed' ? 'closed' : item.status === 'In progress' ? 'progress' : ''}`} aria-label={`Status for ${item.id}`} value={item.status} onChange={(event) => updateCase(item.id, { status: event.target.value })}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></td><td className="time-cell">{item.updated}</td></tr>)}{!rows.length && <tr><td colSpan="6"><EmptyState>No investigations match these filters.</EmptyState></td></tr>}</tbody></table></div>
      <div className="table-footer"><span><b>{rows.length}</b> of {cases.length} cases shown · Changes are saved locally</span><button onClick={() => { setStatusFilter('All cases'); setPriorityFilter('All priorities'); onQuery(''); }}>Clear filters <Icon name="close" size={13}/></button></div>
    </section>
    <WorkspaceNote icon="file">Investigation records are saved in this browser only. Connect a case-management service for shared, durable records.</WorkspaceNote>
    {showCreate && <Modal title="Create investigation" kicker="CASE MANAGEMENT" description="Choose a flagged advertisement to start a traceable investigation." onClose={() => setShowCreate(false)} onSubmit={createCase} submitLabel="Create case"><label className="form-label">Related advertisement<select value={newAlertId} onChange={(event) => setNewAlertId(event.target.value)} required>{alerts.map((alert) => <option key={alert.id} value={alert.id}>{alert.id} · {alert.handle} · {alert.risk}</option>)}</select></label><p className="form-help">The selected advertisement and its evidence will be linked to the new case.</p></Modal>}
  </section>;
}
