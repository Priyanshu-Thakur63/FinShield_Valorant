import React from 'react';

const paths = {
  grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></>,
  scan: <><circle cx="11" cy="11" r="7.5"/><path d="m20 20-3.7-3.7M11 7v8M7 11h8"/></>,
  network: <><circle cx="12" cy="5" r="2.4"/><circle cx="5" cy="18" r="2.4"/><circle cx="19" cy="18" r="2.4"/><path d="m10.8 7.2-4.5 8.5m6.9-8.5 4.5 8.5M7.5 18h9"/></>,
  file: <><path d="M13.5 3.5H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10z"/><path d="M13 3.5V10h7M8 14h8m-8 4h6"/></>,
  shield: <><path d="M12 21s8-3.8 8-10V5l-8-3-8 3v6c0 6.2 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.6.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.6-.9l-1.7.7L6.1 16l1.4-1.1a7 7 0 0 1 0-1.8L6.1 12l1.4-2.4 1.7.7a8 8 0 0 1 1.6-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.6.9l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1-.1 1.9Z"/></>,
  arrow: <><path d="M5 12h14m-6-6 6 6-6 6"/></>,
  external: <><path d="M14 4h6v6m-10 4L20 4"/><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/></>,
  close: <><path d="m18 6-12 12M6 6l12 12"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  chevron: <path d="m9 18 6-6-6-6"/>,
  filter: <><path d="M4 7h16M7 12h10m-7 5h4"/><circle cx="8" cy="7" r="1.5" fill="currentColor"/><circle cx="15" cy="12" r="1.5" fill="currentColor"/></>,
  more: <><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></>,
  trend: <><path d="m3 17 6-6 4 4 8-9"/><path d="M15 6h6v6"/></>,
  chart: <><path d="M4 19V5m0 14h17"/><path d="m7 15 4-4 3 2 6-7"/><path d="M16 6h4v4"/></>,
  upload: <><path d="M12 16V4m-5 5 5-5 5 5"/><path d="M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5"/></>,
  download: <><path d="M12 4v12m-5-5 5 5 5-5"/><path d="M5 20h14"/></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
};

export default function Icon({ name, size = 18, strokeWidth = 1.7 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.grid}</svg>;
}
