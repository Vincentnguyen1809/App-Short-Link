import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const data = [
  { name: '01 Apr', clicks: 400, unique: 240 },
  { name: '02 Apr', clicks: 300, unique: 139 },
  { name: '03 Apr', clicks: 200, unique: 980 },
  { name: '04 Apr', clicks: 278, unique: 390 },
  { name: '05 Apr', clicks: 189, unique: 480 },
  { name: '06 Apr', clicks: 239, unique: 380 },
  { name: '07 Apr', clicks: 349, unique: 430 },
];

export default function AnalyticsChart() {
  return (
    <div className="h-[400px] w-full bg-[#1a1a1a] p-6 rounded-xl border border-[#262626]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Click Performance</h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-xs text-gray-400">Total Clicks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs text-gray-400">Unique Clicks</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#525252" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#525252" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#141414', border: '1px solid #262626', borderRadius: '8px' }}
            itemStyle={{ fontSize: '12px' }}
          />
          <Area 
            type="monotone" 
            dataKey="clicks" 
            stroke="#f97316" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorClicks)" 
          />
          <Area 
            type="monotone" 
            dataKey="unique" 
            stroke="#3b82f6" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorUnique)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
