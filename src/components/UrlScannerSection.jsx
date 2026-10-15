import React, { useState, useEffect } from 'react';
import Icon from './Icon.jsx';
import { RiskPill } from './shared.jsx';
import { executeUrlScan } from '../services/urlScannerService.js';
import { apiService } from '../services/apiService.js';

const SAMPLE_PRESETS = [
  { label: 'Official SBI Bank', url: 'https://www.onlinesbi.sbi', type: 'legit' },
  { label: 'SBI KYC Phishing (.top)', url: 'http://sbi-instant-kyc-verify.top/netbanking/login.php', type: 'phish' },
  { label: 'Official HDFC Bank', url: 'https://www.hdfcbank.com', type: 'legit' },
  { label: 'HDFC Rewards Phishing (.xyz)', url: 'https://hdfc-rewards-points.claim-prize.xyz/redeem-cash', type: 'phish' },
  { label: 'Raw IP Bank Clone', url: 'http://192.168.1.55/axis-bank/login.html', type: 'phish' },
  { label: 'Bit.ly Cloaked Link', url: 'https://bit.ly/claim-sbi-urgent-card-block-help', type: 'suspicious' },
];

export default function UrlScannerSection({ onToast, onSelectAlert, onNavigate }) {
  const [subTab, setSubTab] = useState('scanner'); // 'scanner' | 'scraper'
  const [inputUrl, setInputUrl] = useState('http://sbi-instant-kyc-verify.top/netbanking/login.php');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  
  // Scraper feed state
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedUrls, setScrapedUrls] = useState([]);
  const [feedFilter, setFeedFilter] = useState('all'); // 'all' | 'phishing' | 'legitimate'
  const [feedSearch, setFeedSearch] = useState('');

  // Load recent scanned URLs on mount
  useEffect(() => {
    loadRecentScans();
  }, []);

  async function loadRecentScans() {
    try {
      const data = await apiService.getRecentScannedUrls(30);
      if (data && data.length > 0) {
        setScrapedUrls(data);
      }
    } catch (e) {
      console.warn('Could not load recent scans:', e.message);
    }
  }

  async function handleScan(e) {
    if (e) e.preventDefault();
    if (!inputUrl.trim()) {
      onToast('Please enter a valid URL to scan.');
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    try {
      const res = await executeUrlScan(inputUrl.trim(), true);
      setScanResult(res);
      onToast(`URL Scan complete: Classified as ${res.classification} (${res.risk_score}/100)`);
      // Reload recent scans
      loadRecentScans();
    } catch (err) {
      onToast(`URL Scan failed: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  }

  async function handleTriggerWebScraper() {
    setIsScraping(true);
    onToast('Running Web Scrapers: Scraping OpenPhish, Reddit (r/phishing, r/Scams) & Web feeds for newly published URLs…');

    try {
      const res = await apiService.scrapeNewlyPublishedUrls(5);
      onToast(`Web Scraper finished! Scanned ${res.totalScanned || 0} URLs (${res.phishingCount || 0} Phishing, ${res.legitimateCount || 0} Legitimate).`);
      await loadRecentScans();
    } catch (err) {
      onToast(`Scraper notice: ${err.message}`);
    } finally {
      setIsScraping(false);
    }
  }

  const filteredFeed = scrapedUrls.filter((item) => {
    const matchesFilter =
      feedFilter === 'all' ||
      item.classification.toLowerCase() === feedFilter.toLowerCase();
    const matchesSearch =
      !feedSearch.trim() ||
      item.url.toLowerCase().includes(feedSearch.toLowerCase()) ||
      (item.target_brand && item.target_brand.toLowerCase().includes(feedSearch.toLowerCase())) ||
      (item.domain && item.domain.toLowerCase().includes(feedSearch.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const phishCount = scrapedUrls.filter((u) => u.classification === 'PHISHING').length;
  const legitCount = scrapedUrls.filter((u) => u.classification === 'LEGITIMATE').length;
  const suspCount = scrapedUrls.filter((u) => u.classification === 'SUSPICIOUS').length;

  return (
    <div className="url-scanner-container" style={{ marginTop: '1rem' }}>
      {/* Sub navigation bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
        <button
          type="button"
          onClick={() => setSubTab('scanner')}
          style={{
            background: subTab === 'scanner' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
            border: subTab === 'scanner' ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.1)',
            color: subTab === 'scanner' ? '#818cf8' : '#94a3b8',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Icon name="scan" size={15} /> URL Phishing Classifier & Inspector
        </button>
        <button
          type="button"
          onClick={() => setSubTab('scraper')}
          style={{
            background: subTab === 'scraper' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
            border: subTab === 'scraper' ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.1)',
            color: subTab === 'scraper' ? '#818cf8' : '#94a3b8',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Icon name="search" size={15} /> Web Scraper (Newly Published URLs Feed)
          {scrapedUrls.length > 0 && (
            <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '10px' }}>
              {scrapedUrls.length}
            </span>
          )}
        </button>
      </div>

      {subTab === 'scanner' ? (
        <div className="analysis-layout">
          {/* Scanner Input Panel */}
          <div className="panel analysis-form">
            <div className="section-kicker">REAL VS PHISHING URL CLASSIFIER</div>
            <h2>Scan & Inspect Target URL</h2>
            <p className="analysis-intro">
              Inspect suspicious landing pages, bank credential harvest forms, punycode spoofing, and domain typosquatting in real time.
            </p>

            {/* Quick Sample Presets */}
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                QUICK BENCHMARK SAMPLES:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {SAMPLE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setInputUrl(preset.url);
                      setScanResult(null);
                    }}
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      background: preset.type === 'legit' ? 'rgba(34, 197, 94, 0.12)' : preset.type === 'phish' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                      border: `1px solid ${preset.type === 'legit' ? 'rgba(34, 197, 94, 0.3)' : preset.type === 'phish' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                      color: preset.type === 'legit' ? '#4ade80' : preset.type === 'phish' ? '#f87171' : '#fbbf24',
                      cursor: 'pointer'
                    }}
                  >
                    {preset.type === 'legit' ? '🟢' : preset.type === 'phish' ? '🔴' : '🟡'} {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleScan}>
              <label className="form-label" style={{ fontWeight: 600 }}>
                Target URL / Destination
                <div style={{ position: 'relative', marginTop: '0.3rem' }}>
                  <input
                    type="text"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="e.g. https://onlinesbi.sbi or http://sbi-login.xyz"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      fontSize: '0.9rem',
                      borderRadius: '6px',
                      background: 'rgba(15, 23, 42, 0.7)',
                      color: '#f8fafc',
                      border: '1px solid rgba(255,255,255,0.15)',
                      fontFamily: 'monospace'
                    }}
                  />
                  {inputUrl && (
                    <button
                      type="button"
                      onClick={() => setInputUrl('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer'
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </label>

              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={isScanning || !inputUrl.trim()}
                  className="primary-action"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {isScanning ? (
                    <>
                      <span className="loading-spinner" /> Probing & Classifying URL…
                    </>
                  ) : (
                    <>
                      <Icon name="scan" size={15} /> Run Phishing URL Scan
                    </>
                  )}
                </button>
              </div>
            </form>

            <div style={{ marginTop: '1.25rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                CLASSIFIER ENGINE COVERS:
              </span>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.78rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                <li><b>Brand Impersonation & Typosquatting:</b> SBI, HDFC, ICICI, Axis, PNB, RBI, Paytm, PayPal.</li>
                <li><b>Disposable & High-Risk TLDs:</b> .xyz, .top, .click, .buzz, .club, .tk, .work, .fit.</li>
                <li><b>Live HTTP Content Probe:</b> Scrapes for password, card number, CVV & OTP inputs.</li>
                <li><b>Raw IP Hostnames & Punycode:</b> Detects numeric hostnames and IDN character spoofing.</li>
              </ul>
            </div>
          </div>

          {/* Scanner Result Panel */}
          <section className="panel analysis-result">
            {!scanResult && !isScanning && (
              <div className="analysis-empty">
                <div className="analysis-empty-icon"><Icon name="scan" size={24} /></div>
                <h2>URL Scan Results Appear Here</h2>
                <p>Enter a web destination or select a benchmark to view classification, brand spoofing verdict, live form detection, and threat signals.</p>
                <span>ENGINE: FINSHIELD AI DEEP URL INSPECTOR</span>
              </div>
            )}

            {isScanning && (
              <div className="analysis-empty" role="status">
                <span className="loading-spinner large-spinner" />
                <h2>Probing Target Destination</h2>
                <p>Analyzing domain DNS, checking brand whitelists, following redirects, and inspecting page forms…</p>
              </div>
            )}

            {scanResult && (
              <div className="result-content">
                <div className="section-kicker">URL INTELLIGENCE VERDICT</div>

                {/* Classification Hero Badge */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  borderRadius: '8px',
                  background: scanResult.classification === 'PHISHING'
                    ? 'rgba(239, 68, 68, 0.12)'
                    : scanResult.classification === 'LEGITIMATE'
                    ? 'rgba(34, 197, 94, 0.12)'
                    : 'rgba(245, 158, 11, 0.12)',
                  border: `1px solid ${
                    scanResult.classification === 'PHISHING'
                      ? 'rgba(239, 68, 68, 0.4)'
                      : scanResult.classification === 'LEGITIMATE'
                      ? 'rgba(34, 197, 94, 0.4)'
                      : 'rgba(245, 158, 11, 0.4)'
                  }`,
                  marginBottom: '1rem'
                }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', color: '#94a3b8' }}>VERDICT</span>
                    <h3 style={{
                      margin: '0.15rem 0 0 0',
                      fontSize: '1.25rem',
                      color: scanResult.classification === 'PHISHING' ? '#f87171' : scanResult.classification === 'LEGITIMATE' ? '#4ade80' : '#fbbf24',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      {scanResult.classification === 'PHISHING' ? '🚨 CONFIRMED PHISHING' : scanResult.classification === 'LEGITIMATE' ? '🛡️ REAL / LEGITIMATE' : '⚠️ SUSPICIOUS URL'}
                    </h3>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>RISK SCORE</span>
                    <b style={{
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      color: scanResult.classification === 'PHISHING' ? '#f87171' : scanResult.classification === 'LEGITIMATE' ? '#4ade80' : '#fbbf24'
                    }}>
                      {scanResult.risk_score}
                      <small style={{ fontSize: '0.75rem', color: '#94a3b8' }}>/100</small>
                    </b>
                  </div>
                </div>

                <div className="result-meter">
                  <i style={{
                    width: `${scanResult.risk_score}%`,
                    background: scanResult.classification === 'PHISHING' ? '#ef4444' : scanResult.classification === 'LEGITIMATE' ? '#22c55e' : '#f59e0b'
                  }} />
                </div>

                {/* Target Brand & Domain Overview */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.75rem',
                  margin: '1rem 0'
                }}>
                  <div style={{ padding: '0.65rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>TARGETED BRAND</span>
                    <b style={{ fontSize: '0.9rem', color: scanResult.target_brand.includes('SBI') || scanResult.target_brand.includes('HDFC') ? '#f87171' : '#f8fafc' }}>
                      {scanResult.target_brand}
                    </b>
                  </div>
                  <div style={{ padding: '0.65rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>DOMAIN HOSTNAME</span>
                    <code style={{ fontSize: '0.85rem', color: '#818cf8' }}>{scanResult.domain}</code>
                  </div>
                  <div style={{ padding: '0.65rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>LIVE HTTP PROBE</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: scanResult.is_live ? '#4ade80' : '#f87171' }}>
                      {scanResult.is_live ? `Live (HTTP ${scanResult.http_status || 200})` : 'Unreachable / Blocked'}
                    </span>
                  </div>
                </div>

                {/* Sensitive Forms Detected */}
                {scanResult.detected_forms && scanResult.detected_forms.length > 0 && (
                  <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                      ⚠️ SENSITIVE CREDENTIAL HARVESTERS DETECTED ON LANDING PAGE:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {scanResult.detected_forms.map((form) => (
                        <span key={form} style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                          🛑 {form}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendation */}
                <div className="result-block">
                  <div className="detail-section-heading">SECURITY ANALYST RECOMMENDATION</div>
                  <p style={{ fontSize: '0.85rem', color: '#f8fafc', lineHeight: '1.4', margin: '0.3rem 0 0 0' }}>
                    {scanResult.recommendation}
                  </p>
                </div>

                {/* Threat Signals Breakdown */}
                <div className="result-block">
                  <div className="detail-section-heading">DETECTED THREAT INDICATORS & SIGNALS ({scanResult.signals?.length || 0})</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
                    {scanResult.signals && scanResult.signals.length > 0 ? (
                      scanResult.signals.map((sig, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', fontSize: '0.8rem' }}>
                          <span style={{
                            padding: '0.15rem 0.35rem',
                            borderRadius: '3px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            background: sig.severity === 'critical' ? 'rgba(239, 68, 68, 0.2)' : sig.severity === 'high' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                            color: sig.severity === 'critical' ? '#f87171' : sig.severity === 'high' ? '#fbbf24' : '#4ade80'
                          }}>
                            {sig.severity ? sig.severity.toUpperCase() : 'SIGNAL'}
                          </span>
                          <span style={{ color: '#cbd5e1' }}>{sig.description}</span>
                        </div>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>No threat anomalies detected.</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      ) : (
        /* Web Scraper (Newly Published URLs Feed) Panel */
        <div className="panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <div className="section-kicker">WEB SCRAPER INTELLIGENCE FEED</div>
              <h2 style={{ margin: '0.2rem 0' }}>Newly Published & Scraped URLs</h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                Web scrapers crawl OpenPhish zero-day feeds, Reddit scam communities (r/phishing, r/Scams), and search engine indexes for newly registered fraudulent banking portals.
              </p>
            </div>

            <button
              type="button"
              onClick={handleTriggerWebScraper}
              disabled={isScraping}
              className="primary-action"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {isScraping ? (
                <>
                  <span className="loading-spinner" /> Running Web Scraper…
                </>
              ) : (
                <>
                  <Icon name="search" size={15} /> ⚡ Run Web Scraper (Fetch Newly Published URLs)
                </>
              )}
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>TOTAL SCRAPED</span>
              <b style={{ fontSize: '1.25rem', display: 'block', color: '#f8fafc' }}>{scrapedUrls.length}</b>
            </div>
            <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
              <span style={{ fontSize: '0.7rem', color: '#f87171' }}>PHISHING DETECTED</span>
              <b style={{ fontSize: '1.25rem', display: 'block', color: '#f87171' }}>{phishCount}</b>
            </div>
            <div style={{ padding: '0.75rem', background: 'rgba(34, 197, 94, 0.08)', borderRadius: '6px', border: '1px solid rgba(34, 197, 94, 0.25)' }}>
              <span style={{ fontSize: '0.7rem', color: '#4ade80' }}>LEGITIMATE BENCHMARKS</span>
              <b style={{ fontSize: '1.25rem', display: 'block', color: '#4ade80' }}>{legitCount}</b>
            </div>
            <div style={{ padding: '0.75rem', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
              <span style={{ fontSize: '0.7rem', color: '#fbbf24' }}>SUSPICIOUS / CLOAKED</span>
              <b style={{ fontSize: '1.25rem', display: 'block', color: '#fbbf24' }}>{suspCount}</b>
            </div>
          </div>

          {/* Table Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={feedSearch}
              onChange={(e) => setFeedSearch(e.target.value)}
              placeholder="Search scraped URLs, brands, domains..."
              style={{
                flex: 1,
                minWidth: '220px',
                padding: '0.5rem 0.75rem',
                fontSize: '0.85rem',
                borderRadius: '6px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#f8fafc'
              }}
            />
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {['all', 'phishing', 'legitimate'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFeedFilter(f)}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: '4px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    background: feedFilter === f ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.03)',
                    border: feedFilter === f ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                    color: feedFilter === f ? '#818cf8' : '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  {f === 'all' ? 'All URLs' : f}
                </button>
              ))}
            </div>
          </div>

          {/* Scraped URLs Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#94a3b8' }}>
                  <th style={{ padding: '0.6rem 0.5rem' }}>VERDICT</th>
                  <th style={{ padding: '0.6rem 0.5rem' }}>SCANNED URL</th>
                  <th style={{ padding: '0.6rem 0.5rem' }}>TARGET BRAND</th>
                  <th style={{ padding: '0.6rem 0.5rem' }}>RISK</th>
                  <th style={{ padding: '0.6rem 0.5rem' }}>DISCOVERY SOURCE</th>
                  <th style={{ padding: '0.6rem 0.5rem' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeed.length > 0 ? (
                  filteredFeed.map((item) => (
                    <tr
                      key={item.id || item.url}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}
                    >
                      <td style={{ padding: '0.65rem 0.5rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: item.classification === 'PHISHING'
                              ? 'rgba(239, 68, 68, 0.2)'
                              : item.classification === 'LEGITIMATE'
                              ? 'rgba(34, 197, 94, 0.2)'
                              : 'rgba(245, 158, 11, 0.2)',
                            color: item.classification === 'PHISHING' ? '#f87171' : item.classification === 'LEGITIMATE' ? '#4ade80' : '#fbbf24'
                          }}
                        >
                          {item.classification === 'PHISHING' ? '🚨 PHISHING' : item.classification === 'LEGITIMATE' ? '🛡️ REAL' : '⚠️ SUSPICIOUS'}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <code style={{ fontSize: '0.78rem', color: '#e2e8f0' }} title={item.url}>
                          {item.url}
                        </code>
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem', fontWeight: 600, color: item.target_brand && item.target_brand !== 'General / Unspecified' ? '#f87171' : '#94a3b8' }}>
                        {item.target_brand || 'General'}
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem', fontWeight: 700, color: item.risk_score >= 65 ? '#f87171' : item.risk_score <= 20 ? '#4ade80' : '#fbbf24' }}>
                        {item.risk_score}/100
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem', color: '#94a3b8', fontSize: '0.75rem' }}>
                        {item.source || 'Threat Intelligence'}
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setInputUrl(item.url);
                            setSubTab('scanner');
                            handleScan();
                          }}
                          style={{
                            background: 'rgba(99, 102, 241, 0.15)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            color: '#818cf8',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Inspect ↗
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      No URLs matching your query. Click "Run Web Scraper" above to fetch newly published URLs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
