import React from 'react';
import Icon from './Icon.jsx';
import { EmptyState, PlatformIcon, RiskPill } from './shared.jsx';

export default function AlertTable({ rows, selectedId, onSelect, compact = false, reviewedIds = [] }) {
  return (
    <div className="alerts-table-wrap">
      <table className={`alerts-table ${compact ? '' : 'monitor-table'}`}>
        <thead><tr><th>ADVERTISEMENT / SOURCE</th><th>RISK</th><th>KEY INDICATORS</th><th>SAMPLE SCORE</th><th>DETECTED</th><th /></tr></thead>
        <tbody>
          {rows.map((alert) => <tr key={alert.id} className={selectedId === alert.id ? 'selected-row' : ''} onClick={() => onSelect(alert)} tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(alert); } }}>
            <td><div className="ad-cell"><PlatformIcon alert={alert} /><div className="ad-copy"><b>{alert.handle}{!compact && <small>{alert.id}</small>}</b><span>{alert.text}</span></div></div></td>
            <td><RiskPill risk={alert.risk} /></td>
            <td><div className="indicator-tags">{reviewedIds.includes(alert.id) && <span className="review-tag">In review</span>}{(alert.tags || []).map((tag) => <span key={tag}>{tag}</span>)}</div></td>
            <td><div className="confidence-cell"><div className="confidence-track"><i style={{ width: `${alert.confidence}%` }} /></div><span>{alert.confidence}/100</span></div></td>
            <td className="time-cell">{alert.time}</td>
            <td><button className="row-open" aria-label={`Open details for ${alert.id}`} onClick={(event) => { event.stopPropagation(); onSelect(alert); }}><Icon name="chevron" size={16} /></button></td>
          </tr>)}
          {!rows.length && <tr><td colSpan="6"><EmptyState>No advertisements match these filters.</EmptyState></td></tr>}
        </tbody>
      </table>
    </div>
  );
}
