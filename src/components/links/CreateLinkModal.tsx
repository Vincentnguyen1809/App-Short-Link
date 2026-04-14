import React, { useState, useEffect } from 'react';
import { X, Plus, Info, ChevronDown, ChevronUp, Wand2, Settings, BarChart2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface CreateLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Domain {
  id: string;
  hostname: string;
}

export default function CreateLinkModal({ isOpen, onClose, onSuccess }: CreateLinkModalProps) {
  const [showUtm, setShowUtm] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    originalUrl: '',
    slug: '',
    domainId: '',
    title: '',
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    isCloaked: false,
    password: '',
    expiresAt: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetch('/api/domains')
        .then(res => res.json())
        .then(data => {
          setDomains(data);
          if (data.length > 0) {
            setFormData(prev => ({ ...prev, domainId: data[0].id }));
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess?.();
        onClose();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create link');
      }
    } catch (error) {
      console.error('Error creating link:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#141414] border border-[#262626] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-[#262626] flex items-center justify-between sticky top-0 bg-[#141414] z-10">
            <h2 className="text-xl font-bold text-white">Create New Short Link</h2>
            <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-8">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Destination URL</label>
                <input 
                  required
                  type="url" 
                  value={formData.originalUrl}
                  onChange={e => setFormData({ ...formData, originalUrl: e.target.value })}
                  placeholder="https://example.com/very-long-url-to-shorten" 
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Domain</label>
                  <select 
                    required
                    value={formData.domainId}
                    onChange={e => setFormData({ ...formData, domainId: e.target.value })}
                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                  >
                    {domains.map(d => (
                      <option key={d.id} value={d.id}>{d.hostname}</option>
                    ))}
                    {domains.length === 0 && <option value="">No domains available</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Slug (Optional)</label>
                  <input 
                    type="text" 
                    value={formData.slug}
                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="summer-promo" 
                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Title</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Campaign Title" 
                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors pr-10"
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500 hover:text-orange-400">
                    <Wand2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* UTM Builder */}
            <div className="border border-[#262626] rounded-xl overflow-hidden">
              <button 
                type="button"
                onClick={() => setShowUtm(!showUtm)}
                className="w-full p-4 flex items-center justify-between bg-[#1a1a1a] hover:bg-[#262626] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-orange-500" />
                  <span className="font-semibold text-sm text-white">UTM Builder</span>
                </div>
                {showUtm ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {showUtm && (
                <div className="p-4 bg-[#0a0a0a] grid grid-cols-2 gap-4 border-t border-[#262626]">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Source</label>
                    <input 
                      type="text" 
                      value={formData.utmSource}
                      onChange={e => setFormData({ ...formData, utmSource: e.target.value })}
                      placeholder="google, facebook" 
                      className="w-full bg-[#141414] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Medium</label>
                    <input 
                      type="text" 
                      value={formData.utmMedium}
                      onChange={e => setFormData({ ...formData, utmMedium: e.target.value })}
                      placeholder="cpc, email" 
                      className="w-full bg-[#141414] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500" 
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Campaign Name</label>
                    <input 
                      type="text" 
                      value={formData.utmCampaign}
                      onChange={e => setFormData({ ...formData, utmCampaign: e.target.value })}
                      placeholder="summer_sale_2024" 
                      className="w-full bg-[#141414] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500" 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Options */}
            <div className="border border-[#262626] rounded-xl overflow-hidden">
              <button 
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full p-4 flex items-center justify-between bg-[#1a1a1a] hover:bg-[#262626] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-orange-500" />
                  <span className="font-semibold text-sm text-white">Advanced Options</span>
                </div>
                {showAdvanced ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {showAdvanced && (
                <div className="p-6 bg-[#0a0a0a] space-y-8 border-t border-[#262626]">
                  {/* Security Section */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Security & Expiration</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1">Password</label>
                        <input 
                          type="password" 
                          value={formData.password}
                          onChange={e => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Optional" 
                          className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1">Expires At</label>
                        <input 
                          type="date" 
                          value={formData.expiresAt}
                          onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                          className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white" 
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#141414] rounded-xl border border-[#262626]">
                      <div>
                        <p className="text-sm font-medium text-white">Link Cloaking</p>
                        <p className="text-[10px] text-gray-500">Hide destination URL in browser</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={formData.isCloaked}
                        onChange={e => setFormData({ ...formData, isCloaked: e.target.checked })}
                        className="w-4 h-4 accent-orange-500" 
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-[#262626] flex gap-3 sticky bottom-0 bg-[#141414] z-10">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-[#1a1a1a] border border-[#262626] rounded-xl text-sm font-semibold hover:bg-[#262626] transition-colors">
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
