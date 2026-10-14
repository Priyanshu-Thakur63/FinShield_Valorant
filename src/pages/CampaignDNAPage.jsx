import React, { useMemo, useState } from 'react';
import { ReactFlow, Background, Controls, Handle, MiniMap, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Icon from '../components/Icon.jsx';
import { PageHeading, RiskPill, WorkspaceNote } from '../components/shared.jsx';
import { alerts, campaignClusters } from '../data/seedData.js';
import { campaignGraph } from '../services/mockCampaignService.js';

const styles = {
  campaign: { background: '#232b1d', borderColor: '#667b49', color: '#e0f4b8' },
  ad: { background: '#192b34', borderColor: '#426273', color: '#c5e9f6' },
  phone: { background: '#30251b', borderColor: '#70563a', color: '#f1d19b' },
  url: { background: '#1e2938', borderColor: '#425e83', color: '#bcd4fa' },
  upi: { background: '#30212b', borderColor: '#70445c', color: '#f1bfda' },
  image: { background: '#28233a', borderColor: '#564b7d', color: '#d5c9ff' },
};

function EntityNode({ data }) {
  const appearance = styles[data.kind] || styles.ad;
  return <div className="dna-node" style={appearance}>
    <Handle type="target" position={Position.Left}/><span className="dna-node-kind">{data.kind}</span><b>{data.label}</b><small>{data.detail}</small><Handle type="source" position={Position.Right}/>
  </div>;
}
const nodeTypes = { entity: EntityNode };

export default function CampaignDNAPage({ onNavigate, onSelectAlert, onCampaignId }) {
  const [platform, setPlatform] = useState('All platforms');
  const [risk, setRisk] = useState('All risks');
  const [search, setSearch] = useState('');
  const [selection, setSelection] = useState({ kind: 'node', id: 'campaign-019' });
  const [flow, setFlow] = useState(null);
  const selectedCampaign = campaignClusters[0];
  const graphData = useMemo(() => {
    const ads = alerts.filter((alert) => alert.id === 'ADV-2841' || alert.id === 'ADV-2842');
    const indicatorSearch = campaignGraph.nodes
      .filter((node) => node.type !== 'ad')
      .map((node) => `${node.data.label} ${node.data.detail}`)
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesFilters = ads.filter((alert) =>
      (platform === 'All platforms' || alert.platform === platform)
      && (risk === 'All risks' || alert.risk === risk.toLowerCase())
      && (!search || indicatorSearch || `${alert.id} ${alert.handle} ${alert.text} ${alert.phone} ${alert.url}`.toLowerCase().includes(search.toLowerCase())));
    const allowed = new Set(matchesFilters.map((alert) => alert.id));
    const nodes = campaignGraph.nodes.map((node) => {
      if (node.type !== 'ad') return node;
      const alertId = node.data.alertId;
      if (!allowed.has(alertId)) return { ...node, hidden: true };
      return { ...node, type: 'entity', data: { ...node.data, kind: 'ad' } };
    });
    const edges = campaignGraph.edges.filter((edge) => {
      const source = nodes.find((node) => node.id === edge.source);
      const target = nodes.find((node) => node.id === edge.target);
      return !source?.hidden && !target?.hidden;
    }).map((edge) => ({
      ...edge,
      style: { stroke: selection.kind === 'edge' && selection.id === edge.id ? '#d8fb72' : '#53616b', strokeWidth: selection.kind === 'edge' && selection.id === edge.id ? 2.5 : 1.4 },
      labelStyle: { fill: '#aab4b8', fontSize: 10 },
      labelBgStyle: { fill: '#11171c' },
    }));
    return { nodes: nodes.map((node) => node.type === 'entity' ? node : { ...node, type: 'entity', data: { ...node.data, kind: node.type } }), edges };
  }, [platform, risk, search, selection]);
  const selectedNode = graphData.nodes.find((node) => node.id === selection.id);
  const selectedEdge = graphData.edges.find((edge) => edge.id === selection.id);
  const linkedAlerts = alerts.filter((alert) => ['ADV-2841', 'ADV-2842'].includes(alert.id));
  const platforms = [...new Set(linkedAlerts.map((alert) => alert.platform))];

  function pickNode(node) {
    setSelection({ kind: 'node', id: node.id });
    const alert = alerts.find((entry) => entry.id === node.data.alertId);
    if (alert) onSelectAlert(alert);
  }

  return <section className="workspace-page">
    <PageHeading eyebrow="SIGNATURE FEATURE / ENTITY RELATIONSHIPS" title="Campaign" mutedTitle="DNA" description="Explore synthetic links among advertisements, contacts, domains, payment IDs and image fingerprints."/>
    <div className="dna-toolbar panel">
      <label>PLATFORM<select aria-label="Filter graph by platform" value={platform} onChange={(event) => setPlatform(event.target.value)}><option>All platforms</option>{[...new Set(linkedAlerts.map((item) => item.platform))].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>RISK<select aria-label="Filter graph by risk" value={risk} onChange={(event) => setRisk(event.target.value)}><option>All risks</option>{['Critical', 'High', 'Medium', 'Low'].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="dna-search">SEARCH<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ad or indicator…" aria-label="Search graph"/></label>
      <button className="secondary-action" onClick={() => flow?.fitView({ padding: 0.2, duration: 350 })}>Fit graph</button>
      <span className="demo-caption">SYNTHETIC RELATIONSHIPS</span>
    </div>
    <div className="dna-layout">
      <section className="panel dna-canvas" aria-label="Campaign relationship graph">
        <ReactFlow nodes={graphData.nodes} edges={graphData.edges} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.18 }} onInit={setFlow} onNodeClick={(_, node) => pickNode(node)} onEdgeClick={(_, edge) => setSelection({ kind: 'edge', id: edge.id })} onPaneClick={() => setSelection({ kind: 'node', id: 'campaign-019' })}>
          <Background color="#2d363b" gap={22}/><Controls/><MiniMap nodeColor={(node) => styles[node.data.kind]?.borderColor || '#627078'} maskColor="#0b0e1388"/>
        </ReactFlow>
      </section>
      <aside className="panel dna-side">
        <div className="section-kicker">SELECTION DETAILS</div>
        {selection.kind === 'edge' && selectedEdge ? <>
          <h2>{selectedEdge.label}</h2><p className="dna-detail-copy">This synthetic relationship suggests a potential link between the connected entities. It is an investigative lead, not proof of coordination.</p>
          <div className="evidence-item"><span className="evidence-check"><Icon name="check" size={11}/></span><span>Relationship label: {selectedEdge.label}</span></div>
          <div className="evidence-item"><span className="evidence-check"><Icon name="check" size={11}/></span><span>Evidence source: illustrative demo graph</span></div>
        </> : <>
          <h2>{selectedNode?.data.label || 'Potential campaign · CL-019'}</h2><p className="dna-detail-copy">{selectedNode?.data.detail || 'Select a graph node or relationship to inspect its synthetic evidence.'}</p>
          {selectedNode?.data.alertId && (() => {
            const alert = alerts.find((item) => item.id === selectedNode.data.alertId);
            return alert ? <div className="dna-selected-alert"><RiskPill risk={alert.risk}/><p>{alert.text}</p>{alert.tags.map((tag) => <span className="watch-type" key={tag}>{tag}</span>)}</div> : null;
          })()}
        </>}
        <div className="detail-section-heading dna-legend-title">GRAPH LEGEND</div>
        <div className="dna-legend">{Object.keys(styles).map((kind) => <span key={kind}><i style={{ background: styles[kind].borderColor }}/>{kind === 'ad' ? 'Advertisement' : kind === 'image' ? 'Image fingerprint' : kind === 'campaign' ? 'Potential campaign' : kind.toUpperCase()}</span>)}</div>
        <div className="detail-section-heading dna-legend-title">POTENTIAL CAMPAIGN · {selectedCampaign.id}</div>
        <div className="dna-campaign-facts"><span>{selectedCampaign.posts} related advertisements</span><span>{platforms.join(' · ')} observed</span><span>Shared: public contact, wording, visual signature</span></div>
        <button className="primary-action dna-action" onClick={() => { onCampaignId(selectedCampaign.id); onNavigate('Campaign investigations'); }}>Open campaign investigation <Icon name="arrow" size={14}/></button>
      </aside>
    </div>
    <WorkspaceNote icon="network">A shared phone number, URL, phrase or image fingerprint is a lead for review—not proof that accounts are coordinated or unlawful.</WorkspaceNote>
  </section>;
}
