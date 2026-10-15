import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const colors = { critical: '#f0817d', high: '#eeb96b', medium: '#e4d171', low: '#84c999' };

function DistributionTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip"><span>{payload[0].name}</span><b>{payload[0].value.toLocaleString()} <small>ads</small></b></div>;
}

export default function RiskDistribution({ alerts = [] }) {
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const distribution = ['critical', 'high', 'medium', 'low'].map((name) => ({
    name: `${name[0].toUpperCase()}${name.slice(1)} risk`,
    value: safeAlerts.filter((alert) => alert?.risk === name).length,
    color: colors[name],
  })).filter((item) => item.value > 0);
  const total = distribution.reduce((sum, item) => sum + item.value, 0);
  return (
    <div className="risk-distribution">
      <div className="risk-donut">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 78, height: 78 }}>
          <PieChart>
            <Pie data={distribution.length ? distribution : [{ name: 'None', value: 1, color: '#2a3138' }]} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="92%" paddingAngle={3} stroke="none" animationDuration={400}>
              {(distribution.length ? distribution : [{ name: 'None', color: '#2a3138' }]).map((item) => <Cell key={item.name} fill={item.color}/>)}
            </Pie>
            <Tooltip content={<DistributionTooltip/>}/>
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center"><b>{total}</b><span>TOTAL</span></div>
      </div>
      <div className="risk-legend">{distribution.map((item) => <span key={item.name}><i style={{ background: item.color }}/>{item.name}<b>{total > 0 ? Math.round((item.value / total) * 100) : 0}%</b></span>)}</div>
    </div>
  );
}
