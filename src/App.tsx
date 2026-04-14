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
import { MousePointer2, Users, Globe2, Clock, Plus, Settings, AlertCircle, Target } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('ts_token'));
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isDomainModalOpen, setIsDomainModalOpen] = useState(false);
  const [summary, setSummary] = useState({ totalClicks: 0, uniqueVisitors: 0, dbConnected: true });
  const [detailedData, setDetailedData] = useState<any>(null);
  const [loadingDetailed, setLoadingDetailed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const handleLogin = (token: string) => {
    localStorage.setItem('ts_token', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('ts_token');
    setIsAuthenticated(false);
  };

  const refreshData = () => setRefreshKey(prev => prev + 1);

  React.useEffect(() => {
    if (!isAuthenticated) return;
    
    const params = new URLSearchParams();
    if (dateRange.start) params.append('start', dateRange.start);
    if (dateRange.end) params.append('end', dateRange.end);

    fetch(`/api/analytics/summary?${params.toString()}`)
      .then(res => res.json())
      .then((data: any) => {
        if (data) {
          setSummary(data);
        }
      })
      .catch(console.error);

    setLoadingDetailed(true);
    fetch(`/api/analytics/detailed?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setDetailedData(data);
        setLoadingDetailed(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingDetailed(false);
      });
  }, [refreshKey, dateRange]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            {!summary.dbConnected && (
              <div className="mb-8 p-4 bg-orange-500/10 border border-orange-500/50 rounded-xl flex items-center gap-3 text-orange-500">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div className="text-sm">
                  <p className="font-bold">Database Connection Required</p>
                  <p className="opacity-90">Please configure your <strong>DATABASE_URL</strong> in the <strong>Secrets</strong> panel to enable data persistence and analytics.</p>
                </div>
              </div>
            )}
            <header className="flex items-center justify-between mb-10">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard Overview</h1>
                <p className="text-gray-400 mt-1">Real-time performance of your link ecosystem.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-[#1a1a1a] border border-[#262626] rounded-lg px-3 py-1.5 gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <select 
                    className="bg-transparent text-sm text-gray-300 focus:outline-none"
                    onChange={(e) => {
                      const val = e.target.value;
                      const now = new Date();
                      let start = '';
                      if (val === '24h') start = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
                      if (val === '7d') start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
                      if (val === '30d') start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
                      setDateRange({ start, end: '' });
                    }}
                  >
                    <option value="all" className="bg-[#1a1a1a]">All Time</option>
                    <option value="24h" className="bg-[#1a1a1a]">Last 24 Hours</option>
                    <option value="7d" className="bg-[#1a1a1a]">Last 7 Days</option>
                    <option value="30d" className="bg-[#1a1a1a]">Last 30 Days</option>
                  </select>
                </div>
                <button 
                  onClick={() => setIsLinkModalOpen(true)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Create Link
                </button>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard 
                title="Total Clicks" 
                value={(summary.totalClicks || 0).toLocaleString()} 
                change="+12.5%" 
                isUp={true} 
                icon={MousePointer2} 
                color="bg-orange-500"
              />
              <StatCard 
                title="Unique Visitors" 
                value={(summary.uniqueVisitors || 0).toLocaleString()} 
                change="+8.2%" 
                isUp={true} 
                icon={Users} 
                color="bg-blue-500"
              />
              <StatCard 
                title="Active Domains" 
                value="12" 
                change="0%" 
                isUp={true} 
                icon={Globe2} 
                color="bg-purple-500"
              />
              <StatCard 
                title="Avg. Redirect" 
                value="248ms" 
                change="-14ms" 
                isUp={true} 
                icon={Clock} 
                color="bg-green-500"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <div className="lg:col-span-3">
                <AnalyticsChart />
              </div>
            </div>

            <TopWidgets data={detailedData} loading={loadingDetailed} />

            <div className="mt-8 bg-[#1a1a1a] rounded-xl border border-[#262626] overflow-hidden">
              <div className="p-6 border-b border-[#262626] flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Recent Click Stream</h3>
                <button className="text-sm text-orange-500 hover:underline">View all logs</button>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#141414] text-gray-400 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-medium">Time</th>
                    <th className="px-6 py-4 font-medium">Link</th>
                    <th className="px-6 py-4 font-medium">Location</th>
                    <th className="px-6 py-4 font-medium">Device</th>
                    <th className="px-6 py-4 font-medium">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626]">
                  {[
                    { time: '2 mins ago', link: 's.thinksmart/promo', geo: 'Vietnam', device: 'iPhone', ip: '113.161.x.x' },
                    { time: '5 mins ago', link: 's.thinksmart/event', geo: 'Singapore', device: 'Chrome / Win', ip: '203.125.x.x' },
                    { time: '12 mins ago', link: 's.thinksmart/job', geo: 'USA', device: 'Android', ip: '66.249.x.x' },
                    { time: '15 mins ago', link: 's.thinksmart/promo', geo: 'Vietnam', device: 'MacBook', ip: '113.161.x.x' },
                  ].map((log, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 text-sm text-gray-400">{log.time}</td>
                      <td className="px-6 py-4 text-sm font-medium text-white">{log.link}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{log.geo}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{log.device}</td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-500">{log.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        );
      case 'links':
        return (
          <>
            <header className="flex items-center justify-between mb-10">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Managing Links</h1>
                <p className="text-gray-400 mt-1">Manage, organize and track your short links.</p>
              </div>
              <button 
                onClick={() => setIsLinkModalOpen(true)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create Link
              </button>
            </header>
            <LinkTable key={`links-${refreshKey}`} />
          </>
        );
      case 'domains':
        return (
          <>
            <header className="flex items-center justify-between mb-10">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Custom Domains</h1>
                <p className="text-gray-400 mt-1">Configure and monitor your branded domains.</p>
              </div>
              <button 
                onClick={() => setIsDomainModalOpen(true)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Domain
              </button>
            </header>
            <DomainList key={`domains-${refreshKey}`} onAddClick={() => setIsDomainModalOpen(true)} />
          </>
        );
      case 'analytics':
        return (
          <>
            <header className="flex items-center justify-between mb-10">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Deep Analytics</h1>
                <p className="text-gray-400 mt-1">Granular insights into your traffic distribution.</p>
              </div>
              <div className="flex items-center bg-[#1a1a1a] border border-[#262626] rounded-lg px-3 py-1.5 gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <select 
                  className="bg-transparent text-sm text-gray-300 focus:outline-none"
                  value={dateRange.start ? (dateRange.start.includes('24') ? '24h' : dateRange.start.includes('7') ? '7d' : '30d') : 'all'}
                  onChange={(e) => {
                    const val = e.target.value;
                    const now = new Date();
                    let start = '';
                    if (val === '24h') start = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
                    if (val === '7d') start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
                    if (val === '30d') start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
                    setDateRange({ start, end: '' });
                  }}
                >
                  <option value="all" className="bg-[#1a1a1a]">All Time</option>
                  <option value="24h" className="bg-[#1a1a1a]">Last 24 Hours</option>
                  <option value="7d" className="bg-[#1a1a1a]">Last 7 Days</option>
                  <option value="30d" className="bg-[#1a1a1a]">Last 30 Days</option>
                </select>
              </div>
            </header>
            <AnalyticsView key={`analytics-${refreshKey}`} dateRange={dateRange} />
          </>
        );
      case 'audit':
        return (
          <>
            <header className="flex items-center justify-between mb-10">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Audit Logs</h1>
                <p className="text-gray-400 mt-1">Track every action within your organization.</p>
              </div>
            </header>
            <AuditLogView key={`audit-${refreshKey}`} />
          </>
        );
      case 'conversions':
        return <ConversionReport key={`conversions-${refreshKey}`} />;
      case 'security':
        return <SecurityView />;
      case 'settings':
        return (
          <>
            <header className="flex items-center justify-between mb-10">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Organization Settings</h1>
                <p className="text-gray-400 mt-1">Manage team permissions and workspace profile.</p>
              </div>
            </header>
            <OrganizationSettings />
          </>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4 border border-[#262626]">
              <Settings className="w-8 h-8 text-gray-500 animate-spin-slow" />
            </div>
            <h2 className="text-xl font-semibold text-white">Module Under Construction</h2>
            <p className="text-gray-400 mt-2 max-w-sm">We are currently building the {activeTab} module. Check back soon!</p>
          </div>
        );
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-gray-100 font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      
      <main className="flex-1 p-8 overflow-y-auto">
        {renderContent()}
      </main>

      <CreateLinkModal 
        isOpen={isLinkModalOpen} 
        onClose={() => setIsLinkModalOpen(false)} 
        onSuccess={refreshData}
      />
      <AddDomainModal 
        isOpen={isDomainModalOpen} 
        onClose={() => setIsDomainModalOpen(false)} 
        onSuccess={refreshData}
      />
    </div>
  );
}



