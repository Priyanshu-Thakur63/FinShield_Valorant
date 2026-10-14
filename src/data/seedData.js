export const alerts = [
  {
    id: 'ADV-2841', risk: 'critical', platform: 'Telegram', handle: '@quickcash_accounts',
    text: 'Verified bank accounts available. Full access, instant transfer enabled. DM for today’s rates.',
    time: '2 min ago', confidence: 98, initials: 'TG', color: 'telegram',
    tags: ['Bank account sale', 'Instant transfer'], phone: '+91 98765 4•••2', url: 't.me/quickcash_accounts',
    evidence: ['Explicit offer to sell verified accounts', '“Instant transfer” signals mule-account intent', 'Same copy found in 6 other posts'],
    cluster: 'CL-019 · 7 linked posts', amount: '₹8,000–₹25,000'
  },
  {
    id: 'ADV-2842', risk: 'high', platform: 'Telegram', handle: '@quickcash_accounts_2',
    text: 'Verified accounts with instant transfer access. Same-day delivery; message for details.',
    time: '5 min ago', confidence: 88, initials: 'TG', color: 'telegram',
    tags: ['Account access', 'Instant transfer'], phone: '+91 98765 4•••2', url: 'quickcash.example',
    evidence: ['Synthetic second post added to demonstrate an entity overlap', 'Shared masked contact value in the sample graph', 'Requires independent source verification'],
    cluster: 'CL-019 · 7 linked posts', amount: 'Not detected'
  },
  {
    id: 'ADV-2839', risk: 'high', platform: 'Instagram', handle: '@finserve_connect',
    text: 'Need a current account? We arrange business accounts with cheque book. No paperwork, 24h delivery.',
    time: '8 min ago', confidence: 91, initials: 'IG', color: 'instagram',
    tags: ['Current account', 'No paperwork'], phone: '+91 88220 1•••6', url: 'wa.me/91882201•••6',
    evidence: ['Account opening offered outside normal bank channels', '“No paperwork” is a high-risk indicator', 'Contact number appears in 3 flagged advertisements'],
    cluster: 'CL-014 · 4 linked posts', amount: '₹12,000'
  },
  {
    id: 'ADV-2837', risk: 'high', platform: 'Facebook', handle: 'Easy Finance Hub',
    text: 'Debit card with active netbanking. Sell your unused account and earn up to 15k today!',
    time: '14 min ago', confidence: 87, initials: 'f', color: 'facebook',
    tags: ['Debit card', 'Account recruitment'], phone: '+91 70118 6•••9', url: 'facebook.com/groups/easyfinance',
    evidence: ['Direct solicitation to sell personal bank accounts', 'Debit card plus netbanking credentials offered', 'Payment promise used to recruit account holders'],
    cluster: 'CL-011 · 3 linked posts', amount: 'Up to ₹15,000'
  },
  {
    id: 'ADV-2834', risk: 'medium', platform: 'X / Twitter', handle: '@digitalbiz_24',
    text: 'Open your zero-balance savings account online. Message us for a fast-track setup.',
    time: '21 min ago', confidence: 64, initials: '𝕏', color: 'x',
    tags: ['Savings account', 'Fast-track setup'], phone: 'Not detected', url: 'x.com/digitalbiz_24',
    evidence: ['Third-party account-opening assistance', 'No bank affiliation could be verified', 'No explicit sale or payment details detected'],
    cluster: 'No linked cluster', amount: 'Not detected'
  },
  {
    id: 'ADV-2831', risk: 'low', platform: 'Telegram', handle: '@loanhelp_india',
    text: 'Personal loan assistance for salaried employees. Apply with valid ID and income proof.',
    time: '36 min ago', confidence: 28, initials: 'TG', color: 'telegram',
    tags: ['Loan assistance'], phone: 'Not detected', url: 't.me/loanhelp_india',
    evidence: ['No sale of financial accounts detected', 'Standard identity checks mentioned', 'Low keyword and network risk'],
    cluster: 'No linked cluster', amount: 'Not detected'
  },
  {
    id: 'ADV-2829', risk: 'high', platform: 'Open web', handle: 'premium-card-market',
    text: 'Pre-activated credit and ATM cards available with linked account access. Encrypted payment accepted.',
    time: '52 min ago', confidence: 93, initials: '↗', color: 'web',
    tags: ['Credit card sale', 'Payment details'], phone: '+91 99870 2•••1', url: 'premium-card-market.example',
    evidence: ['Credit and ATM card sale explicitly advertised', 'Promotional image matches known card-sale templates', 'External payment and contact details detected'],
    cluster: 'No linked cluster', amount: '₹18,000'
  },
];

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
