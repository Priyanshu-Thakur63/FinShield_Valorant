export function getDashboardStats(ads = [], cases = []) {
  const safeAds = Array.isArray(ads) ? ads : [];
  const safeCases = Array.isArray(cases) ? cases : [];
  const activeCases = safeCases.filter((item) => item?.status !== 'Closed');
  return {
    analyzed: safeAds.length,
    suspicious: safeAds.filter((item) => item?.risk && item.risk !== 'low').length,
    highRisk: safeAds.filter((item) => item?.risk === 'critical' || item?.risk === 'high').length,
    critical: safeAds.filter((item) => item?.risk === 'critical').length,
    campaigns: new Set(safeAds.map((item) => (item?.cluster || '').split(' · ')[0]).filter((id) => id && id !== 'No linked cluster')).size,
    indicators: safeAds.reduce((total, item) => total + (Array.isArray(item?.tags) ? item.tags.length : 0), 0),
    platforms: new Set(safeAds.map((item) => item?.platform).filter(Boolean)).size,
    openCases: activeCases.length,
  };
}
