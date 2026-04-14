import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChevronDown, Info, ArrowRight, Globe, Monitor, Smartphone, Share2, Hash, Layers, Link2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import WorldMap from '../analytics/WorldMap';

interface TopWidgetsProps {
  data: any;
  loading: boolean;
}

const COLORS = ['#10b981', '#34d399', '#3b82f6', '#60a5fa', '#8b5cf6', '#a78bfa', '#ec4899'];

interface StatCardProps {
  title: string;
  icon?: React.ReactNode;
  items: { name: string; value: number; icon?: string }[];
  total: number;
  className?: string;
}

function StatCard({ title, icon, items, total, className }: StatCardProps) {
  return (
    <div className={cn("bg-[#1a1a1a] p-6 rounded-xl border border-[#262626]", className)}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-xl font-semibold text-white">{title}</h3>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <span className="text-sm">Clicks</span>
          <Info className="w-4 h-4" />
        </div>
      </div>

      <div className="space-y-6">
        {items.map((item, i) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <div key={item.name + i}>
              <div className="flex justify-between text-sm mb-2">
                <div className="flex items-center gap-2">
                  {item.icon && <span className="text-lg">{item.icon}</span>}
                  <span className="text-gray-300 font-medium truncate max-w-[150px]">{item.name}</span>
                </div>
                <span className="text-white font-mono">{item.value}</span>
              </div>
              <div className="w-full h-1.5 bg-[#262626] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full" 
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="py-10 text-center text-gray-500 text-sm">No data available</div>
        )}
      </div>

      <button className="mt-10 w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-white transition-colors group">
        DETAILS
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}

export default function TopWidgets({ data, loading }: TopWidgetsProps) {
  const [metric, setMetric] = useState('countries');

  if (loading || !data) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-[400px] bg-[#1a1a1a] rounded-xl border border-[#262626]" />
          <div className="h-[400px] bg-[#1a1a1a] rounded-xl border border-[#262626]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-[350px] bg-[#1a1a1a] rounded-xl border border-[#262626]" />
          ))}
        </div>
      </div>
    );
  }

  const getChartData = () => {
    switch (metric) {
      case 'countries': return (data.geos || []).map((g: any) => ({ name: g.country || 'Unknown', value: g._count?._all || 0 }));
      case 'cities': return (data.cities || []).map((c: any) => ({ name: c.city || 'Unknown', value: c._count?._all || 0 }));
      case 'links': return (data.topLinks || []).map((l: any) => ({ name: l.title || l.slug, value: l._count?._all || 0 }));
      case 'browsers': return (data.browsers || []).map((b: any) => ({ name: b.browser || 'Unknown', value: b._count?._all || 0 }));
      case 'oss': return (data.oss || []).map((o: any) => ({ name: o.os || 'Unknown', value: o._count?._all || 0 }));
      case 'referrers': return (data.referrers || []).map((r: any) => ({ name: r.referrer || 'Direct', value: r._count?._all || 0 }));
      case 'conversions': return [
        { name: 'Conversions', value: data.conversions?.total || 0 },
        { name: 'Remaining Clicks', value: Math.max(0, (data.totalClicks || 0) - (data.conversions?.total || 0)) }
      ];
      default: return [];
    }
  };

  const chartData = getChartData();
  const totalClicksChart = chartData.reduce((acc: number, curr: any) => acc + curr.value, 0);

  return (
    <div className="space-y-8">
      {/* Row 1: Top Chart & Top Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Chart */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#262626] relative">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-semibold text-white">Top chart</h3>
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-[#141414] border border-[#262626] rounded-lg text-sm text-gray-300 hover:border-orange-500 transition-colors">
                Top {metric}
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-[#141414] border border-[#262626] rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                {['countries', 'cities', 'links', 'browsers', 'oss', 'referrers', 'conversions'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMetric(m)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 first:rounded-t-xl last:rounded-b-xl"
                  >
                    Top {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={95}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141414', border: '1px solid #262626', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-gray-400 text-sm font-medium">Total clicks</span>
              <span className="text-4xl font-bold text-white mt-1">{data.totalClicks || 0}</span>
              {chartData.length > 0 && (
                <span className="text-emerald-500 text-sm font-bold mt-4">
                  {Math.round((chartData[0].value / (totalClicksChart || 1)) * 100)}%
                </span>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-4">
            {chartData.map((item: any, i: number) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-xs text-gray-400">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Links */}
        <StatCard 
          title="Top links" 
          icon={<Link2 className="w-5 h-5 text-emerald-500" />}
          items={(data.topLinks || []).map((l: any) => ({ name: l.title || l.slug, value: l._count?._all }))}
          total={data.totalClicks}
        />
      </div>

      {/* Row 2: Top Countries (Map) */}
      <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#262626]">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-500" />
            <h3 className="text-xl font-semibold text-white">Top countries</h3>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-sm">Clicks</span>
            <Info className="w-4 h-4" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            {(data.geos || []).map((geo: any) => {
              const percentage = data.totalClicks > 0 ? (geo._count?._all / data.totalClicks) * 100 : 0;
              return (
                <div key={geo.country}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300 font-medium">{geo.country || 'Unknown'}</span>
                    <span className="text-white font-mono">{geo._count?._all}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#262626] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="lg:col-span-2">
            <WorldMap data={(data.geos || []).map((g: any) => ({ name: g.country, value: g._count?._all }))} />
          </div>
        </div>
        <button className="mt-10 w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-white transition-colors group">
          DETAILS
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Row 3: Grid of other stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <StatCard 
          title="Top browsers" 
          icon={<Monitor className="w-5 h-5 text-emerald-500" />}
          items={(data.browsers || []).map((b: any) => ({ name: b.browser || 'Unknown', value: b._count?._all }))}
          total={data.totalClicks}
        />
        <StatCard 
          title="Top operating systems" 
          icon={<Smartphone className="w-5 h-5 text-emerald-500" />}
          items={(data.oss || []).map((o: any) => ({ name: o.os || 'Unknown', value: o._count?._all }))}
          total={data.totalClicks}
        />
        <StatCard 
          title="Top referrers" 
          icon={<Share2 className="w-5 h-5 text-emerald-500" />}
          items={(data.referrers || []).map((r: any) => ({ name: r.referrer || 'Direct', value: r._count?._all }))}
          total={data.totalClicks}
        />
        <StatCard 
          title="Top social referrers" 
          icon={<Share2 className="w-5 h-5 text-emerald-500" />}
          items={(data.socialReferrers || []).map((r: any) => ({ name: r.referrer || 'Direct', value: r._count?._all }))}
          total={data.totalClicks}
        />
        <StatCard 
          title="Top mediums" 
          icon={<Layers className="w-5 h-5 text-emerald-500" />}
          items={(data.utmMediums || []).map((m: any) => ({ name: m.utmMedium || 'Unknown', value: m._count?._all }))}
          total={data.totalClicks}
        />
        <StatCard 
          title="Top sources" 
          icon={<Hash className="w-5 h-5 text-emerald-500" />}
          items={(data.utmSources || []).map((s: any) => ({ name: s.utmSource || 'Unknown', value: s._count?._all }))}
          total={data.totalClicks}
        />
      </div>
    </div>
  );
}
