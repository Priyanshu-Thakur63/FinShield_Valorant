import React, { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { EmptyState, Modal, PageHeading, SearchBox, StatCards, WorkspaceNote } from '../components/shared.jsx';
import { alerts } from '../data/seedData.js';
import { exportWatchlist } from '../utils/exportCsv.js';

const types = ['Phone number', 'Social handle', 'Domain', 'URL', 'Payment identifier'];

function matchCount(indicator) {
  const normalize = (value) => value.toLowerCase().replace(/^@/, '').replace(/[^a-z0-9]/g, '');
  const needle = normalize(indicator.value);
  if (!needle) return 0;
  return alerts.filter((alert) => {
    const candidates = indicator.type === 'Phone number'
      ? [alert.phone]
      : indicator.type === 'Social handle'
        ? [alert.handle]
        : indicator.type === 'Domain' || indicator.type === 'URL'
          ? [alert.url, alert.text]
          : [alert.phone, alert.url, alert.text, ...alert.tags];
    return candidates.some((candidate) => {
      const normalizedCandidate = normalize(candidate);
      return normalizedCandidate.includes(needle) || (needle.length >= 6 && needle.includes(normalizedCandidate));
    });
  }).length;
}

export default function WatchlistPage({ watchlist, onWatchlistChange, onToast, query, onQuery }) {
  const [typeFilter, setTypeFilter] = useState('All types');
  const [showAdd, setShowAdd] = useState(false);
  const [value, setValue] = useState('');
  const [type, setType] = useState(types[0]);
  const watchlistWithMatches = useMemo(() => watchlist.map((item) => ({ ...item, matches: matchCount(item) })), [watchlist]);
  const rows = useMemo(() => watchlistWithMatches.filter((item) => `${item.value} ${item.type} ${item.id}`.toLowerCase().includes(query.toLowerCase()) && (typeFilter === 'All types' || item.type === typeFilter)), [watchlistWithMatches, query, typeFilter]);
  const stats = [
    { label: 'TRACKED INDICATORS', value: watchlist.length, detail: 'Private to this workspace' },
    { label: 'MATCHES DETECTED', value: watchlistWithMatches.reduce((sum, item) => sum + item.matches, 0), detail: 'Across current threat feed' },
    { label: 'PHONE NUMBERS', value: watchlist.filter((item) => item.type === 'Phone number').length, detail: 'Masked in analyst views' },
    { label: 'DOMAINS & HANDLES', value: watchlist.filter((item) => item.type !== 'Phone number').length, detail: 'Social and web indicators' },
  ];

  function addIndicator(event) {
    event.preventDefault();
    const normalizedValue = value.trim();
    if (!normalizedValue) return;
    const duplicate = watchlist.some((item) => item.type === type && item.value.toLocaleLowerCase() === normalizedValue.toLocaleLowerCase());
    if (duplicate) {
      onToast('That indicator is already on your watchlist.');
      return;
    }
    const nextNumber = Math.max(201, ...watchlist.map((item) => Number(item.id.replace('WL-', '')) || 0)) + 1;
    onWatchlistChange((current) => [{ id: `WL-${nextNumber}`, value: normalizedValue, type, added: 'Just now', matches: 0 }, ...current]);
    setValue('');
    setShowAdd(false);
    onToast('Indicator added to your watchlist.');
  }

  function removeIndicator(item) {
    const shouldRemove = window.confirm(`Remove ${item.value} from your watchlist?`);
    if (!shouldRemove) return;
    onWatchlistChange((current) => current.filter((entry) => entry.id !== item.id));
    onToast(`${item.id} removed from the watchlist.`);
  }

  function downloadWatchlist() {
    onToast(exportWatchlist(rows) ? `${rows.length} indicators exported as CSV.` : 'There are no watchlist indicators to export.');
  }

  return <section className="workspace-page">
    <PageHeading eyebrow="INDICATOR MANAGEMENT / PRIVATE WORKSPACE" title="Threat" mutedTitle="watchlists" description="Track phone numbers, handles, and domains across incoming public advertisements." action="Add indicator" actionIcon="+" onAction={() => setShowAdd(true)}/>
    <StatCards items={stats}/>
    <section className="panel workspace-table-panel"><div className="workspace-toolbar"><div><div className="section-kicker">YOUR INDICATORS</div><h2>Watchlist entries <span className="alert-count">{rows.length}</span></h2></div><div className="workspace-filters"><SearchBox value={query} onChange={onQuery} placeholder="Search indicators..." label="Search watchlist"/><select aria-label="Filter indicator type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option>All types</option>{types.map((item) => <option key={item}>{item}</option>)}</select><button className="table-export" onClick={downloadWatchlist}>Export CSV</button></div></div>
      <div className="alerts-table-wrap"><table className="alerts-table watchlist-table"><thead><tr><th>INDICATOR</th><th>TYPE</th><th>ADDED</th><th>FEED MATCHES</th><th /></tr></thead><tbody>{rows.map((item) => <tr key={item.id}><td><div className="watch-indicator"><span className="watch-symbol">{item.type === 'Phone number' ? '☎' : item.type === 'Domain' || item.type === 'URL' ? '↗' : '@'}</span><span><b>{item.value}</b><small>{item.id}</small></span></div></td><td><span className="watch-type">{item.type}</span></td><td className="time-cell">{item.added}</td><td><span className={item.matches ? 'match-count' : 'no-matches'}>{item.matches} {item.matches === 1 ? 'match' : 'matches'}</span></td><td><button className="remove-watch" onClick={() => removeIndicator(item)}>Remove</button></td></tr>)}{!rows.length && <tr><td colSpan="5"><EmptyState>No indicators match these filters.</EmptyState></td></tr>}</tbody></table></div>
      <div className="table-footer"><span><b>{rows.length}</b> of {watchlist.length} tracked indicators</span><span className="demo-caption">Watchlist entries are saved locally</span></div>
    </section>
    <WorkspaceNote>Watchlist matches are signals for analyst review, not proof of wrongdoing. Avoid adding unnecessary personal information.</WorkspaceNote>
    {showAdd && <Modal title="Add to watchlist" kicker="INDICATOR MANAGEMENT" description="Track a public identifier found in suspicious financial advertisements." onClose={() => setShowAdd(false)} onSubmit={addIndicator} submitLabel="Add indicator"><label className="form-label">Indicator type<select value={type} onChange={(event) => setType(event.target.value)}>{types.map((item) => <option key={item}>{item}</option>)}</select></label><label className="form-label">Value<input autoFocus required value={value} onChange={(event) => setValue(event.target.value)} placeholder={type === 'Phone number' ? '+91 98••• ••••' : 'Enter a public identifier'} maxLength={180}/></label><div className="modal-footnote"><Icon name="shield" size={14}/>Add only information that is relevant to a legitimate investigation.</div></Modal>}
  </section>;
}
