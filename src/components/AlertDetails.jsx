import React from 'react';
import Icon from './Icon.jsx';
import { PlatformIcon, RiskPill } from './shared.jsx';

export default function AlertDetails({ alert, onInvestigate, onReview, onOpenSource, preferences, isReviewed }) {
  if (!alert) {
    return (
      <aside className="detail-panel">
        <div className="detail-topline"><span className="section-kicker">ALERT DETAILS</span></div>
        <p className="detail-summary" style={{ marginTop: '20px', color: '#889282' }}>Select an advertisement record to inspect live forensic evidence.</p>
      </aside>
    );
  }

  const maskedPhone = preferences.maskSensitiveData || !alert.phone.includes('•')
    ? alert.phone
    : 'Unavailable · source was masked';
  const confidenceLabel = alert.confidence >= 70 ? 'High risk assessment' : alert.confidence >= 45 ? 'Elevated threat probability' : 'Low threat probability';

  return (
    <aside className="detail-panel">
      <div className="detail-topline"><span className="section-kicker">ALERT DETAILS</span><button className="more-button" aria-label="Alert actions" onClick={onReview}><Icon name="more" /></button></div>
      <div className="detail-id-row"><span className="detail-id">{alert.id}</span><span className="detail-new"><i /> LIVE RECORD</span></div>
      <div className="detail-title-row"><h2>Suspicious<br />account offer</h2><RiskPill risk={alert.risk} /></div>
      <p className="detail-summary">Potential sale of financial accounts detected on {alert.platform}.</p>
      <div className="confidence-card"><div className="confidence-card-top"><span>AI RISK CONFIDENCE SCORE</span><span className={`confidence-score ${alert.risk}`}>{alert.confidence}<small>/100</small></span></div><div className="confidence-large-track"><i style={{ width: `${alert.confidence}%` }} /></div><div className="confidence-explainer">{confidenceLabel}<span>·</span> FinShield Threat Pipeline</div></div>
      <div className="detail-section"><div className="detail-section-heading"><span>DETECTION EVIDENCE</span><span className="evidence-count">{alert.evidence.length} signals</span></div><div className="evidence-list">{alert.evidence.map((item, index) => <div className="evidence-item" key={item}><span className={`evidence-check ${index === 0 ? 'strong' : ''}`}><Icon name="check" size={12} /></span><span>{item}</span></div>)}</div></div>
      <div className="detail-section ad-preview-section"><div className="detail-section-heading"><span>ORIGINAL ADVERTISEMENT</span><button className="external-button" aria-label="Open original advertisement" onClick={onOpenSource}><Icon name="external" size={14} /></button></div><div className="original-ad"><div className="original-ad-user"><PlatformIcon alert={alert} /><div><b>{alert.handle}</b><span>{alert.platform} · {alert.time}</span></div></div><p>“{alert.text}”</p><div className="ad-link">{alert.url}</div></div></div>
      <div className="detail-section"><div className="detail-section-heading"><span>EXTRACTED ENTITIES</span><span className="entity-private">SENSITIVE</span></div><div className="entity-row"><span>PHONE NUMBER</span><b>{maskedPhone}</b></div><div className="entity-row"><span>ASKING PRICE</span><b>{alert.amount}</b></div><div className="entity-row"><span>LINKED CAMPAIGN</span><b className={alert.cluster.startsWith('No') ? '' : 'linked-value'}>{alert.cluster}</b></div><div className="entity-row"><span>TIMESTAMP</span><b>{alert.time || alert.timestamp || 'Live record'}</b></div></div>
      <div className="detail-actions"><button className="primary-action" onClick={onInvestigate}>Open investigation <Icon name="arrow" size={16} /></button><button className={`secondary-action ${isReviewed ? 'review-active' : ''}`} aria-pressed={isReviewed} onClick={onReview}>{isReviewed ? 'Remove review flag' : 'Mark for review'}</button></div>
      <div className="disclaimer"><Icon name="shield" size={13} /><span>AI heuristic risk scoring. Verify source context before taking action.</span></div>
    </aside>
  );
}
