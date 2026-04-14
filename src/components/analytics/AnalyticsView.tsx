import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { Globe, Monitor, Smartphone, Compass, RefreshCw, Target, TrendingUp } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import WorldMap from './WorldMap';

interface AnalyticsData {
  geos: any[];
  cities: any[];
  devices: any[];
  oss: any[];
  browsers: any[];
  referrers: any[];
  topLinks: any[];
  totalClicks: number;
  conversions?: {
    total: number;
    rate: string;
    byType: any[];
  };
}

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#64748b'];

export default function AnalyticsView({ dateRange }: { dateRange?: { start: string, end: string } }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (dateRange?.start) params.append('start', dateRange.start);
    if (dateRange?.end) params.append('end', dateRange.end);

    fetch(`/api/analytics/detailed?${params.toString()}`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch analytics:', err);
        setLoading(false);
      });
  }, [dateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const geoChartData = (data.geos || []).map(g => ({ name: g.country || 'Unknown', value: g._count?._all || 0 }));
  const browserChartData = (data.browsers || []).map(b => ({ name: b.browser || 'Unknown', value: b._count?._all || 0 }));
  const deviceChartData = (data.devices || []).map(d => ({ 
    label: d.device === 'mobile' ? 'Mobile' : d.device === 'tablet' ? 'Tablet' : 'Desktop', 
    value: d._count?._all || 0,
    icon: d.device === 'mobile' ? Smartphone : Monitor,
    color: d.device === 'mobile' ? 'text-orange-500' : d.device === 'tablet' ? 'text-green-500' : 'text-blue-500'
  }));
  const totalDevices = deviceChartData.reduce((acc, d) => acc + d.value, 0);

  const osChartData = (data.oss || []).map(o => ({ name: o.os || 'Unknown', value: o._count?._all || 0 }));
  const cityChartData = (data.cities || []).map(c => ({ name: c.city || 'Unknown', value: c._count?._all || 0 }));
  const topLinksData = (data.topLinks || []).map(l => ({ name: l.title || l.slug, value: l._count?._all || 0 }));

  return (
    <div className="space-y-8 pb-20">
      {/* Conversion Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#262626] flex items-center gap-4">
          <div className="p-3 bg-orange-500/10 rounded-xl">
            <TrendingUp className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Clicks</p>
            <h4 className="text-2xl font-bold text-white">{data.totalClicks || 0}</h4>
          </div>
        </div>
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#262626] flex items-center gap-4">
          <div className="p-3 bg-green-500/10 rounded-xl">
            <Target className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Conversions</p>
            <h4 className="text-2xl font-bold text-white">{data.conversions?.total || 0}</h4>
          </div>
        </div>
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#262626] flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl">
            <TrendingUp className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Conv. Rate</p>
            <h4 className="text-2xl font-bold text-white">{data.conversions?.rate || '0.00'}%</h4>
          </div>
        </div>
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#262626] flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-xl">
            <Globe className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Countries</p>
            <h4 className="text-2xl font-bold text-white">{geoChartData.length}</h4>
          </div>
        </div>
      </div>

      {/* World Map */}
      <WorldMap data={geoChartData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top GEOs */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#262626]">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-white">Top Geographic Locations</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={geoChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  width={80}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#141414', border: '1px solid #262626', borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Cities */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#262626]">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-white">Top Cities</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  width={80}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#141414', border: '1px solid #262626', borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Links */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#262626]">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-white">Top Performing Links</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topLinksData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  width={120}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#141414', border: '1px solid #262626', borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Browser Distribution */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#262626]">
          <div className="flex items-center gap-3 mb-6">
            <Compass className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-white">Browser Distribution</h3>
          </div>
          <div className="h-[300px] flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={browserChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {browserChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141414', border: '1px solid #262626', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 pr-8">
              {browserChartData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-gray-400">{item.name}</span>
                  <span className="text-xs text-white font-mono ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Device Types */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#262626] lg:col-span-1">
          <div className="flex items-center gap-3 mb-8">
            <Smartphone className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-white">Device Types</h3>
          </div>
          <div className="space-y-8">
            {deviceChartData.map((item) => (
              <div key={item.label} className="flex items-center gap-4">
                <div className={cn("p-3 rounded-xl bg-white/5", item.color)}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-white">{item.label}</span>
                    <span className="text-sm font-mono text-gray-400">{totalDevices > 0 ? Math.round((item.value / totalDevices) * 100) : 0}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#262626] rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full", item.color.replace('text-', 'bg-'))} 
                      style={{ width: `${totalDevices > 0 ? (item.value / totalDevices) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* OS Distribution */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#262626] lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <Monitor className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-white">Operating Systems</h3>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={osChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141414', border: '1px solid #262626', borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
