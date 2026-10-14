import React from 'react';
import Icon from '../components/Icon.jsx';
import { PageHeading, RiskPill, WorkspaceNote } from '../components/shared.jsx';
import { campaignClusters } from '../data/seedData.js';
import { getRelatedAds } from '../services/mockCampaignService.js';
import { downloadFile } from '../utils/downloadFile.js';

export default function CampaignDetailsPage({ campaignId, onCampaignId, campaignRecords, onCampaignRecords, onSelectAlert, onNavigate, onToast }) {
  const campaign = campaignClusters.find((item) => item.id === campaignId) || campaignClusters[0];
  const record = campaignRecords[campaign.id] || { status: 'Open', notes: [], relations: {} };
  const related = getRelatedAds(campaign);
  const update = (changes) => onCampaignRecords((current) => ({ ...current, [campaign.id]: { ...record, ...changes } }));

  function addNote(event) {
    event.preventDefault();
    const note = event.currentTarget.elements.note.value.trim();
    if (!note) return;
    update({ notes: [{ text: note, createdAt: new Date().toLocaleString() }, ...(record.notes || [])] });
    event.currentTarget.reset();
    onToast('Analyst note saved in this browser.');
  }
  function exportEvidence() {
    const payload = { demo: true, campaign, status: record.status, relatedAdvertisements: related.map(({ id, platform, handle, text, risk, phone, url, evidence }) => ({ id, platform, handle, text, risk, phone, url, evidence })), notes: record.notes || [], relationshipReview: record.relations || [] };
    downloadFile(`${campaign.id.toLowerCase()}-evidence.json`, JSON.stringify(payload, null, 2), 'application/json');
    onToast('Synthetic campaign evidence exported as JSON.');
  }

  return <section className="workspace-page">
    <PageHeading eyebrow="CAMPAIGN CASE FILE / DEMO RECORD" title="Campaign" mutedTitle="investigation" description="Review the evidence trail and manage analyst notes for this potential campaign." action="Export evidence" actionIcon="↓" onAction={exportEvidence}/>
    <div className="campaign-select-row"><label>CASE FILE<select aria-label="Choose campaign case file" value={campaign.id} onChange={(event) => onCampaignId(event.target.value)}>{campaignClusters.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.name}</option>)}</select></label><span className="demo-caption">SYNTHETIC INVESTIGATION RECORD</span></div>
    <div className="campaign-case-layout">
      <div className="campaign-case-main">
        <section className="panel campaign-case-summary">
          <div className="case-summary-head"><div><div className="section-kicker">{campaign.id} · POTENTIAL CAMPAIGN</div><h2>{campaign.name}</h2></div><RiskPill risk={campaign.risk}/></div>
          <p>{campaign.pattern}. These synthetic links should be validated independently before any action.</p>
          <div className="campaign-case-facts"><div><small>RISK INDICATOR</small><b>Confidence score · {campaign.confidence}/100</b></div><div><small>RELATED ADVERTISEMENTS</small><b>{campaign.posts} sample posts</b></div><div><small>PLATFORMS OBSERVED</small><b>{campaign.platform}</b></div><div><small>FIRST OBSERVED</small><b>{campaign.firstSeen}</b></div></div>
          <label className="form-label case-status-field">Investigation status<select className="case-status" value={record.status} onChange={(event) => { update({ status: event.target.value }); onToast(`Campaign status changed to ${event.target.value}.`); }}><option>Open</option><option>In review</option><option>Closed</option></select></label>
        </section>
        <section className="panel campaign-evidence">
          <div className="section-kicker">EVIDENCE TIMELINE</div><h2>Why the system grouped these posts</h2>
          <div className="evidence-timeline">{[campaign.firstSeen, 'Today, 09:49', 'Today, 10:02'].map((time, index) => <div className="timeline-item" key={`${time}-${index}`}><i/><span><small>{time}</small><b>{['First sample advertisement observed', 'Similar offer wording appeared in another sample', 'Shared entity candidates added for analyst review'][index]}</b><p>{['Synthetic source record created in the demo dataset.', 'Text similarity is illustrative and has not been independently verified.', 'A potential phone/domain/image overlap was included to demonstrate graph exploration.'][index]}</p></span></div>)}</div>
        </section>
        <section className="panel campaign-related">
          <div className="section-kicker">RELATED ADVERTISEMENTS</div><h2>Sample records in this case</h2>
          {related.map((alert) => <button className="related-ad-row" key={alert.id} onClick={() => { onSelectAlert(alert); onNavigate('Advertisement explorer'); }}><span className="related-ad-score">{alert.confidence}</span><span><b>{alert.id} · {alert.handle}</b><small>{alert.platform} · {alert.text}</small></span><RiskPill risk={alert.risk}/><Icon name="chevron" size={14}/></button>)}
        </section>
      </div>
      <aside className="campaign-case-aside">
        <section className="panel relationship-review"><div className="section-kicker">RELATIONSHIP REVIEW</div><h2>Evidence links</h2><p>Review each connection individually. Dismissing a link only updates this local demo record.</p>
          {[['Shared contact detail', 'Phone signal · masked sample value'], ['Related destination', 'Domain signal · synthetic candidate'], ['Image fingerprint', 'Visual similarity · illustrative match']].map(([label, detail], index) => {
            const key = `relation-${index}`;
            const state = record.relations?.[key] || 'Unreviewed';
            return <div className={`relationship-row ${state.toLowerCase().replace(' ', '-')}`} key={key}><span className="relation-indicator"><Icon name={state === 'Flagged' ? 'shield' : state === 'Dismissed' ? 'close' : 'network'} size={14}/></span><span><b>{label}</b><small>{detail}</small><em>{state}</em></span><div><button aria-label={`Flag ${label}`} title="Flag link" onClick={() => { update({ relations: { ...record.relations, [key]: state === 'Flagged' ? 'Unreviewed' : 'Flagged' } }); onToast(`${label} ${state === 'Flagged' ? 'flag removed' : 'flagged for review'}.`); }}><Icon name="shield" size={13}/></button><button aria-label={`Dismiss ${label}`} title="Dismiss link" onClick={() => { update({ relations: { ...record.relations, [key]: state === 'Dismissed' ? 'Unreviewed' : 'Dismissed' } }); onToast(`${label} ${state === 'Dismissed' ? 'restored' : 'dismissed'}.`); }}><Icon name="close" size={13}/></button></div></div>;
          })}
        </section>
        <section className="panel analyst-notes"><div className="section-kicker">ANALYST NOTES · LOCAL</div><h2>Case notes</h2><form onSubmit={addNote}><label className="form-label"><span className="sr-only">Add an analyst note</span><textarea name="note" rows="3" maxLength="1000" placeholder="Record a source-check or next step…" required/></label><button className="primary-action">Add note <Icon name="arrow" size={13}/></button></form>
          <div className="analyst-note-list">{(record.notes || []).map((note, index) => <article key={`${note.createdAt}-${index}`}><small>{note.createdAt}</small><p>{note.text}</p></article>)}{!record.notes?.length && <p className="muted-value">No analyst notes yet.</p>}</div>
        </section>
      </aside>
    </div>
    <WorkspaceNote icon="shield">All campaign records shown here are synthetic demo data. Shared signals are not proof of criminality or coordination.</WorkspaceNote>
  </section>;
}
