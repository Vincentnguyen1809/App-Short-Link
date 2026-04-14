import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, MousePointer2, Calendar, RefreshCw, Search, Download, ExternalLink } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface ConversionEvent {
  id: string;
  linkId: string;
  link: {
    title: string;
    slug: string;
    domain: { hostname: string };
  };
  type: string;
  value: number | null;
  timestamp: string;
  metadata: any;
}

export default function ConversionReport() {
  const [conversions, setConversions] = useState<ConversionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/conversions/recent')
      .then(res => res.json())
      .then(data => {
        setConversions(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch conversions:', err);
        setConversions([]);
        setLoading(false);
      });
  }, []);

  const filteredConversions = (Array.isArray(conversions) ? conversions : []).filter(c => 
    c.link?.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.link?.slug?.toLowerCase().includes(search.toLowerCase()) ||
    c.type?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Conversion Report</h1>
          <p className="text-gray-400 mt-1">Track every successful action attributed to your links.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-[#1a1a1a] border border-[#262626] text-white rounded-lg text-sm font-medium hover:bg-[#262626] transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#262626]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Target className="w-5 h-5 text-orange-500" />
            </div>
            <span className="text-sm text-gray-400 font-medium uppercase tracking-wider">Total Conversions</span>
          </div>
          <h3 className="text-3xl font-bold text-white">{conversions.length}</h3>
        </div>
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#262626]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-sm text-gray-400 font-medium uppercase tracking-wider">Conversion Value</span>
          </div>
          <h3 className="text-3xl font-bold text-white">
            ${conversions.reduce((acc, c) => acc + (c.value || 0), 0).toFixed(2)}
          </h3>
        </div>
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#262626]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <MousePointer2 className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-sm text-gray-400 font-medium uppercase tracking-wider">Avg. Value</span>
          </div>
          <h3 className="text-3xl font-bold text-white">
            ${conversions.length > 0 ? (conversions.reduce((acc, c) => acc + (c.value || 0), 0) / conversions.length).toFixed(2) : '0.00'}
          </h3>
        </div>
      </div>

      <div className="bg-[#1a1a1a] rounded-xl border border-[#262626] overflow-hidden">
        <div className="p-6 border-b border-[#262626] flex items-center justify-between bg-[#141414]">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Filter by link or type..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#0a0a0a] border border-[#262626] rounded-lg pl-10 pr-4 py-2 text-sm w-64 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#141414] text-gray-400 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-medium">Time</th>
              <th className="px-6 py-4 font-medium">Link</th>
              <th className="px-6 py-4 font-medium">Event Type</th>
              <th className="px-6 py-4 font-medium">Value</th>
              <th className="px-6 py-4 font-medium">Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#262626]">
            {filteredConversions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No conversion events found.</td>
              </tr>
            ) : (
              filteredConversions.map((conv) => (
                <tr key={conv.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(conv.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-white font-medium text-sm">{conv.link.title || conv.link.slug}</span>
                      <span className="text-orange-500 text-xs">{conv.link.domain.hostname}/{conv.link.slug}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded text-[10px] font-bold uppercase tracking-wider">
                      {conv.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-white">
                    {conv.value ? `$${conv.value.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {Object.entries(conv.metadata || {}).map(([key, val]) => (
                        <span key={key} className="px-1.5 py-0.5 bg-[#0a0a0a] border border-[#262626] rounded text-[10px] text-gray-500">
                          {key}: {String(val)}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
