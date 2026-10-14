import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const colors = { critical: '#f0817d', high: '#eeb96b', medium: '#e4d171', low: '#84c999' };

function DistributionTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip"><span>{payload[0].name}</span><b>{payload[0].value.toLocaleString()} <small>ads</small></b></div>;
}

export default function RiskDistribution({ alerts }) {
  const distribution = ['critical', 'high', 'medium', 'low'].map((name) => ({
    name: `${name[0].toUpperCase()}${name.slice(1)} risk`,
    value: alerts.filter((alert) => alert.risk === name).length,
    color: colors[name],
  })).filter((item) => item.value > 0);
  const total = distribution.reduce((sum, item) => sum + item.value, 0);
  return (
    <div className="risk-distribution">
      <div className="risk-donut">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 78, height: 78 }}>
          <PieChart>
            <Pie data={distribution} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="92%" paddingAngle={3} stroke="none" animationDuration={400}>
              {distribution.map((item) => <Cell key={item.name} fill={item.color}/>)}
            </Pie>
            <Tooltip content={<DistributionTooltip/>}/>
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center"><b>{total}</b><span>SAMPLE</span></div>
      </div>
      <div className="risk-legend">{distribution.map((item) => <span key={item.name}><i style={{ background: item.color }}/>{item.name}<b>{Math.round(item.value / distribution.reduce((total, entry) => total + entry.value, 0) * 100)}%</b></span>)}</div>
    </div>
  );
}
