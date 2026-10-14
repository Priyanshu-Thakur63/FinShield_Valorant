import React, { useState } from 'react';
import Icon from '../components/Icon.jsx';
import AlertTable from '../components/AlertTable.jsx';
import RiskDistribution from '../components/RiskDistribution.jsx';
import TrendChart from '../components/TrendChart.jsx';
import { getDashboardStats } from '../services/mockDashboardService.js';
import { exportAlerts } from '../utils/exportCsv.js';

const indicators = [
  { icon: '▤', type: 'account-cat', title: 'Bank account sales', subtitle: 'Verified & mule-account language', amount: '2', share: 'Sample', query: 'account' },
  { icon: '▣', type: 'card-cat', title: 'Card & credential offers', subtitle: 'ATM, debit & credit cards', amount: '2', share: 'Sample', query: 'card' },
  { icon: '⌑', type: 'paper-cat', title: 'Account-opening schemes', subtitle: 'Current & savings accounts', amount: '2', share: 'Sample', query: 'account' },
  { icon: '₹', type: 'payment-cat', title: 'Payment & commission bait', subtitle: 'Recruitment and payment language', amount: '1', share: 'Sample', query: 'payment' },
];

export default function OverviewPage({ alerts, selected, onSelect, cases, onNavigate, onSearch, onToast, onInvestigate, onExport, reviewedIds, showDemoMetrics = true }) {
  const [period, setPeriod] = useState('Last 24 hours');
  const stats = getDashboardStats(alerts, cases);
  const periodStats = { count: String(stats.suspicious), change: 'DEMO', chart: period.replace('Last ', ''), previous: `${stats.analyzed} sample ads` };
  const recentAlerts = [...alerts].sort((first, second) => second.confidence - first.confidence);
  const date = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

  return <>
    <section className="page-heading">
      <div><div className="eyebrow"><span className="live-dot" />SYNTHETIC DEMO FEED <span className="eyebrow-sep">/</span> {date.toUpperCase()}</div><h1>Threat <span>overview</span></h1><p className="page-description">A clear view of synthetic sample indicators for financial-account abuse.</p></div>
      <div className="heading-actions"><select className="date-button period-select" aria-label="Overview time period" value={period} onChange={(event) => setPeriod(event.target.value)}><option>Last 24 hours</option><option>Last 7 days</option><option>Last 30 days</option></select><button className="export-button" onClick={() => onToast(exportAlerts(alerts) ? `${alerts.length} advertisements exported as CSV.` : 'There are no advertisements to export.')}><span>↗</span> Export report</button></div>
    </section>
    {showDemoMetrics && <section className="metrics-grid" aria-label="Synthetic threat summary">
      <article className="metric-card metric-highlight"><div className="metric-top"><span>Suspicious ads in sample</span><span className="metric-icon lime-icon"><Icon name="scan" size={17} /></span></div><div className="metric-number">{periodStats.count} <span className="metric-change positive">DEMO</span></div><div className="metric-foot"><span className="tiny-bars">{Array.from({ length: 12 }, (_, index) => <i key={index}/>)}</span><span>{periodStats.previous}</span></div></article>
      <article className="metric-card"><div className="metric-top"><span>Ads analyzed</span><span className="metric-icon blue-icon"><Icon name="file" size={17} /></span></div><div className="metric-number">{stats.analyzed}</div><div className="metric-foot"><span className="metric-context">Synthetic records</span><span>sample feed</span></div></article>
      <article className="metric-card"><div className="metric-top"><span>High-risk advertisements</span><span className="metric-icon red-icon"><Icon name="shield" size={17} /></span></div><div className="metric-number">{stats.highRisk}</div><div className="metric-foot"><span className="metric-context"><i className="mini-dot red-dot" /> {stats.critical} critical <i className="mini-dot amber-dot" /> {stats.highRisk - stats.critical} high</span><span>sample records</span></div></article>
      <article className="metric-card"><div className="metric-top"><span>Potential campaigns</span><span className="metric-icon purple-icon"><Icon name="network" size={17} /></span></div><div className="metric-number">{stats.campaigns}</div><div className="metric-foot"><span className="cluster-avatars"><i>tg</i><i>ig</i><i>fb</i><i>+2</i></span><span>{stats.platforms} sample platforms</span></div></article>
      <article className="metric-card"><div className="metric-top"><span>Extracted indicators</span><span className="metric-icon blue-icon"><Icon name="scan" size={17} /></span></div><div className="metric-number">{stats.indicators}</div><div className="metric-foot"><span className="response-line"><i /></span><span>Across sample ads</span></div></article>
    </section>}
    <section className="insights-grid">
      <article className="panel trend-panel"><div className="panel-heading"><div><div className="section-kicker">ILLUSTRATIVE THREAT ACTIVITY</div><h2>Sample detection trend <span className="subtle-period">· {periodStats.chart}</span></h2></div><button className="more-button" aria-label="Refresh chart" onClick={() => onToast('Illustrative sample trend refreshed.')}>↻</button></div><div className="trend-summary"><span className="trend-total">{periodStats.count}</span><span className="trend-delta">SAMPLE</span><span className="trend-comparison">from {periodStats.previous}</span></div><TrendChart period={period}/><div className="chart-legend"><span><i className="legend-dot lime-dot" />Synthetic trend values</span><span className="chart-note">Illustrative data only</span></div></article>
      <article className="panel categories-panel"><div className="panel-heading"><div><div className="section-kicker">WHAT WE’RE SEEING</div><h2>Sample risk distribution</h2></div><button className="text-link" onClick={() => onNavigate('Advertisement explorer')}>View all <Icon name="arrow" size={14} /></button></div><RiskDistribution alerts={alerts}/><div className="category-list">{indicators.map((item) => <button className="category-row" key={item.title} onClick={() => { onSearch(item.query); onNavigate('Advertisement explorer'); }}><span className={`category-icon ${item.type}`}>{item.icon}</span><span className="category-info"><b>{item.title}</b><small>{item.subtitle}</small></span><span className="category-amount">{item.amount}<small>{item.share}</small></span><span className="category-arrow"><Icon name="chevron" size={15}/></span></button>)}</div><div className="category-footer"><span><span className="mini-dot lime-dot"/> Categories based on detected signals</span><button onClick={() => onToast('Risk scores are illustrative; human review is required before enforcement.')}>How it works <Icon name="external" size={13}/></button></div></article>
    </section>
    <section className="panel alerts-panel">
      <div className="alerts-heading" id="alerts-heading"><div><div className="section-kicker">SAMPLE RECORDS NEEDING REVIEW</div><h2>Priority alerts <span className="alert-count">{recentAlerts.length}</span></h2></div><div className="alerts-tools"><button className="text-link view-alerts" onClick={() => onNavigate('Alerts center')}>View all <Icon name="arrow" size={14}/></button></div></div>
      <AlertTable rows={recentAlerts.slice(0, 5)} selectedId={selected?.id} onSelect={onSelect} compact reviewedIds={reviewedIds}/>
      <div className="table-footer"><span>Showing <b>{Math.min(5, recentAlerts.length)}</b> of <b>{alerts.length}</b> sample alerts · {cases.filter((item) => item.status !== 'Closed').length} open investigations</span><button onClick={() => selected && onInvestigate(selected)} disabled={!selected}>Investigate selected <Icon name="arrow" size={14}/></button></div>
    </section>
    <footer className="page-footer"><span>FinShield AI <i>·</i> Intelligence that protects</span><span><i className="footer-pulse"/> Monitoring 3,053 public sources <b>Last updated just now</b></span></footer>
  </>;
}
