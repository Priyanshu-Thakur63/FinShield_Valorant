import { alerts, campaignClusters } from '../data/seedData.js';

export const campaignGraph = {
  nodes: [
    { id: 'campaign-019', type: 'campaign', position: { x: 390, y: 200 }, data: { label: 'Potential campaign · CL-019', detail: '7 linked posts · Telegram' } },
    { id: 'ad-2841', type: 'ad', position: { x: 80, y: 70 }, data: { alertId: 'ADV-2841', label: 'ADV-2841 · Telegram', detail: 'Critical · confidence score 98/100' } },
    { id: 'ad-2842', type: 'ad', position: { x: 80, y: 315 }, data: { alertId: 'ADV-2842', label: 'ADV-2842 · Telegram', detail: 'High · confidence score 88/100' } },
    { id: 'phone', type: 'phone', position: { x: 360, y: 40 }, data: { label: 'Shared phone', detail: '+91 98765 4•••2' } },
    { id: 'url', type: 'url', position: { x: 695, y: 65 }, data: { label: 'Shared domain', detail: 'quickcash.example' } },
    { id: 'upi', type: 'upi', position: { x: 690, y: 300 }, data: { label: 'Payment ID', detail: 'quickcash@upi' } },
    { id: 'fingerprint', type: 'image', position: { x: 390, y: 395 }, data: { label: 'Image fingerprint', detail: 'sha256: 8f2a…1c9e' } },
  ],
  edges: [
    { id: 'e-ad-campaign-1', source: 'ad-2841', target: 'campaign-019', label: 'grouped in', animated: true },
    { id: 'e-ad-campaign-2', source: 'ad-2842', target: 'campaign-019', label: 'shared contact' },
    { id: 'e-campaign-phone', source: 'campaign-019', target: 'phone', label: 'contact overlap' },
    { id: 'e-campaign-url', source: 'campaign-019', target: 'url', label: 'shared link' },
    { id: 'e-campaign-upi', source: 'campaign-019', target: 'upi', label: 'payment detail' },
    { id: 'e-campaign-image', source: 'campaign-019', target: 'fingerprint', label: 'visual similarity' },
  ],
};

export function getCampaignById(id) {
  return campaignClusters.find((campaign) => campaign.id === id) || campaignClusters[0];
}

export function getRelatedAds(campaign) {
  const relatedIds = campaign.id === 'CL-019'
    ? ['ADV-2841', 'ADV-2842']
    : [campaign.alertId];
  return alerts.filter((alert) => relatedIds.includes(alert.id));
}
