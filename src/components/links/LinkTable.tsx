import React, { useState, useEffect } from 'react';
import { X, Globe, Copy, Check, QrCode, BarChart2, MoreVertical, Tag as TagIcon, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, Target, Trash2 } from 'lucide-react';
import QRModal from './QRModal';
import { cn } from '@/src/lib/utils';

interface Link {
  id: string;
  slug: string;
  originalUrl: string;
  title: string;
  clicks: number;
  conversions: number;
  conversionRate: string;
  tags: any[];
  domain?: { hostname: string };
  createdAt: string;
}

export default function LinkTable() {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');

  const fetchLinks = () => {
    setLoading(true);
    const params = new URLSearchParams({ sortBy, order, search });
    const token = localStorage.getItem('ts_token');
    fetch(`/api/links?${params.toString()}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })
      .then(res => res.json())
      .then(json => {
        setLinks(Array.isArray(json) ? json : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch links:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLinks();
    }, 300);
    return () => clearTimeout(timer);
  }, [sortBy, order, search]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this link?')) return;
    try {
      const token = localStorage.getItem('ts_token');
      const res = await fetch(`/api/links/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (res.ok) fetchLinks();
      else {
        const data: any = await res.json();
        alert(data.error || 'Failed to delete link');
      }
    } catch (error) {
      console.error('Failed to delete link:', error);
    }
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
    return order === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 text-orange-500" /> : <ArrowDown className="w-3 h-3 ml-1 text-orange-500" />;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadCSV = () => {
    const headers = ['Title', 'Short Link', 'Original URL', 'Clicks', 'Conversions', 'Conv. Rate', 'Created'];
    const rows = links.map(l => [
      l.title,
      `${l.domain?.hostname || 's.thinksmart'}/${l.slug}`,
      l.originalUrl,
      l.clicks,
      l.conversions,
      `${l.conversionRate}%`,
      new Date(l.createdAt).toLocaleDateString()
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "links_report.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const simulateConversion = async (linkId: string) => {
    try {
      const res = await fetch('/api/conversions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkId,
          type: 'signup',
          value: 10.0,
          metadata: { simulated: true }
        })
      });
      if (res.ok) {
        fetchLinks();
      }
    } catch (error) {
      console.error('Failed to simulate conversion:', error);
    }
  };

  if (loading && links.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] bg-[#1a1a1a] rounded-xl border border-[#262626]">
        <RefreshCw className="w-6 h-6 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-[#262626] overflow-hidden">
      <div className="p-6 border-b border-[#262626] flex items-center justify-between bg-[#141414]">
        <div className="flex gap-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search links..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-2 text-sm w-64 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
          <select className="bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-2 text-sm text-gray-400 focus:outline-none focus:border-orange-500">
            <option>All Domains</option>
            <option>s.thinksmart.com</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={downloadCSV}
            title="Export CSV"
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <BarChart2 className="w-5 h-5" />
          </button>
          <button 
            onClick={fetchLinks}
            title="Refresh"
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <TagIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#141414] text-gray-400 text-xs uppercase tracking-wider">
            <th className="px-6 py-4 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('title')}>
              <div className="flex items-center">Link Details <SortIcon field="title" /></div>
            </th>
            <th className="px-6 py-4 font-medium">Original URL</th>
            <th className="px-6 py-4 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('clicks')}>
              <div className="flex items-center">Performance <SortIcon field="clicks" /></div>
            </th>
            <th className="px-6 py-4 font-medium">Tags</th>
            <th className="px-6 py-4 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('createdAt')}>
              <div className="flex items-center">Created <SortIcon field="createdAt" /></div>
            </th>
            <th className="px-6 py-4 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#262626]">
          {links.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No links found. Create your first link!</td>
            </tr>
          ) : (
            links.map((link) => (
              <tr key={link.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="text-white font-semibold text-sm mb-1">{link.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-orange-500 text-sm font-medium">{link.domain?.hostname || 's.thinksmart'}/{link.slug}</span>
                      <button 
                        onClick={() => copyToClipboard(`${link.domain?.hostname || 's.thinksmart'}/${link.slug}`, link.id)}
                        className="text-gray-500 hover:text-white transition-colors"
                      >
                        {copiedId === link.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2 max-w-xs overflow-hidden">
                    <Globe className="w-4 h-4 text-gray-500 shrink-0" />
                    <span className="text-gray-400 text-sm truncate">{link.originalUrl}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex gap-6">
                    <div className="flex flex-col">
                      <span className="text-white font-mono text-sm">{link.clicks || 0}</span>
                      <span className="text-[10px] text-gray-500 uppercase">Clicks</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-orange-500 font-mono text-sm">{link.conversions || 0}</span>
                      <span className="text-[10px] text-gray-500 uppercase">Conv.</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-green-500 font-mono text-sm">{link.conversionRate}%</span>
                      <span className="text-[10px] text-gray-500 uppercase">Rate</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex gap-1 flex-wrap">
                    {(link.tags || []).map((tag: any) => (
                      <span key={tag.id || tag} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-gray-400 uppercase tracking-wider">
                        {tag.name || tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-5 text-sm text-gray-400">
                  {new Date(link.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => simulateConversion(link.id)}
                      title="Simulate Conversion"
                      className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-500/10 rounded-lg transition-all"
                    >
                      <Target className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setSelectedLink(link)}
                      title="QR Code"
                      className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(link.id)}
                      title="Delete Link"
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                      <BarChart2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {selectedLink && (
        <QRModal 
          isOpen={!!selectedLink} 
          onClose={() => setSelectedLink(null)} 
          linkUrl={`https://${selectedLink.domain?.hostname || 's.thinksmart'}/${selectedLink.slug}`}
          linkTitle={selectedLink.title || selectedLink.slug}
          domainSettings={selectedLink.domain}
        />
      )}
    </div>
  );
}
