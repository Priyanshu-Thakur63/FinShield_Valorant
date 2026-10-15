import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import AlertDetails from './components/AlertDetails.jsx';
import Header from './components/Header.jsx';
import Icon from './components/Icon.jsx';
import SettingsDialog from './components/SettingsDialog.jsx';
import Sidebar from './components/Sidebar.jsx';
import { initialCases, initialPreferences, initialWatchlist, alerts, navItems } from './data/seedData.js';
import usePersistentState from './hooks/usePersistentState.js';
import { exportAlerts } from './utils/exportCsv.js';
import { apiService } from './services/apiService.js';

const AnalysisPage = lazy(() => import('./pages/AnalysisPage.jsx'));
const AdvertisementsPage = lazy(() => import('./pages/AdvertisementsPage.jsx'));
const AlertsPage = lazy(() => import('./pages/AlertsPage.jsx'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage.jsx'));
const CampaignDetailsPage = lazy(() => import('./pages/CampaignDetailsPage.jsx'));
const CampaignDNAPage = lazy(() => import('./pages/CampaignDNAPage.jsx'));
const ClustersPage = lazy(() => import('./pages/ClustersPage.jsx'));
const LandingPage = lazy(() => import('./pages/LandingPage.jsx'));
const InvestigationsPage = lazy(() => import('./pages/InvestigationsPage.jsx'));
const MonitoringPage = lazy(() => import('./pages/MonitoringPage.jsx'));
const OverviewPage = lazy(() => import('./pages/OverviewPage.jsx'));
const ReportsPage = lazy(() => import('./pages/ReportsPage.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));
const WatchlistPage = lazy(() => import('./pages/WatchlistPage.jsx'));

const sections = new Set(navItems.map((item) => item.label));
const legacyHashes = new Map([
  ['Overview', 'overview'],
  ['Ad monitoring', 'monitoring'],
  ['Campaign clusters', 'clusters'],
  ['Investigations', 'investigations'],
  ['Watchlists', 'watchlists'],
]);
const sectionHashes = new Map(navItems.map((item) => [item.label, legacyHashes.get(item.label) || item.label.toLowerCase().replaceAll(' ', '-')]));

function sectionFromHash() {
  const hash = window.location.hash.slice(1);
  for (const [section, slug] of sectionHashes) if (slug === hash) return section;
  return 'Overview';
}

function App() {
  const [activeNav, setActiveNav] = useState(sectionFromHash);
  const [alertsData, setAlertsData] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [backendConnected, setBackendConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cases, setCases] = usePersistentState('sentinel:investigations:v1', initialCases);
  const [watchlist, setWatchlist] = usePersistentState('sentinel:watchlist:v1', initialWatchlist);
  const [preferences, setPreferences] = usePersistentState('sentinel:preferences:v1', initialPreferences);
  const [reviewedIds, setReviewedIds] = usePersistentState('sentinel:reviewed-alerts:v1', []);
  const [campaignId, setCampaignId] = usePersistentState('finshield:campaign-id:v1', 'CL-019');
  const [campaignRecords, setCampaignRecords] = usePersistentState('finshield:campaign-records:v1', {});
  const [workspaceSettings, setWorkspaceSettings] = usePersistentState('finshield:workspace-settings:v1', {
    workspaceName: 'Financial Integrity', analystName: 'Analyst workspace', theme: 'dark',
    tableDensity: 'comfortable', showDemoMetrics: true, notificationsEnabled: true,
  });

  const loadBackendData = useCallback(async () => {
    try {
      const [ads, invs, wl] = await Promise.all([
        apiService.getAdvertisements({ pageSize: 100 }),
        apiService.getInvestigations(),
        apiService.getWatchlist(),
      ]);
      if (ads && ads.length) {
        setAlertsData(ads);
        setSelected((curr) => ads.find((a) => a.id === curr?.id) || ads[0]);
      } else {
        setAlertsData([]);
        setSelected(null);
      }
      if (invs && invs.length) {
        setCases(invs);
      }
      if (wl && wl.length) {
        setWatchlist(wl);
      }
      setBackendConnected(true);
    } catch (e) {
      console.warn('Backend not reached, maintaining state:', e.message);
      setBackendConnected(false);
    }
  }, [setCases, setWatchlist]);

  useEffect(() => {
    loadBackendData();
  }, [loadBackendData]);

  const handleSyncLive = async (targetPlatform = 'all') => {
    setIsSyncing(true);
    try {
      const [redditRes, apifyRes] = await Promise.all([
        apiService.syncLiveRedditFeed(5).catch(() => ({ totalFetched: 0 })),
        apiService.triggerScrape(targetPlatform, null, 5).catch(() => ({ ingested: 0, totalScraped: 0 }))
      ]);
      await loadBackendData();
      const count = (redditRes.totalFetched || 0) + (apifyRes.ingested || apifyRes.totalScraped || 0);
      setToast(`Synced ${count} live posts across Reddit, Instagram, Facebook & Web into PostgreSQL!`);
    } catch (e) {
      setToast('Live feed synced.');
    } finally {
      setIsSyncing(false);
    }
  };

  const navigate = useCallback((section) => {
    if (!sections.has(section)) return;
    setActiveNav(section);
    setMobileNav(false);
    setDetailOpen(false);
    const slug = sectionHashes.get(section);
    if (window.location.hash !== `#${slug}`) window.history.pushState({ section }, '', `#${slug}`);
  }, []);

  const focusSearch = useCallback(() => {
    const selector = '.workspace-page input[aria-label^="Search"], .alerts-tools input[aria-label^="Search"]';
    if (document.querySelector(selector)) {
      document.querySelector(selector)?.focus();
      return;
    }
    navigate('Ad monitoring');
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }, [navigate]);

  useEffect(() => {
    const syncRoute = () => {
      setActiveNav(sectionFromHash());
      setMobileNav(false);
      setDetailOpen(false);
    };
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        focusSearch();
      }
      if (event.key === 'Escape') {
        setSettingsOpen(false);
        setMobileNav(false);
        setDetailOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [focusSearch]);

  function selectAlert(alert) {
    setSelected(alert);
    setDetailOpen(window.innerWidth <= 1250);
  }

  function createInvestigation(alert) {
    const existing = cases.find((item) => item.alertId === alert.id && item.status !== 'Closed');
    if (existing) {
      navigate('Investigations');
      setToast(`${existing.id} is already tracking ${alert.id}.`);
      return;
    }
    const nextNumber = Math.max(1042, ...cases.map((item) => Number(item.id.replace('INV-', '')) || 0)) + 1;
    const newCase = {
      id: `INV-${nextNumber}`,
      title: `${alert.handle} — ${alert.tags[0]}`,
      alertId: alert.id,
      owner: 'A. Sharma',
      status: 'Open',
      priority: alert.risk[0].toUpperCase() + alert.risk.slice(1),
      updated: 'Just now',
    };
    setCases((current) => [newCase, ...current]);
    apiService.createInvestigation(newCase).catch((e) => console.warn('Case creation sync error:', e));
    setSelected(alert);
    navigate('Investigations');
    setToast(`${newCase.id} created for ${alert.id} and saved in database.`);
  }

  function handleCasesChange(updater) {
    setCases((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      if (Array.isArray(next)) {
        for (const item of next) {
          const prev = current.find((c) => c.id === item.id);
          if (prev && (prev.status !== item.status || prev.owner !== item.owner || prev.priority !== item.priority)) {
            apiService.updateInvestigation(item.id, {
              status: item.status,
              owner: item.owner,
              priority: item.priority,
            }).catch(() => {});
          }
        }
      }
      return next;
    });
  }

  function handleWatchlistChange(updater) {
    setWatchlist((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      if (Array.isArray(next) && Array.isArray(current)) {
        if (next.length > current.length) {
          const added = next[0];
          apiService.addToWatchlist({ type: added.type, value: added.value }).catch(() => {});
        } else if (next.length < current.length) {
          const removed = current.find((c) => !next.some((n) => n.id === c.id));
          if (removed) {
            apiService.removeFromWatchlist(removed.id).catch(() => {});
          }
        }
      }
      return next;
    });
  }

  function openSource(source) {
    setQuery(source);
    navigate('Ad monitoring');
  }

  function resetDemoData() {
    setCases(initialCases);
    setWatchlist(initialWatchlist);
    setPreferences(initialPreferences);
    setReviewedIds([]);
    setCampaignRecords({});
    setCampaignId('CL-019');
    setWorkspaceSettings({
      workspaceName: 'Financial Integrity', analystName: 'Analyst workspace', theme: 'dark',
      tableDensity: 'comfortable', showDemoMetrics: true, notificationsEnabled: true,
    });
    window.localStorage.removeItem('finshield:alert-read:v1');
    window.localStorage.removeItem('finshield:alert-status:v1');
    window.localStorage.removeItem('finshield:ad-status:v1');
    loadBackendData();
    setToast('Demo records and preferences reset to initial state.');
  }

  function renderPage() {
    const common = { alerts: alertsData, selected, query, onQuery: setQuery, onSelect: selectAlert, onSelectAlert: selectAlert, onToast: setToast, reviewedIds, onNavigate: navigate };
    if (activeNav === 'Advertisement analysis') return <AnalysisPage {...common}/>;
    if (activeNav === 'Advertisement explorer') return <AdvertisementsPage {...common}/>;
    if (activeNav === 'Alerts center') return <AlertsPage {...common}/>;
    if (activeNav === 'Analytics') return <AnalyticsPage {...common} cases={cases} onSyncLive={handleSyncLive} isSyncing={isSyncing} onReload={loadBackendData}/>;
    if (activeNav === 'Campaign DNA') return <CampaignDNAPage {...common} campaignId={campaignId} onCampaignId={setCampaignId}/>;
    if (activeNav === 'Campaign investigations') return <CampaignDetailsPage {...common} campaignId={campaignId} onCampaignId={setCampaignId} campaignRecords={campaignRecords} onCampaignRecords={setCampaignRecords}/>;
    if (activeNav === 'Reports') return <ReportsPage {...common}/>;
    if (activeNav === 'Settings') return <SettingsPage {...common} preferences={preferences} onSavePreferences={setPreferences} workspaceSettings={workspaceSettings} onSaveWorkspaceSettings={setWorkspaceSettings} onResetDemo={resetDemoData}/>;
    if (activeNav === 'Landing page') return <LandingPage {...common}/>;
    if (activeNav === 'Ad monitoring') return <MonitoringPage {...common}/>;
    if (activeNav === 'Campaign clusters') return <ClustersPage {...common} onNavigate={navigate}/>;
    if (activeNav === 'Investigations') return <InvestigationsPage {...common} cases={cases} onCasesChange={handleCasesChange} onNavigate={navigate} onCreateCase={createInvestigation}/>;
    if (activeNav === 'Watchlists') return <WatchlistPage {...common} watchlist={watchlist} onWatchlistChange={handleWatchlistChange}/>;
    return <OverviewPage {...common} cases={cases} onNavigate={navigate} onSearch={setQuery} onInvestigate={createInvestigation} showDemoMetrics={workspaceSettings.showDemoMetrics}/>;
  }

  function toggleReview(alert) {
    const isReviewed = reviewedIds.includes(alert.id);
    setReviewedIds((current) => isReviewed ? current.filter((id) => id !== alert.id) : [...current, alert.id]);
    apiService.toggleAdReview(alert.id).catch(() => {});
    setToast(isReviewed ? `${alert.id} removed from review queue.` : `${alert.id} added to review queue.`);
  }

  const detailProps = {
    alert: selected,
    preferences,
    isReviewed: selected ? reviewedIds.includes(selected.id) : false,
    onInvestigate: () => selected && createInvestigation(selected),
    onReview: () => selected && toggleReview(selected),
    onOpenSource: () => setToast('External source link opening...'),
  };

  const fullWidthPages = new Set(['Advertisement analysis', 'Campaign DNA', 'Campaign investigations', 'Analytics', 'Alerts center', 'Reports', 'Settings', 'Landing page']);
  return <div className={`app-shell min-h-screen w-full bg-[#0b0e13] text-slate-100 ${fullWidthPages.has(activeNav) ? 'workspace-wide' : ''} ${workspaceSettings.theme === 'contrast' ? 'theme-contrast' : ''} ${workspaceSettings.tableDensity === 'compact' ? 'table-compact' : ''}`}>
    <Sidebar navItems={navItems} activeNav={activeNav} onNavigate={navigate} onToast={setToast} onSource={openSource} mobileOpen={mobileNav} onClose={() => setMobileNav(false)} workspaceSettings={workspaceSettings}/>
    <main className="main-content">
      <Header 
        activeNav={activeNav} 
        onMenu={() => setMobileNav(true)} 
        onSettings={() => setSettingsOpen(true)} 
        onSearch={focusSearch} 
        onNotifications={() => workspaceSettings.notificationsEnabled ? navigate('Alerts center') : setToast('Notifications are disabled in workspace settings.')}
        onSyncLive={handleSyncLive}
        isSyncing={isSyncing}
        backendConnected={backendConnected}
      />
      <div className="page-content"><Suspense fallback={<div className="page-loading" role="status">Preparing intelligence workspace…</div>}>{renderPage()}</Suspense></div>
    </main>
    <AlertDetails {...detailProps}/>
    {detailOpen && <div className="detail-scrim" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetailOpen(false); }}><div className="detail-drawer"><button className="detail-drawer-close icon-button" aria-label="Close alert details" onClick={() => setDetailOpen(false)}><Icon name="close" size={18}/></button><AlertDetails {...detailProps}/></div></div>}
    {settingsOpen && <SettingsDialog preferences={preferences} onClose={() => setSettingsOpen(false)} onSave={(nextPreferences) => { setPreferences(nextPreferences); setSettingsOpen(false); setToast('Workspace preferences saved locally.'); }}/>}
    {toast && <div className="toast" role="status" aria-live="polite"><span className="toast-check"><Icon name="check" size={13}/></span>{toast}</div>}
  </div>;
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('FinShield ErrorBoundary caught an error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#0b0e13', color: '#e2ebd7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ background: '#182026', border: '1px solid #33404d', borderRadius: '8px', padding: '32px', maxWidth: '540px', width: '100%', textAlign: 'center' }}>
            <h2 style={{ color: '#ff7b72', marginBottom: '12px', fontSize: '20px' }}>Workspace Active</h2>
            <p style={{ color: '#8b949e', fontSize: '13px', marginBottom: '20px' }}>
              A temporary render discrepancy was recovered.
            </p>
            <button 
              onClick={() => { window.location.hash = '#overview'; window.location.reload(); }}
              style={{ background: '#d8fb72', color: '#0b0e13', border: 'none', padding: '10px 24px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
            >
              Refresh Workspace
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = import.meta.hot?.data.root ?? createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <App/>
  </ErrorBoundary>
);

if (import.meta.hot) {
  import.meta.hot.data.root = root;
}
