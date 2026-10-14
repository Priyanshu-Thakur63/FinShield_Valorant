import React, { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import AlertTable from '../components/AlertTable.jsx';
import { PageHeading, SearchBox, StatCards, WorkspaceNote } from '../components/shared.jsx';
import { exportAlerts } from '../utils/exportCsv.js';

export default function MonitoringPage({ alerts, selected, onSelect, query, onQuery, onToast, reviewedIds }) {
  const [riskFilter, setRiskFilter] = useState('All risks');
  const [platformFilter, setPlatformFilter] = useState('All platforms');
  const rows = useMemo(() => alerts.filter((alert) => {
    const text = `${alert.id} ${alert.platform} ${alert.handle} ${alert.text} ${alert.tags.join(' ')} ${alert.phone} ${alert.url}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (riskFilter === 'All risks' || alert.risk === riskFilter.toLowerCase()) && (platformFilter === 'All platforms' || alert.platform === platformFilter);
  }), [alerts, query, riskFilter, platformFilter]);
  const stats = [
    { label: 'SAMPLE ADS IN FEED', value: alerts.length, detail: 'Synthetic local records' },
    { label: 'REQUIRING REVIEW', value: alerts.filter((alert) => ['critical', 'high'].includes(alert.risk)).length, detail: 'Critical and high sample labels', warning: true },
    { label: 'SAMPLE PLATFORMS', value: new Set(alerts.map((alert) => alert.platform)).size, detail: 'Illustrative source categories' },
    { label: 'FILTERED RESULTS', value: rows.length, detail: 'Based on your filters' },
  ];

  function downloadResults() {
    onToast(exportAlerts(rows) ? `${rows.length} advertisements exported as CSV.` : 'There are no filtered advertisements to export.');
  }

  return <section className="workspace-page">
    <PageHeading eyebrow="MONITORING FEED / PUBLIC-SOURCE EXAMPLES" title="Ad" mutedTitle="monitoring" description="Review synthetic advertisements, matched indicators, and sample risk assessments." action="Export results" onAction={downloadResults}/>
    <StatCards items={stats}/>
    <section className="panel workspace-table-panel">
      <div className="workspace-toolbar"><div><div className="section-kicker">PUBLIC ADVERTISEMENT FEED</div><h2>Detected advertisements <span className="alert-count">{rows.length}</span></h2></div><div className="workspace-filters">
        <SearchBox value={query} onChange={onQuery} placeholder="Search text, URL, phone..." label="Search advertisements"/>
        <select aria-label="Filter by platform" value={platformFilter} onChange={(event) => setPlatformFilter(event.target.value)}><option>All platforms</option>{[...new Set(alerts.map((alert) => alert.platform))].map((platform) => <option key={platform}>{platform}</option>)}</select>
        <select aria-label="Filter by risk" value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)}><option>All risks</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select>
      </div></div>
      <AlertTable rows={rows} selectedId={selected?.id} onSelect={onSelect} reviewedIds={reviewedIds}/>
      <div className="table-footer"><span>Showing <b>{rows.length}</b> of <b>{alerts.length}</b> sample advertisements</span><span className="demo-caption">Illustrative public-source data</span></div>
    </section>
    <WorkspaceNote>Only publicly available advertisements are represented. Risk assessments are decision support and require analyst verification.</WorkspaceNote>
  </section>;
}
