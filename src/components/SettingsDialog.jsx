import React, { useState } from 'react';
import Icon from './Icon.jsx';
import { Modal } from './shared.jsx';

const options = [
  ['criticalAlerts', 'Critical-risk alerts', 'Highlight critical advertisements in the review queue.'],
  ['clusterSignals', 'Cluster notifications', 'Show when new advertisements link to a coordinated cluster.'],
  ['maskSensitiveData', 'Mask sensitive identifiers', 'Keep phone numbers and payment details partially hidden.'],
];

export default function SettingsDialog({ preferences, onClose, onSave }) {
  const [draft, setDraft] = useState(preferences);
  return <Modal title="Settings" kicker="WORKSPACE PREFERENCES" description="Configure analyst-facing alert and privacy preferences for this session." onClose={onClose} hideActions>
    {options.map(([key, title, description]) => <label className="setting-toggle" key={key}><span><b>{title}</b><small>{description}</small></span><input type="checkbox" checked={draft[key]} onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.checked }))}/><i /></label>)}
    <div className="modal-actions settings-actions"><button className="secondary-action" onClick={onClose}>Cancel</button><button className="primary-action" onClick={() => onSave(draft)}>Save preferences <Icon name="check" size={14}/></button></div>
  </Modal>;
}
