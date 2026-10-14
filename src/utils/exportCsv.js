import { downloadFile } from './downloadFile.js';

export function exportCsv(rows, columns, filename) {
  if (!rows.length) return false;
  const escapeCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const content = [
    columns.map((column) => escapeCell(column.label)).join(','),
    ...rows.map((row) => columns.map((column) => escapeCell(column.value(row))).join(',')),
  ].join('\r\n');
  downloadFile(filename, content, 'text/csv;charset=utf-8');
  return true;
}

export function exportAlerts(rows) {
  return exportCsv(rows, [
    { label: 'Alert ID', value: (row) => row.id },
    { label: 'Platform', value: (row) => row.platform },
    { label: 'Handle', value: (row) => row.handle },
    { label: 'Risk', value: (row) => row.risk },
    { label: 'Confidence score', value: (row) => `${row.confidence}/100` },
    { label: 'Detected', value: (row) => row.time },
    { label: 'Indicators', value: (row) => row.tags.join('; ') },
    { label: 'URL', value: (row) => row.url },
  ], 'sentinel-ad-monitoring.csv');
}

export function exportCases(rows) {
  return exportCsv(rows, [
    { label: 'Case ID', value: (row) => row.id },
    { label: 'Title', value: (row) => row.title },
    { label: 'Alert ID', value: (row) => row.alertId },
    { label: 'Priority', value: (row) => row.priority },
    { label: 'Owner', value: (row) => row.owner },
    { label: 'Status', value: (row) => row.status },
    { label: 'Updated', value: (row) => row.updated },
  ], 'sentinel-investigations.csv');
}

export function exportWatchlist(rows) {
  return exportCsv(rows, [
    { label: 'Indicator ID', value: (row) => row.id },
    { label: 'Value', value: (row) => row.value },
    { label: 'Type', value: (row) => row.type },
    { label: 'Added', value: (row) => row.added },
    { label: 'Matches', value: (row) => row.matches },
  ], 'sentinel-watchlist.csv');
}
