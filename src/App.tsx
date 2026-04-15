import React, { useState } from 'react';
import Sidebar from './components/shared/Sidebar';
import StatCard from './components/dashboard/StatCard';
import AnalyticsChart from './components/dashboard/AnalyticsChart';
import TopWidgets from './components/dashboard/TopWidgets';
import LinkTable from './components/links/LinkTable';
import CreateLinkModal from './components/links/CreateLinkModal';
import DomainList from './components/domains/DomainList';
import AddDomainModal from './components/domains/AddDomainModal';
import OrganizationSettings from './components/settings/OrganizationSettings';
import AnalyticsView from './components/analytics/AnalyticsView';
import AuditLogView from './components/audit/AuditLogView';
import ConversionReport from './components/conversions/ConversionReport';
import SecurityView from './components/security/SecurityView';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './pages/Register'; 
import { MousePointer2, Users, Globe2, Clock, Plus, Settings, AlertCircle } from 'lucide-react';

export default function App() {
  // --- AUTH & USER STATES ---
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('ts_token'));
  const [authView, setAuthView] = useState<'login' | 'register'>('login'); 
  const [userRole, setUserRole] = useState<'ADMIN' | 'MEMBER' | null>(null);
  
  // --- INTERFACE STATES ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isDomainModalOpen, setIsDomainModalOpen] = useState(false);
  const [summary, setSummary] = useState({ totalClicks: 0, uniqueVisitors: 0, dbConnected: true });
  const [detailedData, setDetailedData] = useState<any>(null);
  const [loadingDetailed, setLoadingDetailed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // --- TOKEN DECODING (Hàm giải mã JWT của Vincent) ---
  React.useEffect(() => {
    const token = localStorage.getItem('ts_token');
    if (token) {
      try {
        const payloadPart = token.split('.')[1];
        if (!payloadPart) throw new Error('Invalid format');
        const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
        const payload = JSON.parse(atob(padded));
        setUserRole(payload.role);
      } catch (e) {
        if (token === 'mock-jwt-token-123') {
           setUserRole('ADMIN');
        } else {
           localStorage.removeItem('ts_token');
           setIsAuthenticated(false);
        }
      }
    }
  }, [isAuthenticated]);

  const handleLogin = (token: string) => {
    localStorage.setItem('ts_token', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('ts_token');
    setIsAuthenticated(false);
    setAuthView('login');
  };

  const refreshData = () => setRefreshKey(prev => prev + 1);

  // --- ANALYTICS FETCHING ---
  React.useEffect(() => {
    if (!isAuthenticated) return;
    const params = new URLSearchParams();
    if (dateRange.start) params.append('start', dateRange.start);
    if (dateRange.end) params.append('end', dateRange.end);

    fetch(`/api/analytics/summary?${params.toString()}`)
      .then(res => res.json())
      .then((data: any) => { if (data) setSummary(data); })
      .catch(console.error);

    setLoadingDetailed(true);
    fetch(`/api/analytics/detailed?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setDetailedData(data);
        setLoadingDetailed(false);
      })
      .catch(() => setLoadingDetailed(false));
  }, [refreshKey, dateRange, isAuthenticated]);

  // --- RENDER CONTENT (Bản đầy đủ các Tab của Vincent) ---
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            {!summary.dbConnected && (
              <div className="mb-8 p-4 bg-orange-500/10 border border-orange-500/50 rounded-xl flex items-center gap-3 text-orange-500">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div className="text-sm font-bold">Database Connection Required</div>
              </div>
            )}
            <header className="flex items-center justify-between mb-10">
              <div>
                <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
                <p className="text-gray-400 mt-1">Hệ thống ThinkSmart Links của Vincent.</p>
              </div>
              <button onClick={() => setIsLinkModalOpen(true)} className="px-4 py-2 bg-orange-500 text-white rounded-lg flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create Link
              </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard title="Total Clicks" value={(summary.totalClicks || 0).toLocaleString()} icon={MousePointer2} color="bg-orange-500" />
              <StatCard title="Unique Visitors" value={(summary.uniqueVisitors || 0).toLocaleString()} icon={Users} color="bg-blue-500" />
              <StatCard title="Active Domains" value="12" icon={Globe2} color="bg-purple-500" />
              <StatCard title="Avg. Redirect" value="248ms" icon={Clock} color="bg-green-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <div className="lg:col-span-3"><AnalyticsChart /></div>
            </div>

            <TopWidgets data={detailedData} loading={loadingDetailed} />

            {/* BẢNG RECENT CLICKS - Vincent đừng lo, nó ở đây! */}
            <div className="mt-8 bg-[#1a1a1a] rounded-xl border border-[#262626] overflow-hidden">
              <div className="p-6 border-b border-[#262626] flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Recent Click Stream</h3>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#141414] text-gray-400 text-xs uppercase">
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4">Link</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Device</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626]">
                  {[
                    { time: '2 mins ago', link: 's.thinksmart/promo', geo: 'Vietnam', device: 'iPhone' },
                    { time: '5 mins ago', link: 's.thinksmart/event', geo: 'USA', device: 'Chrome' },
                  ].map((log, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-400">{log.time}</td>
                      <td className="px-6 py-4 text-sm font-medium text-white">{log.link}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{log.geo}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{log.device}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        );
      case 'links': return <LinkTable key={`links-${refreshKey}`} />;
      case 'domains': return <DomainList key={`domains-${refreshKey}`} onAddClick={() => setIsDomainModalOpen(true)} userRole={userRole} />;
      case 'analytics': return <AnalyticsView key={`analytics-${refreshKey}`} dateRange={dateRange} />;
      case 'audit': return <AuditLogView key={`audit-${refreshKey}`} />;
      case 'settings': return <OrganizationSettings userRole={userRole} />;
      default: return <div className="text-white p-10">Module Under Construction</div>;
    }
  };

  // --- HIỂN THỊ ĐĂNG NHẬP / ĐĂNG KÝ ---
  if (!isAuthenticated) {
    return authView === 'login' 
      ? <LoginPage onLogin={handleLogin} onSwitchToRegister={() => setAuthView('register')} />
      : <RegisterPage onSwitchToLogin={() => setAuthView('login')} />;
  }

  // --- GIAO DIỆN CHÍNH ---
  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-gray-100 font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} userRole={userRole} />
      <main className="flex-1 p-8 overflow-y-auto">
        {renderContent()}
      </main>
      <CreateLinkModal isOpen={isLinkModalOpen} onClose={() => setIsLinkModalOpen(false)} onSuccess={refreshData} />
      <AddDomainModal isOpen={isDomainModalOpen} onClose={() => setIsDomainModalOpen(false)} onSuccess={refreshData} />
    </div>
  );
}
