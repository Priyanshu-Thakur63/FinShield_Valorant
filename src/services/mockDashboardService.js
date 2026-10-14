export function getDashboardStats(ads, cases) {
  const activeCases = cases.filter((item) => item.status !== 'Closed');
  return {
    analyzed: ads.length,
    suspicious: ads.filter((item) => item.risk !== 'low').length,
    highRisk: ads.filter((item) => item.risk === 'critical' || item.risk === 'high').length,
    critical: ads.filter((item) => item.risk === 'critical').length,
    campaigns: new Set(ads.map((item) => item.cluster.split(' · ')[0]).filter((id) => id !== 'No linked cluster')).size,
    indicators: ads.reduce((total, item) => total + item.tags.length, 0),
    platforms: new Set(ads.map((item) => item.platform)).size,
    openCases: activeCases.length,
  };
}
