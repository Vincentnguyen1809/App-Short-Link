import React, { useState } from 'react';
import { X, Globe, Info, ShieldCheck, CheckCircle2, Copy, Check, ArrowRight } from 'lucide-react';

interface AddDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddDomainModal({ isOpen, onClose, onSuccess }: AddDomainModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    hostname: '',
    mainPageRedirect: '',
    error404Redirect: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setStep('success');
        onSuccess?.();
      } else {
        const err = await res.json() as any;
        alert(err.error || 'Failed to add domain');
      }
    } catch (error) {
      console.error('Error adding domain:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const appHostname = window.location.hostname;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#141414] border border-[#262626] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {step === 'form' ? (
          <form onSubmit={handleSubmit}>
            <div className="p-6 border-b border-[#262626] flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Add Custom Domain</h2>
              <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex gap-3">
                <Info className="w-5 h-5 text-orange-500 shrink-0" />
                <p className="text-xs text-gray-300 leading-relaxed">
                  To use a custom domain, you'll need to point your domain's A record or CNAME to our servers. Instructions will be provided after adding.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Domain Hostname</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      required
                      type="text" 
                      value={formData.hostname}
                      onChange={e => setFormData({ ...formData, hostname: e.target.value })}
                      placeholder="s.thinksmartins.com" 
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Main Page Redirect</label>
                    <input 
                      type="url" 
                      value={formData.mainPageRedirect}
                      onChange={e => setFormData({ ...formData, mainPageRedirect: e.target.value })}
                      placeholder="https://thinksmartins.com" 
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">404 Redirect</label>
                    <input 
                      type="url" 
                      value={formData.error404Redirect}
                      onChange={e => setFormData({ ...formData, error404Redirect: e.target.value })}
                      placeholder="https://thinksmartins.com/404" 
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-[#1a1a1a] rounded-xl border border-[#262626]">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-white">Automatic SSL</p>
                  <p className="text-[10px] text-gray-500">We'll automatically provision a Let's Encrypt SSL certificate.</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#262626] flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-[#1a1a1a] border border-[#262626] rounded-xl text-sm font-semibold hover:bg-[#262626] transition-colors">
                Cancel
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Domain'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Domain Added Successfully!</h2>
            <p className="text-gray-400 mb-8">Now, you need to configure your DNS records to point <span className="text-white font-medium">{formData.hostname}</span> to our servers.</p>

            <div className="space-y-4 text-left mb-8">
              <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Type</span>
                  <span className="text-sm text-white font-mono">CNAME</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Host</span>
                  <span className="text-sm text-white font-mono">{formData.hostname.split('.')[0]}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Value</span>
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-sm text-white font-mono truncate">{appHostname}</span>
                    <button 
                      onClick={() => copyToClipboard(appHostname)}
                      className="p-1.5 hover:bg-white/5 rounded-lg transition-colors shrink-0"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 text-left mb-8">
              <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0" />
              <p className="text-xs text-gray-300 leading-relaxed">
                SSL certificate will be automatically issued once DNS propagation is complete (usually takes 5-30 minutes).
              </p>
            </div>

            <button 
              onClick={onClose}
              className="w-full py-4 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
            >
              Finish Setup <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
