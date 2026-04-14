import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  X, 
  RefreshCw, 
  Globe, 
  Zap, 
  Palette, 
  QrCode, 
  BarChart2, 
  Target, 
  Link2, 
  ShieldAlert, 
  Database,
  CheckCircle2,
  ExternalLink,
  Info,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface Domain {
  id: string;
  hostname: string;
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
}

interface DomainSettingsProps {
  domain: Domain;
  onClose: () => void;
  onSave: (updatedDomain: Domain) => void;
}

export default function DomainSettings({ domain, onClose, onSave }: DomainSettingsProps) {
  const [activeSection, setActiveSection] = useState('tracking');
  const [formData, setFormData] = useState<Domain>(domain);
  const [saving, setSaving] = useState(false);

  const sections = [
    { id: 'redirects', label: 'Redirects', icon: Link2 },
    { id: 'slug', label: 'Slug generation', icon: Zap },
    { id: 'ui', label: 'UI Customization', icon: Palette },
    { id: 'qr', label: 'QR code settings', icon: QrCode },
    { id: 'statistics', label: 'Statistics', icon: BarChart2 },
    { id: 'tracking', label: 'Tracking', icon: Target },
    { id: 'conversion', label: 'Conversion', icon: TrendingUp },
    { id: 'deep-links', label: 'Deep links', icon: Globe },
    { id: 'robots', label: 'Robots policy', icon: ShieldAlert },
    { id: 'restrict', label: 'Restrict destinations', icon: ShieldAlert },
    { id: 's3', label: 'S3 Export', icon: Database },
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/domains/${domain.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const updated = await res.json() as any;
        onSave(updated);
      }
    } catch (error) {
      console.error('Failed to save domain settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'conversion':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Conversion Tracking</h3>
              <p className="text-gray-400 text-sm">Measure the success of your links by tracking actions like signups, purchases, or form submissions.</p>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Target className="w-5 h-5 text-emerald-500" />
                </div>
                <h4 className="font-semibold text-white">How it works</h4>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                When a user clicks your short link, we set a secure tracking cookie. You can then trigger a conversion event on your destination page using our JavaScript SDK.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-white">1. Install the Tracking Script</h4>
              <p className="text-sm text-gray-400">Add this script to the <code className="text-orange-500">&lt;head&gt;</code> of your destination website.</p>
              <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-4 font-mono text-xs text-emerald-500 overflow-x-auto">
                {`<script src="${window.location.origin}/api/tracking/script.js"></script>`}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-white">2. Trigger a Conversion</h4>
              <p className="text-sm text-gray-400">Call the <code className="text-orange-500">Thinksmart.track()</code> function when a user completes an action.</p>
              <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-4 font-mono text-xs text-emerald-500 overflow-x-auto whitespace-pre">
                {`// Basic tracking\nThinksmart.track('signup');\n\n// Tracking with value and metadata\nThinksmart.track('purchase', 49.99, { plan: 'pro' });`}
              </div>
            </div>

            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
              <p className="text-xs text-orange-500 leading-relaxed">
                <strong>Note:</strong> Conversion tracking works best when your destination page is on the same root domain as your short links, or if you have enabled cross-site cookies.
              </p>
            </div>
          </div>
        );
      case 'tracking':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Tracking</h2>
              <p className="text-gray-400">Analytics & Retargeting tools integration</p>
            </div>

            <div className="pt-8 border-t border-[#262626]">
              <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">
                Retargeting is a marketing tool, which shows ads to users who previously clicked your short links. 
                It's necessary if you need to drive customers back to your website. Each time users click a link, 
                their browser loads a JS snippet from AdRoll/Facebook.
                <br />
                You can also track your visitors with Google Analytics or Google Tag Manager.
              </p>
            </div>

            <div className="space-y-6">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={cn(
                  "w-5 h-5 rounded border flex items-center justify-center transition-all",
                  formData.enableTracking ? "bg-emerald-500 border-emerald-500" : "bg-[#0a0a0a] border-[#262626] group-hover:border-emerald-500"
                )} onClick={() => setFormData({ ...formData, enableTracking: !formData.enableTracking })}>
                  {formData.enableTracking && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-white font-medium">Enable conversion tracking</span>
                <a href="#" className="text-emerald-500 text-sm hover:underline flex items-center gap-1">
                  Learn more <ExternalLink className="w-3 h-3" />
                </a>
              </label>

              <div className="space-y-6 max-w-3xl">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Google Analytics 4 property ID or GTM Container ID</label>
                  <input 
                    type="text"
                    value={formData.gaId || ''}
                    onChange={(e) => setFormData({ ...formData, gaId: e.target.value })}
                    placeholder="G-XXXXXXXXXX or GTM-XXXXXXX"
                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-3 text-white focus:border-emerald-500 transition-colors"
                  />
                  <p className="text-[11px] text-gray-500">Tracking ID in format GTM-XXXXXXX or G-XXXXXXXXXX</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Segment.com Write Key</label>
                  <input 
                    type="text"
                    value={formData.segmentKey || ''}
                    onChange={(e) => setFormData({ ...formData, segmentKey: e.target.value })}
                    placeholder="Enter Segment Write Key"
                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-3 text-white focus:border-emerald-500 transition-colors"
                  />
                  <p className="text-[11px] text-gray-500">Learn how to get segment key here: <a href="#" className="text-emerald-500 hover:underline">https://blog.thinksmart.io/segment/</a></p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Facebook Pixel ID</label>
                  <input 
                    type="text"
                    value={formData.fbPixelId || ''}
                    onChange={(e) => setFormData({ ...formData, fbPixelId: e.target.value })}
                    placeholder="Enter Facebook Pixel ID"
                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-3 text-white focus:border-emerald-500 transition-colors"
                  />
                  <p className="text-[11px] text-gray-500">Facebook pixel code will be loaded on every link click</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Adroll ID</label>
                  <input 
                    type="text"
                    value={formData.adrollId || ''}
                    onChange={(e) => setFormData({ ...formData, adrollId: e.target.value })}
                    placeholder="Enter Adroll ID"
                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-3 text-white focus:border-emerald-500 transition-colors"
                  />
                  <p className="text-[11px] text-gray-500">Adroll is a great retargeting tool, which allows you to target ads to your visitors</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Webhook URL</label>
                  <input 
                    type="text"
                    value={formData.webhookUrl || ''}
                    onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                    placeholder="https://your-api.com/webhook"
                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-3 text-white focus:border-emerald-500 transition-colors"
                  />
                  <p className="text-[11px] text-gray-500">This URL will be called every time the client visits your short link</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'qr':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">QR code settings</h2>
              <p className="text-gray-400">Predefined qr code settings for all links of your domain.</p>
            </div>

            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-8 flex flex-col md:flex-row gap-12">
              <div className="flex-shrink-0 flex flex-col items-center gap-6">
                <div className="w-64 h-64 bg-white p-4 rounded-2xl shadow-2xl relative">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=https://${domain.hostname}`} alt="QR Preview" className="w-full h-full" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg border border-gray-100">
                      <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center text-[8px] text-white font-bold leading-none text-center">
                        THINK<br/>SMART
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full">
                  <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#262626] text-white text-xs font-bold rounded-lg hover:bg-[#333]">
                    <RefreshCw className="w-3.5 h-3.5" /> PNG
                  </button>
                  <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#262626] text-white text-xs font-bold rounded-lg hover:bg-[#333]">
                    <RefreshCw className="w-3.5 h-3.5" /> SVG
                  </button>
                  <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#262626] text-white text-xs font-bold rounded-lg hover:bg-[#333]">
                    <RefreshCw className="w-3.5 h-3.5" /> PDF
                  </button>
                  <button className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600">
                    <RefreshCw className="w-3.5 h-3.5" /> Copy
                  </button>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Colors</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase mb-1 block">Foreground</label>
                        <div className="flex items-center bg-[#0a0a0a] border border-[#262626] rounded-lg p-1">
                          <input type="color" value={formData.qrForegroundColor} onChange={(e) => setFormData({...formData, qrForegroundColor: e.target.value})} className="w-8 h-8 bg-transparent border-none cursor-pointer" />
                          <span className="text-[10px] text-white ml-2 font-mono uppercase">{formData.qrForegroundColor}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase mb-1 block">Background</label>
                        <div className="flex items-center bg-[#0a0a0a] border border-[#262626] rounded-lg p-1">
                          <input type="color" value={formData.qrBackgroundColor} onChange={(e) => setFormData({...formData, qrBackgroundColor: e.target.value})} className="w-8 h-8 bg-transparent border-none cursor-pointer" />
                          <span className="text-[10px] text-white ml-2 font-mono uppercase">{formData.qrBackgroundColor}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase mb-1 block">Finder</label>
                        <div className="flex items-center bg-[#0a0a0a] border border-[#262626] rounded-lg p-1">
                          <input type="color" value={formData.qrFinderColor} onChange={(e) => setFormData({...formData, qrFinderColor: e.target.value})} className="w-8 h-8 bg-transparent border-none cursor-pointer" />
                          <span className="text-[10px] text-white ml-2 font-mono uppercase">{formData.qrFinderColor}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Logo</h4>
                    <button className="w-full py-3 bg-[#0a0a0a] border border-dashed border-[#262626] rounded-xl text-sm text-gray-400 hover:border-emerald-500 hover:text-emerald-500 transition-all flex items-center justify-center gap-2">
                      <Palette className="w-4 h-4" /> Change logo image
                    </button>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] text-gray-500 uppercase">
                        <span>Logo size</span>
                        <span>{formData.qrLogoSize}%</span>
                      </div>
                      <input type="range" min="10" max="40" value={formData.qrLogoSize} onChange={(e) => setFormData({...formData, qrLogoSize: parseInt(e.target.value)})} className="w-full accent-emerald-500" />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Style</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] text-gray-500 uppercase">
                        <span>Border radius</span>
                        <span>{formData.qrBorderRadius}px</span>
                      </div>
                      <input type="range" min="0" max="20" value={formData.qrBorderRadius} onChange={(e) => setFormData({...formData, qrBorderRadius: parseInt(e.target.value)})} className="w-full accent-emerald-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase mb-1 block">Finder pattern</label>
                        <select value={formData.qrFinderPattern} onChange={(e) => setFormData({...formData, qrFinderPattern: e.target.value})} className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white">
                          <option value="square">Square</option>
                          <option value="rounded">Rounded</option>
                          <option value="dot">Dot</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase mb-1 block">Dot merge mode</label>
                        <select value={formData.qrDotMode} onChange={(e) => setFormData({...formData, qrDotMode: e.target.value})} className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white">
                          <option value="individual">Individual</option>
                          <option value="connected">Connected</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Label</h4>
                    <input 
                      type="text" 
                      value={formData.qrLabel || ''} 
                      onChange={(e) => setFormData({...formData, qrLabel: e.target.value})}
                      placeholder="Add a text label to your QR code" 
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-3 text-sm text-white focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Error correction level</label>
                <select value={formData.qrErrorCorrection} onChange={(e) => setFormData({...formData, qrErrorCorrection: e.target.value})} className="bg-[#141414] border border-[#262626] rounded-lg px-4 py-2 text-sm text-white">
                  <option value="L">Low (7%)</option>
                  <option value="M">Medium (15%)</option>
                  <option value="Q">Quartile (25%)</option>
                  <option value="H">High (30%)</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-red-500/80 text-xs">
              <ShieldAlert className="w-4 h-4" />
              <span>QR code might not be readable. Please check and try adjusting the settings</span>
            </div>
          </div>
        );
      case 'robots':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Robots Policy</h2>
              <p className="text-gray-400">Control how search engines crawl your short links.</p>
            </div>
            <div className="space-y-6">
              <div className="p-6 bg-[#141414] border border-[#262626] rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-semibold">Index Short Links</h4>
                    <p className="text-sm text-gray-500">Allow search engines to index your short links.</p>
                  </div>
                  <div className="w-12 h-6 bg-[#262626] rounded-full relative cursor-pointer">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-semibold">Follow Redirects</h4>
                    <p className="text-sm text-gray-500">Allow search engines to follow the destination URL.</p>
                  </div>
                  <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'restrict':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Restrict Destinations</h2>
              <p className="text-gray-400">Limit which domains your links can redirect to.</p>
            </div>
            <div className="space-y-6">
              <div className="p-6 bg-[#141414] border border-[#262626] rounded-2xl space-y-4">
                <p className="text-sm text-gray-400">Add domains to the allowlist. Any link trying to redirect to a domain not on this list will be blocked.</p>
                <div className="flex gap-2">
                  <input type="text" placeholder="example.com" className="flex-1 bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-2 text-sm text-white" />
                  <button className="px-4 py-2 bg-emerald-500 text-white text-sm font-bold rounded-lg">Add Domain</button>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
            <Info className="w-12 h-12 mb-4 opacity-20" />
            <p>This section is currently under development.</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-[#262626] w-full max-w-6xl h-[90vh] rounded-3xl overflow-hidden flex shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Sidebar */}
        <div className="w-72 bg-[#141414] border-r border-[#262626] flex flex-col">
          <div className="p-6 border-b border-[#262626]">
            <h3 className="text-white font-bold text-lg">Domain settings</h3>
            <p className="text-xs text-gray-500 mt-1">{domain.hostname}</p>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  activeSection === section.id 
                    ? "bg-emerald-500/10 text-emerald-500" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <section.icon className={cn("w-5 h-5", activeSection === section.id ? "text-emerald-500" : "text-gray-500")} />
                {section.label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-[#262626]">
            <button 
              onClick={onClose}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to domains
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col bg-[#0a0a0a]">
          <div className="flex-1 p-12 overflow-y-auto">
            {renderSection()}
          </div>
          
          <div className="p-8 bg-[#141414] border-t border-[#262626] flex items-center justify-center gap-4">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-12 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              SAVE
            </button>
            <button 
              onClick={onClose}
              className="px-12 py-3 bg-transparent border border-[#262626] text-gray-400 font-bold rounded-xl hover:text-white hover:bg-white/5 transition-all"
            >
              CANCEL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
