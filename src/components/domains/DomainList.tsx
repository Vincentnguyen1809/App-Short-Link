import React, { useState, useEffect } from 'react';
import { Globe, Shield, CheckCircle2, AlertCircle, Plus, ExternalLink, MoreVertical, RefreshCw, Trash2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import DomainSettings from './DomainSettings';
import DNSInstructionsModal from './DNSInstructionsModal';

interface Domain {
  id: string;
  hostname: string;
  dnsStatus: string;
  sslStatus: string;
  mainPageRedirect?: string;
  error404Redirect?: string;
  enableTracking: boolean;
  gaId?: string;
  segmentKey?: string;
  fbPixelId?: string;
  adrollId?: string;
  webhookUrl?: string;
  qrForegroundColor: string;
  qrBackgroundColor: string;
  qrFinderColor: string;
  qrBorderRadius: number;
  qrFinderPattern: string;
  qrDotMode: string;
  qrLogoUrl?: string;
  qrLogoSize: number;
  qrNoLogoBorder: boolean;
  qrLabel?: string;
  qrErrorCorrection: string;
  createdAt: string;
}

export default function DomainList({ onAddClick, userRole }: { onAddClick?: () => void, userRole?: 'ADMIN' | 'MEMBER' | null }) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [dnsModalDomain, setDnsModalDomain] = useState<string | null>(null);

  const isMember = userRole === 'MEMBER';

  const fetchDomains = () => {
    setLoading(true);
    fetch('/api/domains')
      .then(res => res.json())
      .then(json => {
        setDomains(Array.isArray(json) ? json : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch domains:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this domain?')) return;
    try {
      const token = localStorage.getItem('ts_token');
      const res = await fetch(`/api/domains/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (res.ok) fetchDomains();
      else {
        const data = await res.json();
        alert(data.error || 'Failed to delete domain');
      }
    } catch (error) {
      console.error('Failed to delete domain:', error);
    }
  };

  const handleSaveSettings = (updated: Domain) => {
    setDomains(domains.map(d => d.id === updated.id ? updated : d));
    setSelectedDomain(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <RefreshCw className="w-6 h-6 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {domains.map((domain) => (
          <div key={domain.id} className="bg-[#1a1a1a] border border-[#262626] rounded-xl overflow-hidden hover:border-orange-500/30 transition-all duration-300">
            <div className="p-6 border-b border-[#262626] flex items-center justify-between bg-[#141414]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Globe className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-white font-bold">{domain.hostname}</h3>
                  <p className="text-xs text-gray-500">Added on {new Date(domain.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              {!isMember && (
                <button 
                  onClick={() => handleDelete(domain.id)}
                  className="p-2 text-gray-500 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">DNS Status</p>
                  <div className="flex items-center gap-2">
                    {domain.dnsStatus === 'configured' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className={cn("text-sm font-medium", domain.dnsStatus === 'configured' ? "text-green-500" : "text-yellow-500")}>
                      {domain.dnsStatus === 'configured' ? 'Configured' : 'Pending'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">SSL Status</p>
                  <div className="flex items-center gap-2">
                    {domain.sslStatus === 'active' ? (
                      <Shield className="w-4 h-4 text-blue-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className={cn("text-sm font-medium", domain.sslStatus === 'active' ? "text-blue-500" : "text-yellow-500")}>
                      {domain.sslStatus === 'active' ? 'Active' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-[#262626]">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-400">Main Page Redirect</p>
                    <p className="text-sm text-white truncate max-w-[200px]">{domain.mainPageRedirect || 'None'}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-400">404 Redirect</p>
                    <p className="text-sm text-white truncate max-w-[200px]">{domain.error404Redirect || 'None'}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-600" />
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-[#141414] border-t border-[#262626] flex gap-2">
              <button 
                onClick={() => setDnsModalDomain(domain.hostname)}
                className="flex-1 py-2 text-xs font-semibold text-white bg-[#262626] rounded-lg hover:bg-[#333] transition-colors"
              >
                Configure DNS
              </button>
              <button 
                onClick={() => setSelectedDomain(domain)}
                className="flex-1 py-2 text-xs font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Edit Settings
              </button>
            </div>
          </div>
        ))}

        {!isMember && (
          <button 
            onClick={onAddClick}
            className="border-2 border-dashed border-[#262626] rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all group text-left"
          >
            <div className="w-12 h-12 bg-[#1a1a1a] rounded-full flex items-center justify-center border border-[#262626] group-hover:bg-orange-500 group-hover:border-orange-500 transition-all">
              <Plus className="w-6 h-6 text-gray-400 group-hover:text-white" />
            </div>
            <div className="text-center">
              <h3 className="text-white font-bold">Add Custom Domain</h3>
              <p className="text-sm text-gray-500 mt-1">Connect your own branded domain</p>
            </div>
          </button>
        )}
      </div>

      {selectedDomain && (
        <DomainSettings 
          domain={selectedDomain} 
          onClose={() => setSelectedDomain(null)} 
          onSave={handleSaveSettings} 
        />
      )}

      {dnsModalDomain && (
        <DNSInstructionsModal 
          isOpen={!!dnsModalDomain} 
          onClose={() => setDnsModalDomain(null)} 
          hostname={dnsModalDomain} 
        />
      )}
    </div>
  );
}
