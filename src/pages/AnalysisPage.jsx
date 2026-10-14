import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { PageHeading, RiskPill, WorkspaceNote } from '../components/shared.jsx';
import { analyzeAdvertisement } from '../services/mockAnalysisService.js';

const exampleText = 'Verified bank accounts available. Full access, instant transfer enabled. Message today. quickcash@upi';
const stopWords = new Set(['the', 'and', 'for', 'with', 'from', 'this', 'that', 'your', 'today', 'available']);

export default function AnalysisPage({ onToast, alerts, onSelectAlert, onNavigate }) {
  const [text, setText] = useState('');
  const [platform, setPlatform] = useState('Telegram');
  const [sourceUrl, setSourceUrl] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInput = useRef(null);
  const relatedAlerts = useMemo(() => {
    if (!result) return [];
    const words = (value) => new Set((value.toLowerCase().match(/[a-z0-9]+/g) || []).filter((word) => word.length > 2 && !stopWords.has(word)));
    const queryWords = words(`${text} ${sourceUrl}`);
    const ranked = alerts.map((alert) => {
      const adWords = words(`${alert.handle} ${alert.text} ${alert.tags.join(' ')} ${alert.url}`);
      const overlap = [...queryWords].filter((word) => adWords.has(word)).length;
      return { alert, overlap };
    }).filter((item) => item.overlap > 0).sort((left, right) => right.overlap - left.overlap || right.alert.confidence - left.alert.confidence);
    return (ranked.length ? ranked.map((item) => item.alert) : alerts.filter((alert) => alert.risk !== 'low')).slice(0, 2);
  }, [alerts, result, sourceUrl, text]);

  useEffect(() => {
    if (!image) {
      setPreview('');
      return undefined;
    }
    const objectUrl = URL.createObjectURL(image);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  async function submit(event) {
    event.preventDefault();
    if (!text.trim()) {
      onToast('Enter advertisement text to run a demo analysis.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      setResult(await analyzeAdvertisement({ text, platform, sourceUrl }));
    } catch (error) {
      console.error('Unable to simulate advertisement analysis.', error);
      onToast('The demo analysis could not be completed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function highlightPhrases(content, phrases) {
    const pattern = phrases.length ? new RegExp(`(${phrases.map((phrase) => phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi') : null;
    if (!pattern) return content;
    return content.split(pattern).map((part, index) => phrases.some((phrase) => phrase.toLowerCase() === part.toLowerCase())
      ? <mark key={`${part}-${index}`}>{part}</mark>
      : part);
  }

  return <section className="workspace-page">
    <PageHeading eyebrow="INTELLIGENCE TOOLS / SIMULATED ANALYSIS" title="Advertisement" mutedTitle="analysis" description="Submit public advertisement content to see a transparent, rules-based demonstration."/>
    <div className="analysis-layout">
      <form className="panel analysis-form" onSubmit={submit}>
        <div className="section-kicker">ANALYSIS INPUT</div>
        <h2>Inspect an advertisement</h2>
        <p className="analysis-intro">Only use content you are permitted to review. This demo does not upload data to a server.</p>
        <label className="form-label">Advertisement text<textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste publicly available advertisement text…" maxLength={5000} rows={7} required aria-label="Advertisement text"/></label>
        <div className="analysis-fields">
          <label className="form-label">Source platform<select value={platform} onChange={(event) => setPlatform(event.target.value)}>{['Telegram', 'Instagram', 'Facebook', 'X / Twitter', 'Open web', 'Other'].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="form-label">Source URL <input type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://example.com/post"/></label>
        </div>
        <div className="upload-zone">
          <input ref={fileInput} id="analysis-image" type="file" accept="image/*" aria-label="Upload advertisement image" onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            if (file && !file.type.startsWith('image/')) {
              event.target.value = '';
              onToast('Choose a supported image file.');
              return;
            }
            if (file && file.size > 10 * 1024 * 1024) {
              event.target.value = '';
              onToast('Choose an image smaller than 10 MB.');
              return;
            }
            setImage(file);
          }}/>
          <label htmlFor="analysis-image"><Icon name="upload" size={17}/><span><b>Attach an advertisement image</b><small>Images stay in this browser · up to 10 MB</small></span></label>
          {image && <div className="image-preview">{preview && <img src={preview} alt="Uploaded advertisement preview"/>}<span>{image.name}</span><button type="button" className="remove-watch" onClick={() => { setImage(null); if (fileInput.current) fileInput.current.value = ''; }}>Remove</button></div>}
        </div>
        <div className="analysis-actions"><button type="button" className="secondary-action" onClick={() => { setText(exampleText); setPlatform('Telegram'); setSourceUrl(''); setResult(null); }}>Load example</button><button type="submit" className="primary-action" disabled={loading}>{loading ? <><span className="loading-spinner"/> Analyzing sample…</> : <>Run demo analysis <Icon name="arrow" size={14}/></>}</button></div>
      </form>
      <section className="panel analysis-result">
        {!result && !loading ? <div className="analysis-empty"><div className="analysis-empty-icon"><Icon name="scan" size={23}/></div><h2>Analysis results appear here</h2><p>Submit text to view a simulated risk score, matched phrases, extracted indicators, and contextual notes.</p><span>NO LIVE AI OR PLATFORM CONNECTION</span></div> : null}
        {loading && <div className="analysis-empty" role="status"><span className="loading-spinner large-spinner"/><h2>Reviewing sample content</h2><p>Applying the local demonstration ruleset…</p></div>}
        {result && <div className="result-content">
          <div className="section-kicker">SIMULATED FRONTEND RESULT</div><div className="result-score-row"><div><span className="result-label">DEMO RISK SCORE</span><b className={`result-score ${result.risk.toLowerCase()}`}>{result.score}<small>/100</small></b></div><RiskPill risk={result.risk}/></div>
          <div className="result-meter"><i style={{ width: `${result.score}%` }}/></div>
          <p className="result-explanation">{result.explanation}</p>
          {image && <p className="analysis-image-note">The attached image is shown for preview only; this frontend demo does not analyze image content.</p>}
          <div className="result-block"><div className="detail-section-heading">TEXT CONTEXT <span className="evidence-count">{result.phrases.length} phrase matches</span></div><p className="highlighted-copy">{highlightPhrases(text, result.phrases)}</p></div>
          <div className="result-block"><div className="detail-section-heading">EXTRACTED INDICATORS</div><div className="extracted-grid">
            {[
              ['Phone numbers', result.phones],
              ['URLs', result.urls],
              ['UPI IDs', result.upiIds],
            ].map(([label, values]) => <div key={label}><small>{label}</small>{values.length ? values.map((value) => <code key={value}>{value}</code>) : <span className="muted-value">None detected</span>}</div>)}
          </div></div>
          <div className="result-block"><div className="detail-section-heading">RELATED SAMPLE ADVERTISEMENTS</div><p className="related-demo">These records are ranked by simple text overlap in the local sample set. A match does not establish a relationship.</p><div className="analysis-related-list">{relatedAlerts.map((alert) => <button key={alert.id} onClick={() => { onSelectAlert(alert); onNavigate('Advertisement explorer'); }}><span>{alert.id} · {alert.platform}</span><RiskPill risk={alert.risk}/><Icon name="chevron" size={13}/></button>)}</div></div>
        </div>}
      </section>
    </div>
    <WorkspaceNote icon="shield">Results are generated by a small local ruleset for demonstration only. They are not AI predictions, verified findings, or evidence of wrongdoing.</WorkspaceNote>
  </section>;
}
