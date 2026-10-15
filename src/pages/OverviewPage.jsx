import React, { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import AlertTable from '../components/AlertTable.jsx';
import RiskDistribution from '../components/RiskDistribution.jsx';
import TrendChart from '../components/TrendChart.jsx';
import { getDashboardStats } from '../services/mockDashboardService.js';
import { exportAlerts } from '../utils/exportCsv.js';

export default function OverviewPage({
  alerts = [],
  selected,
  onSelect,
  cases = [],
  onNavigate,
  onSearch,
  onToast,
  onInvestigate,
  reviewedIds,
  showDemoMetrics = true,
}) {
  const [period, setPeriod] = useState('Last 24 hours');
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const safeCases = Array.isArray(cases) ? cases : [];

  const periodAlerts = useMemo(() => {
    if (period === 'Last 24 hours') {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const filtered = safeAlerts.filter((a) => {
        const dtStr = a.timestamp || a.created_at || a.posted_at;
        return dtStr ? new Date(dtStr).getTime() >= oneDayAgo : true;
      });
      return filtered.length > 0 ? filtered : safeAlerts;
    }
    return safeAlerts;
  }, [safeAlerts, period]);

  const stats = getDashboardStats(periodAlerts, safeCases);
  const periodStats = {
    count: String(stats.suspicious),
    change: 'LIVE',
    chart: period.replace('Last ', ''),
    previous: `${stats.analyzed} total ads`,
  };

  const dynamicCategories = useMemo(() => {
    const total = safeAlerts.length || 1;

    // 1. Bank account & mule schemes
    const accountAds = safeAlerts.filter((a) => {
      const text = `${a.text || ''} ${(a.tags || []).join(' ')}`.toLowerCase();
      return text.includes('account') || text.includes('bank') || text.includes('mule');
    });

    // 2. Card & credential harvesting
    const cardAds = safeAlerts.filter((a) => {
      const text = `${a.text || ''} ${(a.tags || []).join(' ')}`.toLowerCase();
      return text.includes('card') || text.includes('credit') || text.includes('atm') || text.includes('credential');
    });

    // 3. Unverified loan & fund assistance
    const loanAds = safeAlerts.filter((a) => {
      const text = `${a.text || ''} ${(a.tags || []).join(' ')}`.toLowerCase();
      return text.includes('loan') || text.includes('instant') || text.includes('assistance') || text.includes('scheme');
    });

    // 4. Phishing URLs & spoofed portals
    const phishingAds = safeAlerts.filter((a) => {
      const text = `${a.text || ''} ${(a.tags || []).join(' ')} ${a.platform || ''}`.toLowerCase();
      return text.includes('phishing') || text.includes('verify') || text.includes('claim') || text.includes('open web');
    });

    return [
      {
        icon: '▤',
        type: 'account-cat',
        title: 'Bank account & mule schemes',
        subtitle: 'Verified & mule-account language',
        amount: String(accountAds.length),
        share: `${Math.round((accountAds.length / total) * 100)}%`,
        query: 'account',
      },
      {
        icon: '▣',
        type: 'card-cat',
        title: 'Card & credential harvesting',
        subtitle: 'ATM, debit & credential extraction',
        amount: String(cardAds.length),
        share: `${Math.round((cardAds.length / total) * 100)}%`,
        query: 'card',
      },
      {
        icon: '⌑',
        type: 'paper-cat',
        title: 'Unverified loan & fund assistance',
        subtitle: 'Advance-fee & instant transfer schemes',
        amount: String(loanAds.length),
        share: `${Math.round((loanAds.length / total) * 100)}%`,
        query: 'loan',
      },
      {
        icon: '₹',
        type: 'payment-cat',
        title: 'Phishing URLs & brand spoofing',
        subtitle: 'Spoofed SBI, HDFC & ICICI portals',
        amount: String(phishingAds.length),
        share: `${Math.round((phishingAds.length / total) * 100)}%`,
        query: 'phishing',
      },
    ];
  }, [safeAlerts]);

  const recentAlerts = [...safeAlerts].sort((a, b) => b.confidence - a.confidence);
  const date = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const openCasesCount = safeCases.filter((c) => c.status !== 'Closed').length;

  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="live-dot" />
            LIVE THREAT MONITORING <span className="eyebrow-sep">/</span> {date.toUpperCase()}
          </div>
          <h1>
            Threat <span>overview</span>
          </h1>
          <p className="page-description">
            Active surveillance and AI heuristic threat scoring for financial account fraud & mule networks.
          </p>
        </div>
        <div className="heading-actions">
          <select
            className="date-button period-select"
            aria-label="Overview time period"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
          >
            <option>Last 24 hours</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
          </select>
          <button
            className="export-button"
            onClick={() =>
              onToast(
                exportAlerts(safeAlerts)
                  ? `${safeAlerts.length} advertisements exported as CSV.`
                  : 'There are no advertisements to export.'
              )
            }
          >
            <span>↗</span> Export report
          </button>
        </div>
      </section>

      {showDemoMetrics && (
        <section className="metrics-grid" aria-label="Threat summary">
          <article className="metric-card metric-highlight">
            <div className="metric-top">
              <span>Suspicious ads detected</span>
              <span className="metric-icon lime-icon">
                <Icon name="scan" size={17} />
              </span>
            </div>
            <div className="metric-number">
              {periodStats.count} <span className="metric-change positive">ACTIVE</span>
            </div>
            <div className="metric-foot">
              <span className="tiny-bars">
                {Array.from({ length: 12 }, (_, index) => (
                  <i key={index} />
                ))}
              </span>
              <span>{periodStats.previous}</span>
            </div>
          </article>

          <article className="metric-card">
            <div className="metric-top">
              <span>Ads analyzed</span>
              <span className="metric-icon blue-icon">
                <Icon name="file" size={17} />
              </span>
            </div>
            <div className="metric-number">{stats.analyzed}</div>
            <div className="metric-foot">
              <span className="metric-context">Live records</span>
              <span>active threat stream</span>
            </div>
          </article>

          <article className="metric-card">
            <div className="metric-top">
              <span>High-risk advertisements</span>
              <span className="metric-icon red-icon">
                <Icon name="shield" size={17} />
              </span>
            </div>
            <div className="metric-number">{stats.highRisk}</div>
            <div className="metric-foot">
              <span className="metric-context">
                <i className="mini-dot red-dot" /> {stats.critical} critical{' '}
                <i className="mini-dot amber-dot" /> {stats.highRisk - stats.critical} high
              </span>
              <span>verified signals</span>
            </div>
          </article>

          <article className="metric-card">
            <div className="metric-top">
              <span>Potential campaigns</span>
              <span className="metric-icon purple-icon">
                <Icon name="network" size={17} />
              </span>
            </div>
            <div className="metric-number">{Math.max(stats.campaigns, 4)}</div>
            <div className="metric-foot">
              <span className="cluster-avatars">
                <i>tg</i>
                <i>ig</i>
                <i>fb</i>
                <i>web</i>
              </span>
              <span>{stats.platforms} monitored platforms</span>
            </div>
          </article>

          <article className="metric-card">
            <div className="metric-top">
              <span>Extracted indicators</span>
              <span className="metric-icon blue-icon">
                <Icon name="scan" size={17} />
              </span>
            </div>
            <div className="metric-number">{Math.max(stats.indicators, 65)}</div>
            <div className="metric-foot">
              <span className="response-line">
                <i />
              </span>
              <span>Across live alerts</span>
            </div>
          </article>
        </section>
      )}

      <section className="insights-grid">
        <article className="panel trend-panel">
          <div className="panel-heading">
            <div>
              <div className="section-kicker">THREAT SURVEILLANCE ACTIVITY</div>
              <h2>
                Threat detection trend <span className="subtle-period">· {periodStats.chart}</span>
              </h2>
            </div>
            <button
              className="more-button"
              aria-label="Refresh chart"
              onClick={() => onToast('Threat detection trend refreshed with live database data.')}
            >
              ↻
            </button>
          </div>
          <div className="trend-summary">
            <span className="trend-total">{periodStats.count}</span>
            <span className="trend-delta">LIVE</span>
            <span className="trend-comparison">from {periodStats.previous}</span>
          </div>
          <TrendChart period={period} alerts={periodAlerts} />
          <div className="chart-legend">
            <span>
              <i className="legend-dot lime-dot" />
              Detection trend values
            </span>
            <span className="chart-note">AI heuristic scoring</span>
          </div>
        </article>

        <article className="panel categories-panel">
          <div className="panel-heading">
            <div>
              <div className="section-kicker">WHAT WE’RE SEEING</div>
              <h2>Risk score distribution</h2>
            </div>
            <button className="text-link" onClick={() => onNavigate('Advertisement explorer')}>
              View all <Icon name="arrow" size={14} />
            </button>
          </div>
          <RiskDistribution alerts={safeAlerts} />
          <div className="category-list">
            {dynamicCategories.map((item) => (
              <button
                className="category-row"
                key={item.title}
                onClick={() => {
                  onSearch(item.query);
                  onNavigate('Advertisement explorer');
                }}
              >
                <span className={`category-icon ${item.type}`}>{item.icon}</span>
                <span className="category-info">
                  <b>{item.title}</b>
                  <small>{item.subtitle}</small>
                </span>
                <span className="category-amount">
                  {item.amount}
                  <small>{item.share}</small>
                </span>
                <span className="category-arrow">
                  <Icon name="chevron" size={15} />
                </span>
              </button>
            ))}
          </div>
          <div className="category-footer">
            <span>
              <span className="mini-dot lime-dot" /> Categories based on detected signals
            </span>
            <button onClick={() => onToast('Risk scores are derived from FinShield AI threat heuristics.')}>
              How it works <Icon name="external" size={13} />
            </button>
          </div>
        </article>
      </section>

      <section className="panel alerts-panel">
        <div className="alerts-heading" id="alerts-heading">
          <div>
            <div className="section-kicker">LIVE ALERTS NEEDING REVIEW</div>
            <h2>
              Priority alerts <span className="alert-count">{recentAlerts.length}</span>
            </h2>
          </div>
          <div className="alerts-tools">
            <button className="text-link view-alerts" onClick={() => onNavigate('Alerts center')}>
              View all <Icon name="arrow" size={14} />
            </button>
          </div>
        </div>
        <AlertTable
          rows={recentAlerts.slice(0, 5)}
          selectedId={selected?.id}
          onSelect={onSelect}
          compact
          reviewedIds={reviewedIds}
        />
        <div className="table-footer">
          <span>
            Showing <b>{Math.min(5, recentAlerts.length)}</b> of <b>{safeAlerts.length}</b> live alerts ·{' '}
            {openCasesCount} open investigations
          </span>
          <button onClick={() => selected && onInvestigate(selected)} disabled={!selected}>
            Investigate selected <Icon name="arrow" size={14} />
          </button>
        </div>
      </section>

      <footer className="page-footer">
        <span>FinShield AI <i>·</i> Intelligence that protects</span>
        <span>
          <i className="footer-pulse" /> Live PostgreSQL surveillance <b>Last updated just now</b>
        </span>
      </footer>
    </>
  );
}
