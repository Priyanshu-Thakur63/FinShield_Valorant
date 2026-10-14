import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const periods = {
  'Last 24 hours': {
    labels: ['12 AM', '2 AM', '4 AM', '6 AM', '8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM'],
    values: [38, 45, 39, 57, 51, 68, 61, 82, 75, 101, 92, 113],
  },
  'Last 7 days': {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [1880, 2160, 1940, 2520, 2360, 2910, 2847],
  },
  'Last 30 days': {
    labels: ['1', '5', '10', '15', '20', '25', '30'],
    values: [13200, 15900, 14800, 17700, 19300, 21800, 23140],
  },
};

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip"><span>{label}</span><b>{payload[0].value.toLocaleString()} <small>ads</small></b></div>;
}

export default function TrendChart({ period }) {
  const data = useMemo(() => {
    const selectedPeriod = periods[period] ?? periods['Last 24 hours'];
    return selectedPeriod.labels.map((label, index) => ({ label, ads: selectedPeriod.values[index] }));
  }, [period]);

  return (
    <div className="recharts-trend w-full min-w-0" role="img" aria-label={`Suspicious advertisement activity over ${period.toLowerCase()}`}>
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 145 }}>
        <AreaChart data={data} margin={{ top: 8, right: 5, left: -18, bottom: 0 }}>
          <defs><linearGradient id="suspiciousAdFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d8fb72" stopOpacity={0.23}/><stop offset="95%" stopColor="#d8fb72" stopOpacity={0}/></linearGradient></defs>
          <CartesianGrid stroke="#293037" strokeDasharray="3 5" vertical={false}/>
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#7b848b', fontSize: 9 }} tickMargin={9} minTickGap={22}/>
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#7b848b', fontSize: 9 }} tickMargin={8} tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value} width={37}/>
          <Tooltip content={<ChartTooltip/>} cursor={{ stroke: '#738353', strokeDasharray: '3 4' }}/>
          <Area type="monotone" dataKey="ads" stroke="#d8fb72" strokeWidth={2} fill="url(#suspiciousAdFill)" activeDot={{ r: 4, fill: '#d8fb72', stroke: '#11151a', strokeWidth: 2 }} dot={false} animationDuration={450}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
