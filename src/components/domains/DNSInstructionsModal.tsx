import React, { useState } from 'react';
import { X, Copy, Check, ShieldCheck, Globe, Info } from 'lucide-react';

interface DNSInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostname: string;
}

export default function DNSInstructionsModal({ isOpen, onClose, hostname }: DNSInstructionsModalProps) {
  const [copied, setCopied] = useState(false);
  
  if (!isOpen) return null;

  const appHostname = window.location.hostname;
  const subdomain = hostname.split('.')[0];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#141414] border border-[#262626] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Globe className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-white">DNS Configuration</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-gray-400">
            Add the following CNAME record to your domain provider (Cloudflare, GoDaddy, etc.) to point <span className="text-white font-medium">{hostname}</span> to our servers.
          </p>

          <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Type</span>
              <span className="text-sm text-white font-mono">CNAME</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Host / Name</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white font-mono">{subdomain}</span>
                <button 
                  onClick={() => copyToClipboard(subdomain)}
                  className="p-1 hover:bg-white/5 rounded transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-500" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Value / Target</span>
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-sm text-white font-mono truncate">{appHostname}</span>
                <button 
                  onClick={() => copyToClipboard(appHostname)}
                  className="p-1 hover:bg-white/5 rounded transition-colors shrink-0"
                >
                  {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-500" />}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex gap-3">
            <Info className="w-5 h-5 text-orange-500 shrink-0" />
            <p className="text-xs text-gray-300 leading-relaxed">
              Propagation can take up to 24 hours, but usually happens within minutes.
            </p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0" />
            <p className="text-xs text-gray-300 leading-relaxed">
              SSL will be automatically provisioned once the domain is pointing correctly.
            </p>
          </div>
        </div>

        <div className="p-6 bg-[#1a1a1a] border-t border-[#262626]">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-[#262626] text-white rounded-xl font-bold hover:bg-[#333] transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
