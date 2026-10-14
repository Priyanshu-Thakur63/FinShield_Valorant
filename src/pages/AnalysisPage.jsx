import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { PageHeading, RiskPill, WorkspaceNote } from '../components/shared.jsx';
import { analyzeAdvertisement } from '../services/mockAnalysisService.js';
import { extractTextFromImage } from '../services/ocrService.js';

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
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrExtractedText, setOcrExtractedText] = useState('');
  const fileInput = useRef(null);

  const relatedAlerts = useMemo(() => {
    if (!result) return [];
    const words = (value) => new Set((value.toLowerCase().match(/[a-z0-9]+/g) || []).filter((word) => word.length > 2 && !stopWords.has(word)));
    const queryWords = words(`${text} ${ocrExtractedText} ${sourceUrl}`);
    const ranked = alerts.map((alert) => {
      const adWords = words(`${alert.handle} ${alert.text} ${alert.tags.join(' ')} ${alert.url}`);
      const overlap = [...queryWords].filter((word) => adWords.has(word)).length;
      return { alert, overlap };
    }).filter((item) => item.overlap > 0).sort((left, right) => right.overlap - left.overlap || right.alert.confidence - left.alert.confidence);
    return (ranked.length ? ranked.map((item) => item.alert) : alerts.filter((alert) => alert.risk !== 'low')).slice(0, 2);
  }, [alerts, result, sourceUrl, text, ocrExtractedText]);

  useEffect(() => {
    if (!image) {
      setPreview('');
      setOcrExtractedText('');
      return undefined;
    }
    const objectUrl = URL.createObjectURL(image);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  async function handleImageChange(event) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      event.target.value = '';
      onToast('Choose a supported image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      event.target.value = '';
      onToast('Choose an image smaller than 10 MB.');
      return;
    }

    setImage(file);
    setOcrLoading(true);
    onToast('Running OCR text extraction via OCR.space API…');

    try {
      const ocrResult = await extractTextFromImage(file);
      if (ocrResult.rawText) {
        setOcrExtractedText(ocrResult.rawText);
        onToast('OCR text successfully extracted!');
      } else {
        onToast('Image processed, but no readable text detected.');
      }
    } catch (err) {
      console.error('OCR Extraction error:', err);
      onToast(`OCR Warning: ${err.message || 'Could not parse image text'}`);
    } finally {
      setOcrLoading(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (!text.trim() && !ocrExtractedText.trim()) {
      onToast('Enter advertisement text or attach an image with text to analyze.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const analysis = await analyzeAdvertisement({
        text,
        platform,
        sourceUrl,
        ocrText: ocrExtractedText,
      });
      setResult(analysis);
    } catch (error) {
      console.error('Unable to complete advertisement analysis.', error);
      onToast('The analysis could not be completed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function highlightPhrases(content, phrases) {
    if (!content) return null;
    const pattern = phrases.length ? new RegExp(`(${phrases.map((phrase) => phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi') : null;
    if (!pattern) return content;
    return content.split(pattern).map((part, index) => phrases.some((phrase) => phrase.toLowerCase() === part.toLowerCase())
      ? <mark key={`${part}-${index}`}>{part}</mark>
      : part);
  }

  return <section className="workspace-page">
    <PageHeading eyebrow="INTELLIGENCE TOOLS / AI SCANNER" title="Advertisement" mutedTitle="analysis & OCR" description="Scan text, URLs, and banner screenshots with live OCR to detect mule accounts and illicit financial operations."/>
    <div className="analysis-layout">
      <form className="panel analysis-form" onSubmit={submit}>
        <div className="section-kicker">ANALYSIS INPUT</div>
        <h2>Inspect an advertisement</h2>
        <p className="analysis-intro">Analyze social chatter or upload banner images to extract OCR text and detect mule account networks.</p>
        <label className="form-label">Advertisement text<textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste publicly available advertisement text (or leave blank if uploading an image)…" maxLength={5000} rows={5} aria-label="Advertisement text"/></label>
        <div className="analysis-fields">
          <label className="form-label">Source platform<select value={platform} onChange={(event) => setPlatform(event.target.value)}>{['Telegram', 'Instagram', 'Facebook', 'X / Twitter', 'Open web', 'Other'].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="form-label">Source URL <input type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://example.com/post"/></label>
        </div>
        <div className="upload-zone">
          <input ref={fileInput} id="analysis-image" type="file" accept="image/*" aria-label="Upload advertisement image" onChange={handleImageChange}/>
          <label htmlFor="analysis-image">
            <Icon name="upload" size={17}/>
            <span>
              <b>Attach an advertisement image</b>
              <small>Live OCR.space integration · extracts text, phone & UPI from image</small>
            </span>
          </label>
          {ocrLoading && (
            <div style={{ marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--accent, #6366f1)' }}>
              <span className="loading-spinner" /> <b>Extracting text from image via OCR API…</b>
            </div>
          )}
          {image && <div className="image-preview">{preview && <img src={preview} alt="Uploaded advertisement preview"/>}<span>{image.name}</span><button type="button" className="remove-watch" onClick={() => { setImage(null); setOcrExtractedText(''); if (fileInput.current) fileInput.current.value = ''; }}>Remove</button></div>}
        </div>

        {ocrExtractedText && (
          <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '6px', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#818cf8' }}>⚡ OCR EXTRACTED TEXT</span>
              <button type="button" style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem' }} onClick={() => setText((prev) => prev ? `${prev}\n\n${ocrExtractedText}` : ocrExtractedText)}>Append to Input ↗</button>
            </div>
            <pre style={{ margin: 0, fontSize: '0.8rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--text-primary, #f8fafc)', maxHeight: '120px', overflowY: 'auto' }}>{ocrExtractedText}</pre>
          </div>
        )}

        <div className="analysis-actions"><button type="button" className="secondary-action" onClick={() => { setText(exampleText); setPlatform('Telegram'); setSourceUrl(''); setResult(null); setImage(null); setOcrExtractedText(''); }}>Load example</button><button type="submit" className="primary-action" disabled={loading || ocrLoading}>{loading ? <><span className="loading-spinner"/> Analyzing threat…</> : <>Run threat analysis <Icon name="arrow" size={14}/></>}</button></div>
      </form>
      <section className="panel analysis-result">
        {!result && !loading ? <div className="analysis-empty"><div className="analysis-empty-icon"><Icon name="scan" size={23}/></div><h2>Analysis results appear here</h2><p>Submit text or upload an ad screenshot to view risk score, OCR findings, extracted indicators, and matched phrases.</p><span>LIVE OCR CONNECTED (OCR.SPACE)</span></div> : null}
        {loading && <div className="analysis-empty" role="status"><span className="loading-spinner large-spinner"/><h2>Analyzing financial risk</h2><p>Parsing text, OCR payload, and running threat pattern matching…</p></div>}
        {result && <div className="result-content">
          <div className="section-kicker">INTELLIGENCE SCAN RESULT</div><div className="result-score-row"><div><span className="result-label">THREAT RISK SCORE</span><b className={`result-score ${result.risk.toLowerCase()}`}>{result.score}<small>/100</small></b></div><RiskPill risk={result.risk}/></div>
          <div className="result-meter"><i style={{ width: `${result.score}%` }}/></div>
          <p className="result-explanation">{result.explanation}</p>
          {result.ocrText && <div className="result-block"><div className="detail-section-heading">OCR SCREENSHOT TEXT</div><p className="highlighted-copy">{highlightPhrases(result.ocrText, result.phrases)}</p></div>}
          {text && <div className="result-block"><div className="detail-section-heading">INPUT TEXT CONTEXT <span className="evidence-count">{result.phrases.length} phrase matches</span></div><p className="highlighted-copy">{highlightPhrases(text, result.phrases)}</p></div>}
          <div className="result-block"><div className="detail-section-heading">EXTRACTED ENTITIES & INDICATORS</div><div className="extracted-grid">
            {[
              ['Phone numbers', result.phones],
              ['URLs / Links', result.urls],
              ['UPI Handles', result.upiIds],
            ].map(([label, values]) => <div key={label}><small>{label}</small>{values.length ? values.map((value) => <code key={value}>{value}</code>) : <span className="muted-value">None detected</span>}</div>)}
          </div></div>
          <div className="result-block"><div className="detail-section-heading">RELATED DETECTIONS & CAMPAIGNS</div><p className="related-demo">Correlated records sharing contact channels, payment vectors, or mule account language.</p><div className="analysis-related-list">{relatedAlerts.map((alert) => <button key={alert.id} onClick={() => { onSelectAlert(alert); onNavigate('Advertisement explorer'); }}><span>{alert.id} · {alert.platform}</span><RiskPill risk={alert.risk}/><Icon name="chevron" size={13}/></button>)}</div></div>
        </div>}
      </section>
    </div>
    <WorkspaceNote icon="shield">Live OCR powered by OCR.space API. Risk scoring and entity correlation triage potential mule accounts and illicit financial promotions.</WorkspaceNote>
  </section>;
}

