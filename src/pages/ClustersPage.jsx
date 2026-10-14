import React, { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { campaignClusters } from '../data/seedData.js';
import { PageHeading, RiskPill, SearchBox, StatCards, WorkspaceNote } from '../components/shared.jsx';

function ClusterGraph() {
  return <div className="cluster-visual"><div className="cluster-orbit orbit-one"/><div className="cluster-orbit orbit-two"/><span className="cluster-node node-a">TG</span><span className="cluster-node node-b">☎</span><span className="cluster-node node-c">AD</span><span className="cluster-node node-d">URL</span><span className="cluster-core"><Icon name="network" size={21}/></span><span className="visual-caption">SHARED ENTITY GRAPH</span></div>;
}

export default function ClustersPage({ alerts, onSelectAlert, onNavigate, onToast, query, onQuery }) {
  const [selectedId, setSelectedId] = useState(campaignClusters[0].id);
  const selected = campaignClusters.find((cluster) => cluster.id === selectedId) || campaignClusters[0];
  const rows = useMemo(() => campaignClusters.filter((cluster) => `${cluster.id} ${cluster.name} ${cluster.platform} ${cluster.pattern}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const observedPlatforms = new Set(campaignClusters.flatMap((cluster) => cluster.platform.split(/\s*\+\s*/))).size;
  const stats = [
    { label: 'POTENTIAL CAMPAIGNS', value: campaignClusters.length, detail: 'Synthetic cluster examples' },
    { label: 'LINKED ADVERTISEMENTS', value: campaignClusters.reduce((sum, item) => sum + item.posts, 0), detail: 'Illustrative related posts' },
    { label: 'PLATFORMS OBSERVED', value: observedPlatforms, detail: 'Across sample clusters' },
    { label: 'HIGHEST SAMPLE RISK', value: 'Critical', detail: '1 synthetic cluster example', warning: true },
  ];

  function reviewLinkedAds() {
    const alert = alerts.find((item) => item.id === selected.alertId);
    if (!alert) {
      onToast(`No sample advertisement is linked to ${selected.id}.`);
      return;
    }
    onSelectAlert(alert);
    onNavigate('Ad monitoring');
  }

  return <section className="workspace-page">
    <PageHeading eyebrow="NETWORK ANALYSIS / COORDINATED ACTIVITY" title="Campaign" mutedTitle="clusters" description="Related advertisements grouped by shared entities, copy, and posting patterns." action="Refresh analysis" actionIcon="↻" onAction={() => onToast('Cluster analysis refreshed just now.')}/>
    <StatCards items={stats}/>
    <div className="cluster-layout">
      <section className="panel cluster-list-panel"><div className="workspace-toolbar"><div><div className="section-kicker">COORDINATED NETWORKS</div><h2>Recently detected</h2></div><SearchBox value={query} onChange={onQuery} placeholder="Search clusters..." label="Search clusters"/></div>
        <div className="cluster-list">{rows.map((cluster) => <button key={cluster.id} className={`cluster-list-item ${selected.id === cluster.id ? 'chosen' : ''}`} onClick={() => setSelectedId(cluster.id)}><span className={`cluster-symbol ${cluster.risk}`}><Icon name="network" size={17}/></span><span className="cluster-item-copy"><b>{cluster.name}</b><small>{cluster.platform} · {cluster.posts} linked posts</small></span><RiskPill risk={cluster.risk}/><span className="cluster-confidence">{cluster.confidence}%</span></button>)}{!rows.length && <div className="empty-state">No clusters match your search.</div>}</div>
      </section>
      <section className="panel cluster-detail-card"><ClusterGraph/><div className="cluster-detail-content"><div className="section-kicker">CLUSTER {selected.id}</div><h2>{selected.name}</h2><div className="cluster-detail-tags"><RiskPill risk={selected.risk}/><span>Sample reference score · {selected.confidence}/100</span></div><p>{selected.pattern}</p><div className="cluster-facts"><div><span>LINKED POSTS</span><b>{selected.posts}</b></div><div><span>ACCOUNTS</span><b>{selected.accounts}</b></div><div><span>FIRST SEEN</span><b>{selected.firstSeen}</b></div></div><button className="primary-action" onClick={reviewLinkedAds}>Review linked advertisements <Icon name="arrow" size={15}/></button></div></section>
    </div>
    <WorkspaceNote icon="network">Clusters are illustrative. Shared identifiers indicate a possible relationship and do not independently prove coordination.</WorkspaceNote>
  </section>;
}
