import React, { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, Key, Globe, AlertTriangle, CheckCircle2, RefreshCw, Save } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export default function SecurityView() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const securitySettings = [
    {
      id: 'https',
      title: 'Enforce HTTPS',
      description: 'Automatically redirect all HTTP traffic to HTTPS for your short links.',
      enabled: true,
      icon: Lock,
      color: 'text-green-500'
    },
    {
      id: 'brute-force',
      title: 'Brute Force Protection',
      description: 'Rate limit requests to prevent automated attacks on your links.',
      enabled: true,
      icon: Shield,
      color: 'text-blue-500'
    },
    {
      id: 'malware',
      title: 'Malware Scanning',
      description: 'Scan destination URLs for malware and phishing before redirecting.',
      enabled: false,
      icon: AlertTriangle,
      color: 'text-orange-500'
    },
    {
      id: 'cloaking-protection',
      title: 'Cloaking Security',
      description: 'Prevent search engines from indexing cloaked links.',
      enabled: true,
      icon: EyeOff,
      color: 'text-purple-500'
    }
  ];

  return (
    <div className="space-y-8 pb-20">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white">Security & Protection</h1>
        <p className="text-gray-400 mt-1">Configure global security protocols for your link infrastructure.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {securitySettings.map((setting) => (
            <div key={setting.id} className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 flex items-start gap-6 hover:border-orange-500/30 transition-colors">
              <div className={cn("p-3 rounded-xl bg-white/5", setting.color)}>
                <setting.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-semibold text-white">{setting.title}</h3>
                  <div className={cn(
                    "w-12 h-6 rounded-full relative cursor-pointer transition-colors",
                    setting.enabled ? "bg-orange-500" : "bg-[#262626]"
                  )}>
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      setting.enabled ? "right-1" : "left-1"
                    )} />
                  </div>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{setting.description}</p>
              </div>
            </div>
          ))}

          <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-6 flex items-start gap-4">
            <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-orange-500 uppercase tracking-wider mb-1">Security Warning</h4>
              <p className="text-sm text-orange-200/70 leading-relaxed">
                Disabling Malware Scanning may expose your users to malicious websites. We recommend keeping this enabled for all production domains.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-orange-500" />
              API Security
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Active API Key</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="password" 
                    value="ts_live_51PzX2k2e..." 
                    readOnly 
                    className="flex-1 bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-xs text-gray-400 font-mono"
                  />
                  <button className="p-2 bg-[#262626] text-white rounded-lg hover:bg-[#333]">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                Your API key provides full access to your account. Never share it in client-side code or public repositories.
              </p>
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-orange-500" />
              Allowed Origins
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">*.thinksmartins.com</span>
                <span className="text-green-500 font-bold uppercase tracking-tighter">Active</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">localhost:3000</span>
                <span className="text-orange-500 font-bold uppercase tracking-tighter">Dev Only</span>
              </div>
              <button className="w-full mt-2 py-2 bg-[#262626] text-white text-xs font-bold rounded-lg hover:bg-[#333] transition-colors">
                Manage Origins
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="px-8 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20">
          <Save className="w-5 h-5" />
          Save Security Policy
        </button>
      </div>
    </div>
  );
}
