import React, { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { PageHeading, WorkspaceNote } from '../components/shared.jsx';

export default function SettingsPage({ preferences, onSavePreferences, workspaceSettings, onSaveWorkspaceSettings, onResetDemo, onToast }) {
  const [draftPreferences, setDraftPreferences] = useState(preferences);
  const [draftWorkspace, setDraftWorkspace] = useState(workspaceSettings);
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    setDraftPreferences(preferences);
    setDraftWorkspace(workspaceSettings);
    setSaved(true);
  }, [preferences, workspaceSettings]);

  function updatePreferences(key, value) {
    setDraftPreferences((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }
  function updateWorkspace(key, value) {
    setDraftWorkspace((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }
  function save(event) {
    event.preventDefault();
    onSavePreferences(draftPreferences);
    onSaveWorkspaceSettings(draftWorkspace);
    setSaved(true);
    onToast('Settings saved in this browser.');
  }
  function reset() {
    if (window.confirm('Reset local demo records, settings and analyst notes to their initial sample state?')) onResetDemo();
  }

  return <section className="workspace-page">
    <PageHeading eyebrow="WORKSPACE / LOCAL PREFERENCES" title="Workspace" mutedTitle="settings" description="Manage this browser’s demonstration preferences. No account credentials are stored."/>
    <form className="settings-page-form" onSubmit={save}>
      <section className="panel settings-page-card"><div className="settings-card-heading"><span className="settings-card-icon"><Icon name="grid" size={17}/></span><span><h2>Profile display</h2><small>Display-only workspace information</small></span></div><div className="settings-form-grid"><label className="form-label">Workspace name<input value={draftWorkspace.workspaceName} onChange={(event) => updateWorkspace('workspaceName', event.target.value)} maxLength={60}/></label><label className="form-label">Analyst display name<input value={draftWorkspace.analystName} onChange={(event) => updateWorkspace('analystName', event.target.value)} maxLength={60}/></label></div><p className="form-help">Profile values are local display preferences, not authentication details.</p></section>
      <section className="panel settings-page-card"><div className="settings-card-heading"><span className="settings-card-icon"><Icon name="settings" size={17}/></span><span><h2>Appearance & dashboard</h2><small>Customize the local workspace view</small></span></div><div className="settings-form-grid"><label className="form-label">Theme<select value={draftWorkspace.theme} onChange={(event) => updateWorkspace('theme', event.target.value)}><option value="dark">Dark</option><option value="contrast">Midnight contrast</option></select></label><label className="form-label">Table density<select value={draftWorkspace.tableDensity} onChange={(event) => updateWorkspace('tableDensity', event.target.value)}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label></div>
        <SettingToggle title="Show illustrative dashboard metrics" description="Keep synthetic KPI and trend examples visible." checked={draftWorkspace.showDemoMetrics} onChange={(value) => updateWorkspace('showDemoMetrics', value)}/>
        <SettingToggle title="Compact table rows" description="Use a denser display for advertisement records." checked={draftWorkspace.tableDensity === 'compact'} onChange={(value) => updateWorkspace('tableDensity', value ? 'compact' : 'comfortable')}/>
      </section>
      <section className="panel settings-page-card"><div className="settings-card-heading"><span className="settings-card-icon"><Icon name="bell" size={17}/></span><span><h2>Notifications & privacy</h2><small>Local display behavior for sample signals</small></span></div>
        <SettingToggle title="Critical-risk alerts" description="Show critical examples in the notification summary." checked={draftPreferences.criticalAlerts} onChange={(value) => updatePreferences('criticalAlerts', value)}/>
        <SettingToggle title="Potential campaign signals" description="Include sample relationship groupings in notifications." checked={draftPreferences.clusterSignals} onChange={(value) => updatePreferences('clusterSignals', value)}/>
        <SettingToggle title="Mask sensitive sample values" description="Display phone examples in their already-masked form." checked={draftPreferences.maskSensitiveData} onChange={(value) => updatePreferences('maskSensitiveData', value)}/>
        <SettingToggle title="Browser notification preference" description="Preference only; this demo does not request OS notification permission." checked={draftWorkspace.notificationsEnabled} onChange={(value) => updateWorkspace('notificationsEnabled', value)}/>
      </section>
      <div className="settings-page-actions"><button type="button" className="danger-action" onClick={reset}>Reset demo data</button><div><span className="settings-saved-state">{saved ? 'All changes saved' : 'Unsaved changes'}</span><button className="primary-action" type="submit">Save settings <Icon name="check" size={14}/></button></div></div>
    </form>
    <WorkspaceNote icon="shield">Preferences and demo records live in localStorage on this device only. This page does not create users, authenticate accounts, or store passwords.</WorkspaceNote>
  </section>;
}

function SettingToggle({ title, description, checked, onChange }) {
  return <label className="setting-toggle setting-page-toggle"><span><b>{title}</b><small>{description}</small></span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)}/><i/></label>;
}
