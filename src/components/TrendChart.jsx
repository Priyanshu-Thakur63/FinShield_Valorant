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
  return (
    <div className="chart-tooltip">
      <span>{label}</span>
      <b>{payload[0].value.toLocaleString()} <small>threats</small></b>
    </div>
  );
}

export default function TrendChart({ period, alerts = [] }) {
  const data = useMemo(() => {
    // If real alerts exist from database, compute actual distribution
    if (Array.isArray(alerts) && alerts.length > 0) {
      if (period === 'Last 24 hours') {
        const slots = ['12 AM', '2 AM', '4 AM', '6 AM', '8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM'];
        const counts = Array(slots.length).fill(0);
        
        for (const ad of alerts) {
          const dtStr = ad.timestamp || ad.created_at || ad.posted_at;
          const dt = dtStr ? new Date(dtStr) : null;
          if (dt && !isNaN(dt.getTime())) {
            const h = dt.getHours();
            const slotIndex = Math.min(slots.length - 1, Math.floor(h / 2));
            counts[slotIndex] += 1;
          } else {
            counts[counts.length - 1] += 1;
          }
        }
        return slots.map((label, index) => ({ label, ads: counts[index] }));
      }

      if (period === 'Last 7 days') {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const dayMap = { 0: 6, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 }; // JS getDay() 0=Sun
        const counts = Array(7).fill(0);

        for (const ad of alerts) {
          const dtStr = ad.timestamp || ad.created_at || ad.posted_at;
          const dt = dtStr ? new Date(dtStr) : null;
          if (dt && !isNaN(dt.getTime())) {
            const d = dt.getDay();
            const slot = dayMap[d] ?? 6;
            counts[slot] += 1;
          } else {
            counts[counts.length - 1] += 1;
          }
        }
        return days.map((label, index) => ({ label, ads: counts[index] }));
      }

      if (period === 'Last 30 days') {
        const buckets = ['1-5', '6-10', '11-15', '16-20', '21-25', '26-30'];
        const counts = Array(buckets.length).fill(0);
        for (const ad of alerts) {
          const dtStr = ad.timestamp || ad.created_at || ad.posted_at;
          const dt = dtStr ? new Date(dtStr) : null;
          if (dt && !isNaN(dt.getTime())) {
            const dayOfMonth = dt.getDate();
            const idx = Math.min(buckets.length - 1, Math.floor((dayOfMonth - 1) / 5));
            counts[idx] += 1;
          } else {
            counts[counts.length - 1] += 1;
          }
        }
        return buckets.map((label, index) => ({ label, ads: counts[index] }));
      }
    }

    // Default fallback
    const selectedPeriod = periods[period] ?? periods['Last 24 hours'];
    return selectedPeriod.labels.map((label, index) => ({ label, ads: selectedPeriod.values[index] }));
  }, [period, alerts]);

  return (
    <div className="recharts-trend w-full min-w-0" role="img" aria-label={`Threat activity over ${period.toLowerCase()}`}>
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 145 }}>
        <AreaChart data={data} margin={{ top: 8, right: 5, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="suspiciousAdFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d8fb72" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#d8fb72" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#293037" strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#7b848b', fontSize: 9 }} tickMargin={9} minTickGap={22} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#7b848b', fontSize: 9 }} tickMargin={8} tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value} width={37} allowDecimals={false} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#738353', strokeDasharray: '3 4' }} />
          <Area type="monotone" dataKey="ads" stroke="#d8fb72" strokeWidth={2} fill="url(#suspiciousAdFill)" activeDot={{ r: 4, fill: '#d8fb72', stroke: '#11151a', strokeWidth: 2 }} dot={false} animationDuration={450} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
