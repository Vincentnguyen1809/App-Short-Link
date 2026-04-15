import React, { useState, useEffect } from 'react';
import { Shield, Users, Lock, Eye, EyeOff, Trash2, Plus, Save, RefreshCw, Briefcase } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface OrganizationSettingsProps {
  userRole?: 'ADMIN' | 'MEMBER' | null;
}

export default function OrganizationSettings({ userRole }: OrganizationSettingsProps) {
  const [workspace, setWorkspace] = useState({ name: '', slug: '' });
  const [appearance, setAppearance] = useState({
    backgroundUrl: '',
    logoUrl: ''
  });
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isMember = userRole === 'MEMBER';

  const fetchUsers = async () => {
    const token = localStorage.getItem('ts_token');
    if (!token) return;
    try {
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data: any[] = await res.json();
        setUsers(data);
      }
    } catch (err: any) {
      console.error('Failed to fetch users', err);
    }
  };

  useEffect(() => {
    const promises = [
      fetch('/api/workspace').then(res => res.json()),
      fetch('/api/settings/appearance').then(res => res.json())
    ];

    if (!isMember) {
      fetchUsers();
    }

    Promise.all(promises)
      .then(([workspaceData, appearanceData]: [any, any]) => {
        setWorkspace(workspaceData);
        setAppearance(appearanceData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch settings:', err);
        setLoading(false);
      });
  }, [isMember]);

  const handleUpdateUserStatus = async (userId: string, status: string) => {
    const token = localStorage.getItem('ts_token');
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const err: any = await res.json();
        alert(err.error || 'Failed to update user status');
      }
    } catch (err: any) {
      console.error('Error updating user status', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('ts_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await Promise.all([
        fetch('/api/workspace', {
          method: 'PATCH',
          headers,
          body: JSON.stringify(workspace)
        }),
        fetch('/api/settings/appearance', {
          method: 'PATCH',
          headers,
          body: JSON.stringify(appearance)
        })
      ]);
      // Show success toast or notification
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 pb-20">
      {/* Workspace Profile */}
      <section className="bg-[#1a1a1a] border border-[#262626] rounded-xl overflow-hidden">
        <div className="p-6 border-b border-[#262626] flex items-center justify-between bg-[#141414]">
          <div className="flex items-center gap-3">
            <Briefcase className="w-5 h-5 text-orange-500" />
            <h3 className="text-white font-bold">Workspace Profile</h3>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Changes
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Workspace Name</label>
              <input 
                type="text" 
                value={workspace.name}
                onChange={(e) => setWorkspace({ ...workspace, name: e.target.value })}
                disabled={isMember}
                placeholder="ThinkSmart" 
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-2.5 text-sm text-white focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Workspace Slug</label>
              <div className="flex items-center">
                <span className="bg-[#141414] border border-r-0 border-[#262626] rounded-l-lg px-3 py-2.5 text-sm text-gray-500">app.thinksmart/</span>
                <input 
                  type="text" 
                  value={workspace.slug}
                  onChange={(e) => setWorkspace({ ...workspace, slug: e.target.value })}
                  disabled={isMember}
                  placeholder="default" 
                  className="flex-1 bg-[#0a0a0a] border border-[#262626] rounded-r-lg px-4 py-2.5 text-sm text-white focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Appearance Settings */}
      <section className="bg-[#1a1a1a] border border-[#262626] rounded-xl overflow-hidden">
        <div className="p-6 border-b border-[#262626] flex items-center justify-between bg-[#141414]">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-orange-500" />
            <h3 className="text-white font-bold">Appearance Settings</h3>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Login Background URL</label>
              <input 
                type="text" 
                value={appearance.backgroundUrl}
                onChange={(e) => setAppearance({ ...appearance, backgroundUrl: e.target.value })}
                disabled={isMember}
                placeholder="https://images.unsplash.com/..." 
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-2.5 text-sm text-white focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed" 
              />
              <p className="text-[10px] text-gray-500 mt-2">The image displayed on the login, registration, and password recovery pages.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Custom Logo URL (Optional)</label>
              <input 
                type="text" 
                value={appearance.logoUrl || ''}
                onChange={(e) => setAppearance({ ...appearance, logoUrl: e.target.value })}
                disabled={isMember}
                placeholder="https://your-domain.com/logo.png" 
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-2.5 text-sm text-white focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed" 
              />
              <p className="text-[10px] text-gray-500 mt-2">Replaces the default ThinkSmart icon on the login page.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team & Permissions Section */}
      {!isMember && (
        <section className="bg-[#1a1a1a] border border-[#262626] rounded-xl overflow-hidden">
          <div className="p-6 border-b border-[#262626] flex items-center justify-between bg-[#141414]">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-orange-500" />
              <h3 className="text-white font-bold">Team & Permissions</h3>
            </div>
            <button className="px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" /> Invite Member
            </button>
          </div>
          <div className="p-0">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#141414] text-gray-500 text-[10px] uppercase tracking-wider border-b border-[#262626]">
                  <th className="px-6 py-3 font-medium">User</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {users.map((user) => (
                  <tr key={user.email} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{user.name || 'No Name'}</span>
                        <span className="text-xs text-gray-500">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                        user.role === 'ADMIN' ? "bg-orange-500/10 text-orange-500" : "bg-blue-500/10 text-blue-500"
                      )}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className={cn("w-1.5 h-1.5 rounded-full", 
                          user.status === 'ACTIVE' ? "bg-green-500" : 
                          user.status === 'PENDING' ? "bg-yellow-500" : "bg-red-500"
                        )} />
                        <span className="text-xs text-gray-400">{user.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.status === 'PENDING' && (
                          <button 
                            onClick={() => handleUpdateUserStatus(user.id, 'ACTIVE')}
                            className="px-2 py-1 bg-green-500/10 text-green-500 text-xs font-medium rounded hover:bg-green-500/20 transition-colors"
                          >
                            Approve
                          </button>
                        )}
                        {user.status === 'ACTIVE' && user.role !== 'ADMIN' && (
                          <button 
                            onClick={() => handleUpdateUserStatus(user.id, 'SUSPENDED')}
                            className="px-2 py-1 bg-red-500/10 text-red-500 text-xs font-medium rounded hover:bg-red-500/20 transition-colors"
                          >
                            Suspend
                          </button>
                        )}
                        {user.status === 'SUSPENDED' && (
                          <button 
                            onClick={() => handleUpdateUserStatus(user.id, 'ACTIVE')}
                            className="px-2 py-1 bg-green-500/10 text-green-500 text-xs font-medium rounded hover:bg-green-500/20 transition-colors"
                          >
                            Unsuspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* IP Exclusion Section */}
      <section className="bg-[#1a1a1a] border border-[#262626] rounded-xl overflow-hidden">
        <div className="p-6 border-b border-[#262626] flex items-center justify-between bg-[#141414]">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-orange-500" />
            <h3 className="text-white font-bold">IP Exclusion</h3>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-400">Exclude internal IP addresses from analytics to ensure data accuracy.</p>
          <div className="space-y-3">
            {[
              { label: 'Office HQ', ip: '113.161.45.22' },
              { label: 'Dev Team VPN', ip: '203.125.12.0/24' },
            ].map((item) => (
              <div key={item.ip} className="flex items-center justify-between p-3 bg-[#141414] border border-[#262626] rounded-lg">
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs font-mono text-gray-500">{item.ip}</p>
                </div>
                <button className="p-2 text-gray-500 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <input 
              type="text" 
              placeholder="Label (e.g. Home)" 
              className="flex-1 bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500"
            />
            <input 
              type="text" 
              placeholder="IP Address or CIDR" 
              className="flex-1 bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500"
            />
            <button className="px-4 py-2 bg-[#262626] text-white text-sm font-bold rounded-lg hover:bg-[#333]">
              Add
            </button>
          </div>
        </div>
      </section>

      {/* Global Tracking Section */}
      <section className="bg-[#1a1a1a] border border-[#262626] rounded-xl overflow-hidden">
        <div className="p-6 border-b border-[#262626] flex items-center justify-between bg-[#141414]">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-orange-500" />
            <h3 className="text-white font-bold">Global Tracking & Security</h3>
          </div>
          <button className="px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2">
            <Save className="w-3.5 h-3.5" /> Save Changes
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Google Analytics 4 ID</label>
              <input type="text" placeholder="G-XXXXXXXXXX" className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-2.5 text-sm text-white focus:border-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Meta Pixel ID</label>
              <input type="text" placeholder="1234567890" className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-2.5 text-sm text-white focus:border-orange-500" />
            </div>
          </div>
          
          <div className="space-y-4 pt-4 border-t border-[#262626]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Restrict Destination Domains</p>
                <p className="text-xs text-gray-500">Only allow shortening links to approved domains.</p>
              </div>
              <div className="w-10 h-5 bg-orange-500 rounded-full relative cursor-pointer">
                <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Enforce HTTPS</p>
                <p className="text-xs text-gray-500">Automatically redirect HTTP destination URLs to HTTPS.</p>
              </div>
              <div className="w-10 h-5 bg-orange-500 rounded-full relative cursor-pointer">
                <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
