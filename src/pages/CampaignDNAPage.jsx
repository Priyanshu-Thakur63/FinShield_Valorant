import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ReactFlow, Background, Controls, Handle, MiniMap, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Icon from '../components/Icon.jsx';
import { PageHeading, RiskPill, WorkspaceNote } from '../components/shared.jsx';
import { campaignClusters as seedClusters } from '../data/seedData.js';
import { apiService } from '../services/apiService.js';

const styles = {
  campaign: { background: '#232b1d', borderColor: '#667b49', color: '#e0f4b8' },
  ad: { background: '#192b34', borderColor: '#426273', color: '#c5e9f6' },
  phone: { background: '#30251b', borderColor: '#70563a', color: '#f1d19b' },
  url: { background: '#1e2938', borderColor: '#425e83', color: '#bcd4fa' },
  upi: { background: '#30212b', borderColor: '#70445c', color: '#f1bfda' },
  tag: { background: '#2a2223', borderColor: '#6e4449', color: '#f2c1c6' },
  image: { background: '#28233a', borderColor: '#564b7d', color: '#d5c9ff' },
};

function EntityNode({ data }) {
  const kind = data.kind || 'ad';
  const appearance = styles[kind] || styles.ad;
  return (
    <div className="dna-node" style={appearance}>
      <Handle type="target" position={Position.Left} />
      <span className="dna-node-kind">{kind}</span>
      <b>{data.label}</b>
      <small>{data.detail}</small>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
const nodeTypes = { entity: EntityNode };

export default function CampaignDNAPage({
  campaignId = 'CL-019',
  onNavigate,
  onSelectAlert,
  onCampaignId,
  alerts = [],
}) {
  const [activeCampaignId, setActiveCampaignId] = useState(campaignId || 'CL-019');
  const [campaigns, setCampaigns] = useState(seedClusters);
  const [rawGraph, setRawGraph] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);

  const [platform, setPlatform] = useState('All platforms');
  const [risk, setRisk] = useState('All risks');
  const [search, setSearch] = useState('');
  const [selection, setSelection] = useState({ kind: 'node', id: `campaign-${campaignId || 'CL-019'}` });
  const [flow, setFlow] = useState(null);

  // Sync prop changes
  useEffect(() => {
    if (campaignId && campaignId !== activeCampaignId) {
      setActiveCampaignId(campaignId);
    }
  }, [campaignId]);

  // Fetch campaign clusters list from backend
  useEffect(() => {
    let mounted = true;
    apiService.getCampaigns()
      .then((res) => {
        if (mounted && Array.isArray(res) && res.length > 0) {
          setCampaigns(res);
        }
      })
      .catch((err) => console.warn('Could not load campaigns list:', err.message));
    return () => { mounted = false; };
  }, []);

  // Fetch real graph for the active campaign
  const loadGraph = useCallback(async (cId) => {
    setLoading(true);
    try {
      const res = await apiService.getCampaignGraph(cId);
      if (res && Array.isArray(res.nodes)) {
        setRawGraph(res);
        setSelection({ kind: 'node', id: `campaign-${cId}` });
      }
    } catch (err) {
      console.warn('Real campaign graph load failed, using fallback:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGraph(activeCampaignId);
  }, [activeCampaignId, loadGraph]);

  const selectedCampaign = campaigns.find((c) => c.id === activeCampaignId) || campaigns[0] || seedClusters[0];

  const graphData = useMemo(() => {
    const rawNodes = rawGraph.nodes || [];
    const rawEdges = rawGraph.edges || [];

    const searchLower = search.trim().toLowerCase();

    // Determine which ads match the active filters
    const matchedNodes = rawNodes.map((node) => {
      const data = node.data || {};
      const isAd = node.type === 'ad' || data.kind === 'ad';

      let visible = true;
      if (isAd) {
        if (platform !== 'All platforms' && data.platform && data.platform !== platform) {
          visible = false;
        }
        if (risk !== 'All risks' && data.risk && data.risk.toLowerCase() !== risk.toLowerCase()) {
          visible = false;
        }
      }

      if (visible && searchLower) {
        const textContent = `${data.label || ''} ${data.detail || ''} ${data.text || ''} ${data.rawValue || ''} ${data.handle || ''}`.toLowerCase();
        visible = textContent.includes(searchLower);
      }

      return {
        ...node,
        hidden: !visible,
        type: 'entity',
        data: {
          ...data,
          kind: data.kind || node.type || 'ad',
        },
      };
    });

    const visibleNodeIds = new Set(matchedNodes.filter((n) => !n.hidden).map((n) => n.id));

    const edges = rawEdges
      .filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target))
      .map((edge) => {
        const isSelected = selection.kind === 'edge' && selection.id === edge.id;
        return {
          ...edge,
          style: {
            stroke: isSelected ? '#d8fb72' : '#53616b',
            strokeWidth: isSelected ? 2.5 : 1.4,
          },
          labelStyle: { fill: '#aab4b8', fontSize: 10 },
          labelBgStyle: { fill: '#11171c' },
        };
      });

    return { nodes: matchedNodes, edges };
  }, [rawGraph, platform, risk, search, selection]);

  const selectedNode = graphData.nodes.find((node) => node.id === selection.id);
  const selectedEdge = graphData.edges.find((edge) => edge.id === selection.id);

  // Available platforms in the current campaign's ads
  const adNodes = graphData.nodes.filter((n) => n.data.kind === 'ad');
  const availablePlatforms = [...new Set(adNodes.map((n) => n.data.platform).filter(Boolean))];

  function pickNode(node) {
    setSelection({ kind: 'node', id: node.id });
    if (node.data.alertId) {
      const match = alerts.find((a) => a.id === node.data.alertId);
      if (match && onSelectAlert) {
        onSelectAlert(match);
      }
    }
  }

  function handleCampaignChange(newId) {
    setActiveCampaignId(newId);
    if (onCampaignId) onCampaignId(newId);
  }

  return (
    <section className="workspace-page">
      <PageHeading
        eyebrow="SIGNATURE FEATURE / ENTITY RELATIONSHIPS"
        title="Campaign"
        mutedTitle="DNA"
        description="Explore correlated links among real advertisements, contacts, banking domains, and threat IoCs in PostgreSQL."
      />

      <div className="dna-toolbar panel">
        <label>
          CAMPAIGN CLUSTER
          <select
            aria-label="Filter graph by campaign cluster"
            value={activeCampaignId}
            onChange={(e) => handleCampaignChange(e.target.value)}
            style={{ minWidth: 170 }}
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id} · {c.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          PLATFORM
          <select
            aria-label="Filter graph by platform"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          >
            <option>All platforms</option>
            {availablePlatforms.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>

        <label>
          RISK
          <select
            aria-label="Filter graph by risk"
            value={risk}
            onChange={(e) => setRisk(e.target.value)}
          >
            <option>All risks</option>
            {['Critical', 'High', 'Medium', 'Low'].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>

        <label className="dna-search">
          SEARCH
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ad ID, handle, domain, or IoC…"
            aria-label="Search graph"
          />
        </label>

        <button className="secondary-action" onClick={() => flow?.fitView({ padding: 0.2, duration: 350 })}>
          Fit graph
        </button>

        <span className="live-stream-pill" style={{ marginLeft: 'auto', fontSize: 9 }}>
          <span className="live-stream-pulse" style={{ width: 6, height: 6 }} />
          LIVE POSTGRESQL GRAPH
        </span>
      </div>

      <div className="dna-layout">
        <section className="panel dna-canvas" aria-label="Campaign relationship graph">
          <ReactFlow
            nodes={graphData.nodes}
            edges={graphData.edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.18 }}
            onInit={setFlow}
            onNodeClick={(_, node) => pickNode(node)}
            onEdgeClick={(_, edge) => setSelection({ kind: 'edge', id: edge.id })}
            onPaneClick={() => setSelection({ kind: 'node', id: `campaign-${activeCampaignId}` })}
          >
            <Background color="#2d363b" gap={22} />
            <Controls />
            <MiniMap
              nodeColor={(node) => styles[node.data.kind]?.borderColor || '#627078'}
              maskColor="#0b0e1388"
            />
          </ReactFlow>
        </section>

        <aside className="panel dna-side">
          <div className="section-kicker">SELECTION DETAILS</div>

          {selection.kind === 'edge' && selectedEdge ? (
            <>
              <h2>{selectedEdge.label}</h2>
              <p className="dna-detail-copy">
                Correlated relationship derived from shared indicators and heuristics in the FinShield database.
              </p>
              <div className="evidence-item">
                <span className="evidence-check"><Icon name="check" size={11} /></span>
                <span>Relationship type: {selectedEdge.label}</span>
              </div>
              <div className="evidence-item">
                <span className="evidence-check"><Icon name="check" size={11} /></span>
                <span>Evidence source: PostgreSQL live cluster mapping</span>
              </div>
            </>
          ) : (
            <>
              <h2>{selectedNode?.data.label || `${selectedCampaign.id} · ${selectedCampaign.name}`}</h2>
              <p className="dna-detail-copy">
                {selectedNode?.data.detail || 'Select a graph node or relationship to inspect its entity evidence.'}
              </p>

              {/* Node specific info */}
              {selectedNode?.data.kind === 'ad' && (
                <div className="dna-selected-alert">
                  <RiskPill risk={selectedNode.data.risk || 'high'} />
                  {selectedNode.data.handle && (
                    <div style={{ color: '#9bb0c4', font: '10px DM Mono, monospace', marginTop: 4 }}>
                      Author: {selectedNode.data.handle}
                    </div>
                  )}
                  {selectedNode.data.amount && selectedNode.data.amount !== 'Not detected' && (
                    <div style={{ color: '#d8fb72', font: '10px DM Mono, monospace' }}>
                      Asking Amount: {selectedNode.data.amount}
                    </div>
                  )}
                  <p style={{ marginTop: 6, fontSize: 10, lineHeight: 1.45 }}>{selectedNode.data.text}</p>
                  <button
                    className="secondary-action"
                    style={{ marginTop: 8, width: '100%', minHeight: 28, fontSize: 10 }}
                    onClick={() => {
                      if (onSelectAlert) {
                        const adObj = alerts.find((a) => a.id === selectedNode.data.alertId) || {
                          id: selectedNode.data.alertId,
                          platform: selectedNode.data.platform,
                          handle: selectedNode.data.handle,
                          text: selectedNode.data.text,
                          risk: selectedNode.data.risk,
                          confidence: selectedNode.data.confidence,
                          tags: ['Campaign member'],
                        };
                        onSelectAlert(adObj);
                      }
                      if (onNavigate) onNavigate('Advertisement explorer');
                    }}
                  >
                    Open in Explorer <Icon name="arrow" size={12} />
                  </button>
                </div>
              )}

              {selectedNode?.data.kind && selectedNode.data.kind !== 'ad' && selectedNode.data.kind !== 'campaign' && (
                <div style={{ marginTop: 10, padding: '10px', background: '#12171c', borderRadius: 6, border: '1px solid #232d36' }}>
                  <div style={{ color: '#828e94', font: '9px DM Mono, monospace' }}>INDICATOR VALUE</div>
                  <div style={{ color: '#bcd4fa', font: '11px DM Mono, monospace', wordBreak: 'break-all', marginTop: 3 }}>
                    {selectedNode.data.rawValue || selectedNode.data.detail}
                  </div>
                  <div style={{ color: '#9bb1a8', fontSize: 10, marginTop: 6 }}>
                    Correlation: {selectedNode.data.detail}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="detail-section-heading dna-legend-title">GRAPH LEGEND</div>
          <div className="dna-legend">
            {Object.keys(styles).map((kind) => (
              <span key={kind}>
                <i style={{ background: styles[kind].borderColor }} />
                {kind === 'ad'
                  ? 'Advertisement'
                  : kind === 'image'
                  ? 'Image fingerprint'
                  : kind === 'campaign'
                  ? 'Campaign Cluster'
                  : kind === 'tag'
                  ? 'Threat Signature'
                  : kind.toUpperCase()}
              </span>
            ))}
          </div>

          <div className="detail-section-heading dna-legend-title">
            CAMPAIGN CLUSTER · {selectedCampaign.id}
          </div>
          <div className="dna-campaign-facts">
            <span>{selectedCampaign.posts || adNodes.length} linked advertisements in DB</span>
            <span>Channel: {selectedCampaign.platform}</span>
            <span>Pattern: {selectedCampaign.pattern}</span>
            <span>AI Risk Score: {selectedCampaign.confidence}/100 ({selectedCampaign.risk})</span>
          </div>

          <button
            className="primary-action dna-action"
            onClick={() => {
              if (onCampaignId) onCampaignId(selectedCampaign.id);
              if (onNavigate) onNavigate('Campaign investigations');
            }}
          >
            Open campaign investigation <Icon name="arrow" size={14} />
          </button>
        </aside>
      </div>

      <WorkspaceNote icon="network">
        Campaign DNA relationships reflect real PostgreSQL cluster associations and shared infrastructure (domains, phone numbers, and threat signatures) identified by the ingestion pipeline.
      </WorkspaceNote>
    </section>
  );
}
