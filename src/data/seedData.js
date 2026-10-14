export const alerts = [];

export const navItems = [
  { icon: 'grid', label: 'Overview' },
  { icon: 'scan', label: 'Advertisement analysis' },
  { icon: 'scan', label: 'Ad monitoring', badge: '7' },
  { icon: 'search', label: 'Advertisement explorer', badge: '7' },
  { icon: 'network', label: 'Campaign DNA', badge: '4' },
  { icon: 'network', label: 'Campaign clusters', badge: '4' },
  { icon: 'network', label: 'Campaign investigations' },
  { icon: 'chart', label: 'Analytics' },
  { icon: 'bell', label: 'Alerts center' },
  { icon: 'file', label: 'Investigations' },
  { icon: 'shield', label: 'Watchlists' },
  { icon: 'file', label: 'Reports' },
  { icon: 'settings', label: 'Settings' },
  { icon: 'external', label: 'Landing page' },
];

export const campaignClusters = [
  { id: 'CL-019', name: 'QuickCash account network', platform: 'Telegram', posts: 7, accounts: 4, risk: 'critical', confidence: 96, firstSeen: 'Today, 09:42', alertId: 'ADV-2841', pattern: 'Identical account-sale copy and shared contact details' },
  { id: 'CL-014', name: 'Finserve onboarding group', platform: 'Instagram + WhatsApp', posts: 4, accounts: 3, risk: 'high', confidence: 89, firstSeen: 'Today, 08:16', alertId: 'ADV-2839', pattern: 'Repeated “no paperwork” current-account offers' },
  { id: 'CL-011', name: 'Easy Finance recruitment', platform: 'Facebook', posts: 3, accounts: 2, risk: 'high', confidence: 84, firstSeen: 'Today, 07:51', alertId: 'ADV-2837', pattern: 'Shared phone number and account-holder recruitment' },
  { id: 'CL-008', name: 'FastTrack savings referrals', platform: 'X + Open web', posts: 5, accounts: 4, risk: 'medium', confidence: 68, firstSeen: 'Yesterday, 18:24', alertId: 'ADV-2834', pattern: 'Similar landing pages and account-opening language' },
];

export const initialCases = [
  { id: 'INV-1042', title: 'QuickCash account-sale network', alertId: 'ADV-2841', owner: 'A. Sharma', status: 'In progress', priority: 'Critical', updated: '2 min ago' },
  { id: 'INV-1041', title: 'Finserve current-account offers', alertId: 'ADV-2839', owner: 'Unassigned', status: 'Open', priority: 'High', updated: '18 min ago' },
  { id: 'INV-1038', title: 'Easy Finance account recruitment', alertId: 'ADV-2837', owner: 'R. Mehta', status: 'In progress', priority: 'High', updated: '1 hr ago' },
];

export const initialWatchlist = [
  { id: 'WL-201', value: '+91 98765 4•••2', type: 'Phone number', added: 'Today, 10:14', matches: 1 },
  { id: 'WL-198', value: 'quickcash_accounts', type: 'Social handle', added: 'Today, 09:51', matches: 1 },
  { id: 'WL-184', value: 'wa.me', type: 'Domain', added: 'Yesterday, 16:08', matches: 1 },
];

export const initialPreferences = { criticalAlerts: true, clusterSignals: true, maskSensitiveData: true };
