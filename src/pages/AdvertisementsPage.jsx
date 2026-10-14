import React, { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { EmptyState, PageHeading, PlatformIcon, RiskPill, SearchBox, WorkspaceNote } from '../components/shared.jsx';
import usePersistentState from '../hooks/usePersistentState.js';

export default function AdvertisementsPage({ alerts, selected, onSelect, query, onQuery, onToast }) {
  const [risk, setRisk] = useState('All risks');
  const [platform, setPlatform] = useState('All platforms');
  const [sort, setSort] = useState({ key: 'score', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [statuses, setStatuses] = usePersistentState('finshield:ad-status:v1', {});
  const pageSize = 5;
  const rows = useMemo(() => {
    const safeAlerts = Array.isArray(alerts) ? alerts : [];
    const filtered = safeAlerts.filter((alert) => {
      const haystack = `${alert?.id || ''} ${alert?.handle || ''} ${alert?.platform || ''} ${alert?.text || ''} ${alert?.phone || ''} ${alert?.url || ''} ${(alert?.tags || []).join(' ')}`.toLowerCase();
      return haystack.includes(query.toLowerCase())
        && (risk === 'All risks' || (alert?.risk || '').toLowerCase() === risk.toLowerCase())
        && (platform === 'All platforms' || alert?.platform === platform);
    });
    return filtered.sort((left, right) => {
      const leftValue = sort.key === 'score' ? (left?.confidence ?? 0) : left[sort.key];
      const rightValue = sort.key === 'score' ? (right?.confidence ?? 0) : right[sort.key];
      if (sort.key === 'score') {
        return sort.direction === 'asc' ? leftValue - rightValue : rightValue - leftValue;
      }
      const comparison = String(leftValue).localeCompare(String(rightValue), undefined, { numeric: true });
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }, [alerts, platform, query, risk, sort]);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const visibleRows = rows.slice((page - 1) * pageSize, page * pageSize);

  function changeFilter(setter, value) {
    setter(value);
    setPage(1);
  }
  function changeSort(key) {
    setSort((current) => ({ key, direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc' }));
  }

  return <section className="workspace-page">
    <PageHeading eyebrow="PUBLIC CONTENT / ADVERTISEMENT EXPLORER" title="Advertisement" mutedTitle="explorer" description="Search, triage and inspect synthetic public-advertisement records."/>
    <section className="panel workspace-table-panel">
      <div className="workspace-toolbar"><div><div className="section-kicker">SYNTHETIC ADVERTISEMENTS</div><h2>Advertisement records <span className="alert-count">{rows.length}</span></h2></div>
        <div className="workspace-filters"><SearchBox value={query} onChange={(value) => changeFilter(onQuery, value)} placeholder="Search text, URL, phone…" label="Search advertisements"/><select aria-label="Filter by platform" value={platform} onChange={(event) => changeFilter(setPlatform, event.target.value)}><option>All platforms</option>{[...new Set(alerts.map((alert) => alert.platform))].map((name) => <option key={name}>{name}</option>)}</select><select aria-label="Filter by risk" value={risk} onChange={(event) => changeFilter(setRisk, event.target.value)}><option>All risks</option>{['Critical', 'High', 'Medium', 'Low'].map((name) => <option key={name}>{name}</option>)}</select></div>
      </div>
      <div className="alerts-table-wrap"><table className="alerts-table explorer-table"><thead><tr>
        <th><button className="sort-heading" onClick={() => changeSort('id')}>ADVERTISEMENT <Icon name="trend" size={11}/></button></th>
        <th><button className="sort-heading" onClick={() => changeSort('platform')}>PLATFORM</button></th>
        <th><button className="sort-heading" onClick={() => changeSort('score')}>RISK SCORE</button></th>
        <th>INDICATORS</th><th>STATUS</th><th>DETAILS</th>
      </tr></thead><tbody>{visibleRows.map((alert) => <tr key={alert.id} className={selected?.id === alert.id ? 'selected-row' : ''} onClick={() => onSelect(alert)} tabIndex="0" onKeyDown={(event) => { if (event.key === 'Enter') onSelect(alert); }}>
        <td><div className="ad-cell"><PlatformIcon alert={alert}/><div className="ad-copy"><b>{alert.id} <small>{alert.handle}</small></b><span>{alert.text}</span></div></div></td>
        <td>{alert.platform}</td><td><div className="explorer-score"><RiskPill risk={alert.risk}/><b>{alert.confidence ?? 0}</b></div></td>
        <td><div className="indicator-tags">{alert.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}</div></td>
        <td><select className={`case-status ${(statuses[alert.id] || 'Needs review') === 'Closed' ? 'closed' : ''}`} aria-label={`Investigation status for ${alert.id}`} value={statuses[alert.id] || 'Needs review'} onClick={(event) => event.stopPropagation()} onChange={(event) => { event.stopPropagation(); setStatuses((current) => ({ ...current, [alert.id]: event.target.value })); onToast(`${alert.id} marked ${event.target.value.toLowerCase()}.`); }}><option>Needs review</option><option>In progress</option><option>Closed</option></select></td>
        <td><button className="row-open" aria-label={`View details for ${alert.id}`} onClick={(event) => { event.stopPropagation(); onSelect(alert); }}><Icon name="external" size={15}/></button></td>
      </tr>)}{!visibleRows.length && <tr><td colSpan="6"><EmptyState>No advertisements match these filters.</EmptyState></td></tr>}</tbody></table></div>
      <div className="table-footer"><span>Showing <b>{rows.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, rows.length)}</b> of <b>{rows.length}</b> records · Select a row to inspect evidence</span>
        <div className="pagination-controls"><button aria-label="Previous page" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>‹</button><span>{page} / {pageCount}</span><button aria-label="Next page" disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)}>›</button></div>
      </div>
    </section>
    <WorkspaceNote>Scores and evidence are synthetic examples. A shared indicator or high risk score is not proof of unlawful activity.</WorkspaceNote>
  </section>;
}
