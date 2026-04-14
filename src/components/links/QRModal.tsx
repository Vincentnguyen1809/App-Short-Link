import React, { useState, useEffect } from 'react';
import { X, Download, Copy, Check, RefreshCw } from 'lucide-react';
import { generateQRCode } from '@/src/lib/qr';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkUrl: string;
  linkTitle: string;
  domainSettings?: any;
}

export default function QRModal({ isOpen, onClose, linkUrl, linkTitle, domainSettings }: QRModalProps) {
  const [qrData, setQrData] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [color, setColor] = useState(domainSettings?.qrForegroundColor || '#f97316');

  useEffect(() => {
    if (isOpen) {
      handleGenerate();
    }
  }, [isOpen, color, domainSettings]);

  const handleGenerate = async () => {
    const data = await generateQRCode(linkUrl, {
      color: { 
        dark: color, 
        light: domainSettings?.qrBackgroundColor || '#ffffff' 
      },
      width: 1024,
      margin: domainSettings?.qrBorderRadius ? domainSettings.qrBorderRadius / 4 : 4,
      errorCorrectionLevel: domainSettings?.qrErrorCorrection || 'M'
    });
    setQrData(data);
  };

  const downloadQR = () => {
    if (!qrData) return;
    const link = document.createElement('a');
    link.href = qrData;
    link.download = `qr-${linkTitle.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-[#141414] border border-[#262626] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-[#262626] flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Dynamic QR Code</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 flex flex-col items-center">
          <div className="bg-white p-4 rounded-2xl mb-8 shadow-inner">
            {qrData ? (
              <img src={qrData} alt="QR Code" className="w-64 h-64" />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded-xl">
                <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            )}
          </div>

          <div className="w-full space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Customize Color</label>
              <div className="flex gap-3">
                {['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#000000'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      "w-10 h-10 rounded-full border-2 transition-all",
                      color === c ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-100"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={downloadQR}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors"
              >
                <Download className="w-4 h-4" /> Download PNG
              </button>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(linkUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1a1a1a] border border-[#262626] text-white rounded-xl font-bold hover:bg-[#262626] transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { cn } from '@/src/lib/utils';
