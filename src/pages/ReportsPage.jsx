import React, { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { PageHeading, WorkspaceNote } from '../components/shared.jsx';
import { alerts, campaignClusters } from '../data/seedData.js';
import { exportAlerts } from '../utils/exportCsv.js';
import { downloadFile } from '../utils/downloadFile.js';

export default function ReportsPage({ onToast }) {
  const [campaignId, setCampaignId] = useState(campaignClusters[0].id);
  const campaign = campaignClusters.find((item) => item.id === campaignId) || campaignClusters[0];
  const related = useMemo(() => alerts.filter((item) => item.id === campaign.alertId), [campaign]);
  const report = {
    reportType: 'FinShield AI synthetic campaign summary',
    generatedAt: new Date().toISOString(),
    disclaimer: 'Frontend demo only. All records are illustrative, not live intelligence or verified evidence.',
    campaign: { id: campaign.id, name: campaign.name, risk: campaign.risk, sampleReferenceScore: campaign.confidence, platform: campaign.platform, pattern: campaign.pattern },
    sampleAdvertisements: related.map(({ id, text, handle, platform, risk, tags, evidence }) => ({ id, text, handle, platform, risk, tags, evidence })),
  };
  function downloadJson() {
    downloadFile(`${campaign.id.toLowerCase()}-summary.json`, JSON.stringify(report, null, 2), 'application/json');
    onToast('Campaign evidence summary downloaded as JSON.');
  }
  function downloadCsv() {
    onToast(exportAlerts(alerts) ? `${alerts.length} synthetic advertisement records downloaded as CSV.` : 'No advertisement records are available to export.');
  }
  return <section className="workspace-page">
    <PageHeading eyebrow="EXPORTS / CASE DOCUMENTATION" title="Reports" mutedTitle="& exports" description="Generate downloadable synthetic summaries and review a print-ready campaign report."/>
    <div className="reports-layout">
      <section className="panel report-builder"><div className="report-icon"><Icon name="file" size={22}/></div><div className="section-kicker">GENERATE A REPORT</div><h2>Campaign summary</h2><p>Create a local report from the illustrative campaign records in this browser.</p><label className="form-label">Potential campaign<select value={campaignId} onChange={(event) => setCampaignId(event.target.value)}>{campaignClusters.map((item) => <option value={item.id} key={item.id}>{item.id} · {item.name}</option>)}</select></label><button className="primary-action" onClick={downloadJson}>Export evidence summary JSON <Icon name="download" size={14}/></button><button className="secondary-action" onClick={downloadCsv}>Export advertisement records CSV <Icon name="download" size={14}/></button><small>Files are created locally; no server is contacted.</small></section>
      <section className="panel report-preview" id="printable-report"><div className="report-preview-toolbar"><div><div className="section-kicker">REPORT PREVIEW · DEMO RECORD</div><h2>Campaign intelligence brief</h2></div><button className="table-export" onClick={() => window.print()}><Icon name="file" size={13}/> Print report</button></div><div className="report-paper">
        <div className="report-brand"><span className="brand-mark"><i/><i/><i/><i/></span><b>FinShield AI</b><small>DETECT. DEFEND. PROTECT.</small></div>
        <div className="section-kicker">POTENTIAL CAMPAIGN · {campaign.id}</div><h2>{campaign.name}</h2><p className="report-disclaimer">Synthetic campaign overview generated for demonstration. This is not verified intelligence.</p>
        <div className="report-metrics"><div><small>RISK INDICATOR</small><b>{campaign.risk}</b></div><div><small>SAMPLE REFERENCE SCORE</small><b>{campaign.confidence}/100</b></div><div><small>OBSERVED PLATFORMS</small><b>{campaign.platform}</b></div></div>
        <div className="report-section"><h3>Summary</h3><p>{campaign.pattern}. The grouping is a potential relationship for analyst review, not a finding of wrongdoing.</p></div>
        <div className="report-section"><h3>Advertisement records</h3>{related.map((item) => <p key={item.id}><b>{item.id} · {item.handle}</b><br/>{item.text}</p>)}</div>
        <div className="report-section"><h3>Review guidance</h3><p>Independently verify source context and corroborate each shared indicator before making a decision.</p></div>
        <footer>FinShield AI · Synthetic frontend demonstration · {new Date().toLocaleDateString()}</footer>
      </div></section>
    </div>
    <WorkspaceNote icon="file">Exports contain synthetic content only. Confirm the intended recipients and handling requirements before sharing investigation records.</WorkspaceNote>
  </section>;
}
