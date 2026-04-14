import React from 'react';
import { 
  LayoutDashboard, 
  Link as LinkIcon, 
  Globe, 
  Settings, 
  BarChart3, 
  History,
  ShieldCheck,
  LogOut,
  Target
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
  { icon: LinkIcon, label: 'Links', id: 'links' },
  { icon: Globe, label: 'Domains', id: 'domains' },
  { icon: Target, label: 'Conversions', id: 'conversions' },
  { icon: BarChart3, label: 'Analytics', id: 'analytics' },
  { icon: History, label: 'Audit Logs', id: 'audit' },
  { icon: ShieldCheck, label: 'Security', id: 'security' },
  { icon: Settings, label: 'Settings', id: 'settings' },
];

interface SidebarProps {
  activeTab: string;
  setActiveTab: (id: string) => void;
  onLogout: () => void;
  userRole?: 'ADMIN' | 'MEMBER' | null;
}

export default function Sidebar({ activeTab, setActiveTab, onLogout, userRole }: SidebarProps) {
  const filteredMenuItems = menuItems.filter(item => {
    if (userRole === 'MEMBER') {
      // Hide Audit Logs and Security for members
      if (item.id === 'audit' || item.id === 'security') return false;
    }
    return true;
  });

  return (
    <aside className="w-64 bg-[#141414] border-r border-[#262626] flex flex-col h-screen sticky top-0">
      <div className="p-6 border-bottom border-[#262626]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
            <LinkIcon className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">Thinksmart <span className="text-orange-500 text-xs align-top">PRO</span></span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {filteredMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
              activeTab === item.id 
                ? "bg-orange-500/10 text-orange-500 border border-orange-500/20" 
                : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-orange-500" : "group-hover:text-white")} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-[#262626]">
        <div 
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white cursor-pointer transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </div>
      </div>
    </aside>
  );
}
