import React, { useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeading, StatCards, WorkspaceNote } from '../components/shared.jsx';
import { alerts, campaignClusters } from '../data/seedData.js';

const baseTrend = [
  { day: 'Mon', total: 42, suspicious: 12 }, { day: 'Tue', total: 55, suspicious: 18 },
  { day: 'Wed', total: 49, suspicious: 16 }, { day: 'Thu', total: 72, suspicious: 29 },
  { day: 'Fri', total: 64, suspicious: 24 }, { day: 'Sat', total: 83, suspicious: 35 },
  { day: 'Sun', total: 77, suspicious: 31 },
];
const riskColors = ['#ee817f', '#eab569', '#e7d474', '#84c999'];

export default function AnalyticsPage({ cases }) {
  const [range, setRange] = useState('7 days');
  const factor = range === '30 days' ? 3 : range === '90 days' ? 6 : 1;
  const trend = useMemo(() => baseTrend.map((entry) => ({ ...entry, total: entry.total * factor, suspicious: entry.suspicious * factor })), [factor]);
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const safeCases = Array.isArray(cases) ? cases : [];
  const risks = ['critical', 'high', 'medium', 'low'].map((name, index) => ({ name, value: safeAlerts.filter((alert) => alert.risk === name).length * factor, fill: riskColors[index] }));
  const platforms = [...new Set(safeAlerts.map((alert) => alert.platform))].map((name) => ({ name, ads: safeAlerts.filter((alert) => alert.platform === name).length * factor }));
  const indicators = safeAlerts.flatMap((alert) => alert.tags || []).reduce((counts, tag) => { counts[tag] = (counts[tag] || 0) + 1; return counts; }, {});
  const frequent = Object.entries(indicators).map(([name, count]) => ({ name, count: count * factor })).sort((a, b) => b.count - a.count).slice(0, 5);
  const maxFreq = Math.max(1, ...frequent.map(({ count }) => count));
  const campaignSizes = campaignClusters.map((campaign) => ({ id: campaign.id, posts: campaign.posts * factor }));
  const maxCampaign = Math.max(1, ...campaignSizes.map(({ posts }) => posts));
  const statusCounts = ['Open', 'In progress', 'Closed'].map((status) => ({ status, value: safeCases.filter((item) => item.status === status).length * factor }));
  const stats = [
    { label: 'SAMPLE ADS ANALYZED', value: (safeAlerts.length * factor).toLocaleString(), detail: `Illustrative ${range.toLowerCase()} records` },
    { label: 'HIGH-RISK SHARE', value: safeAlerts.length > 0 ? `${Math.round((safeAlerts.filter((alert) => ['critical', 'high'].includes(alert.risk)).length / safeAlerts.length) * 100)}%` : '0%', detail: 'Critical + high sample labels', warning: true },
    { label: 'POTENTIAL CAMPAIGNS', value: campaignClusters.length, detail: 'Synthetic clusters in demo feed' },
    { label: 'OPEN INVESTIGATIONS', value: safeCases.filter((item) => item.status !== 'Closed').length, detail: 'Example analyst queue' },
  ];
  return <section className="workspace-page">
    <PageHeading eyebrow="TRENDS / DEMO METRICS" title="Threat" mutedTitle="analytics" description="Explore sample trends and indicator distributions across a selectable demonstration window."/>
    <div className="analytics-range"><span>REPORTING WINDOW</span><select aria-label="Analytics date range" value={range} onChange={(event) => setRange(event.target.value)}><option>7 days</option><option>30 days</option><option>90 days</option></select><small>All values are synthetic and illustrative.</small></div>
    <StatCards items={stats}/>
    <div className="analytics-grid">
      <section className="panel analytics-panel analytics-wide"><div className="section-kicker">DETECTION TREND</div><h2>Advertisement activity <span>· {range}</span></h2><div className="analytics-chart"><ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 680, height: 240 }}><AreaChart data={trend}><defs><linearGradient id="analyticsTotal" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9bd3c0" stopOpacity=".25"/><stop offset="100%" stopColor="#9bd3c0" stopOpacity="0"/></linearGradient><linearGradient id="analyticsRisk" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d8fb72" stopOpacity=".18"/><stop offset="100%" stopColor="#d8fb72" stopOpacity="0"/></linearGradient></defs><CartesianGrid stroke="#252d33" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="day" stroke="#778188" tickLine={false} axisLine={false}/><YAxis stroke="#778188" tickLine={false} axisLine={false}/><Tooltip contentStyle={{ background: '#151b1e', border: '1px solid #34403c', borderRadius: 6 }}/><Area dataKey="total" name="All ads" stroke="#8bc7b5" fill="url(#analyticsTotal)" strokeWidth={2}/><Area dataKey="suspicious" name="Suspicious examples" stroke="#d8fb72" fill="url(#analyticsRisk)" strokeWidth={2}/></AreaChart></ResponsiveContainer></div></section>
      <section className="panel analytics-panel"><div className="section-kicker">RISK CATEGORIES</div><h2>Sample risk mix</h2><div className="analytics-chart"><ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 300, height: 230 }}><PieChart><Pie data={risks} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="82%" paddingAngle={4}>{risks.map((entry) => <Cell key={entry.name} fill={entry.fill}/>)}</Pie><Tooltip contentStyle={{ background: '#151b1e', border: '1px solid #34403c', borderRadius: 6 }}/></PieChart></ResponsiveContainer></div><div className="chart-legend">{risks.map((item) => <span key={item.name}><i style={{ background: item.fill }}/>{item.name}<b>{item.value}</b></span>)}</div></section>
      <section className="panel analytics-panel"><div className="section-kicker">PLATFORM DISTRIBUTION</div><h2>Sample source mix</h2><div className="analytics-chart"><ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 360, height: 230 }}><BarChart data={platforms} layout="vertical" margin={{ left: 8, right: 12 }}><CartesianGrid stroke="#252d33" strokeDasharray="3 3" horizontal={false}/><XAxis type="number" stroke="#778188" tickLine={false} axisLine={false}/><YAxis dataKey="name" type="category" stroke="#aeb8b9" tickLine={false} axisLine={false} width={82}/><Tooltip contentStyle={{ background: '#151b1e', border: '1px solid #34403c', borderRadius: 6 }}/><Bar dataKey="ads" fill="#8ec5b2" radius={[0, 4, 4, 0]}/></BarChart></ResponsiveContainer></div></section>
      <section className="panel analytics-panel"><div className="section-kicker">FREQUENT INDICATORS</div><h2>Common sample signals</h2><div className="frequency-list">{frequent.map((item) => <div key={item.name}><span>{item.name}</span><i><b style={{ width: `${(item.count / maxFreq) * 100}%` }}/></i><strong>{item.count}</strong></div>)}</div><div className="detail-section-heading analytics-subhead">POTENTIAL CAMPAIGN SIZE · SAMPLE POSTS</div><div className="campaign-size-list">{campaignSizes.map((item) => <div key={item.id}><span>{item.id}</span><i><b style={{ width: `${(item.posts / maxCampaign) * 100}%` }}/></i><strong>{item.posts}</strong></div>)}</div><div className="detail-section-heading analytics-subhead">INVESTIGATION STATUS · DEMO</div><div className="status-bar">{statusCounts.map((item) => <i key={item.status} title={`${item.status}: ${item.value}`} style={{ flex: item.value }}/>)}</div><div className="status-caption">{statusCounts.map((item) => <span key={item.status}>{item.status} {item.value}</span>)}</div></section>
    </div>
    <WorkspaceNote icon="chart">Trend scaling changes with the selected time window, but all underlying values are generated mock data and do not describe live activity.</WorkspaceNote>
  </section>;
}
