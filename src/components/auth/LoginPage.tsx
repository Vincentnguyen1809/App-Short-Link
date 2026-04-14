import React, { useState } from 'react';
import { Link as LinkIcon, Lock, Mail, RefreshCw, AlertCircle, User, CheckCircle2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface LoginPageProps {
  onLogin: (token: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('admin@thinksmartins.com');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [appearance, setAppearance] = useState({
    backgroundUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&q=80&w=2070',
    logoUrl: null
  });

  React.useEffect(() => {
    fetch('/api/settings/appearance')
      .then(res => res.json())
      .then((data: any) => setAppearance(data))
      .catch(err => console.error('Failed to fetch appearance settings:', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    let endpoint = '/api/auth/login';
    let body: any = { email, password };

    if (mode === 'register') {
      endpoint = '/api/auth/register';
      body = { email, password, name };
    } else if (mode === 'forgot') {
      endpoint = '/api/auth/forgot-password';
      body = { email };
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json() as any;

      if (res.ok) {
        if (mode === 'register' || mode === 'forgot') {
          setSuccess(data.message);
          setMode('login');
        } else {
          onLogin(data.token);
        }
      } else {
        setError(data.error || 'Thao tác thất bại. Vui lòng kiểm tra lại.');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={appearance.backgroundUrl} 
          alt="Background" 
          className="w-full h-full object-cover opacity-50"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a]/90 via-[#0a0a0a]/60 to-orange-900/40" />
      </div>

      <div className="w-full max-w-[440px] bg-[#1a1a1a]/90 backdrop-blur-2xl border border-[#262626] rounded-[32px] p-10 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20 overflow-hidden">
            {appearance.logoUrl ? (
              <img src={appearance.logoUrl} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <LinkIcon className="text-white w-8 h-8" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">ThinkSmart Links</h1>
          <p className="text-gray-500 text-sm">
            {mode === 'register' ? 'Đăng ký tài khoản mới' : 
             mode === 'forgot' ? 'Khôi phục mật khẩu' : 
             'Hệ thống rút gọn link nội bộ'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-500 text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3 text-emerald-500 text-sm animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <p>{success}</p>
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-left-4 duration-300">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Họ và tên</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-orange-500 transition-colors" />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  required={mode === 'register'}
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl pl-12 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-orange-500 transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-orange-500 transition-colors" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@thinksmartins.com"
                required
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl pl-12 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-orange-500 transition-all"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Mật khẩu</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-orange-500 transition-colors" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl pl-12 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-orange-500 transition-all"
                />
              </div>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 border border-orange-600 text-white font-bold py-4 rounded-xl hover:bg-orange-600 transition-all flex items-center justify-center gap-2 mt-4 active:scale-[0.98] shadow-lg shadow-orange-500/20"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 
             (mode === 'register' ? 'Đăng ký ngay' : 
              mode === 'forgot' ? 'Gửi yêu cầu' : 
              'Đăng nhập')}
          </button>

          {mode === 'login' && (
            <div className="text-center">
              <button 
                type="button"
                onClick={() => setMode('forgot')}
                className="text-[11px] font-bold text-gray-500 uppercase tracking-wider hover:text-orange-500 transition-colors"
              >
                Quên mật khẩu?
              </button>
            </div>
          )}
        </form>

        <div className="mt-8 text-center space-y-4">
          <button 
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
              setSuccess('');
            }}
            className="text-sm text-gray-400 hover:text-orange-500 transition-colors"
          >
            {mode === 'register' ? 'Đã có tài khoản? Đăng nhập' : 
             mode === 'forgot' ? 'Quay lại đăng nhập' : 
             'Chưa có tài khoản? Đăng ký'}
          </button>
          <p className="text-[11px] text-gray-600 font-medium">ThinkSmart Insurance © 2025</p>
        </div>
      </div>
    </div>
  );
}
