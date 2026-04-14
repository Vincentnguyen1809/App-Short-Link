import React, { useState, useEffect } from 'react';
import { History, User, Tag, Link as LinkIcon, Globe, Trash2, Edit, PlusCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface AuditLog {
  id: string;
  user: { name: string; email: string };
  action: string;
  entityType: string;
  details: any;
  timestamp: string;
}

const actionIcons: Record<string, any> = {
  CREATE: PlusCircle,
  UPDATE: Edit,
  DELETE: Trash2,
  SSL_RENEW: Globe,
};

const actionColors: Record<string, string> = {
  CREATE: 'text-green-500',
  UPDATE: 'text-blue-500',
  DELETE: 'text-red-500',
  SSL_RENEW: 'text-purple-500',
};

export default function AuditLogView() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/audit-logs')
      .then(res => res.json())
      .then(json => {
        setLogs(Array.isArray(json) ? json : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch audit logs:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-[#262626] overflow-hidden">
      <div className="p-6 border-b border-[#262626] flex items-center justify-between bg-[#141414]">
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-white">System Audit Logs</h3>
        </div>
        <div className="flex gap-2">
          <select className="bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-1.5 text-xs text-gray-400 focus:border-orange-500">
            <option>All Users</option>
          </select>
          <select className="bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-1.5 text-xs text-gray-400 focus:border-orange-500">
            <option>All Actions</option>
          </select>
        </div>
      </div>

      <div className="divide-y divide-[#262626]">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No activity logs found.</div>
        ) : (
          logs.map((log) => {
            const Icon = actionIcons[log.action] || History;
            const color = actionColors[log.action] || 'text-gray-500';
            const target = log.details?.slug || log.details?.hostname || log.details?.title || 'Unknown';
            
            return (
              <div key={log.id} className="p-6 flex items-center gap-6 hover:bg-white/5 transition-colors group">
                <div className={cn("p-3 rounded-xl bg-white/5 shrink-0", color)}>
                  <Icon className="w-6 h-6" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white">{log.user?.name || 'System'}</span>
                    <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">{log.action}</span>
                  </div>
                  <p className="text-sm text-gray-400 truncate">
                    Modified <span className="text-white font-medium">{log.entityType}</span>: <span className="text-orange-500 font-mono">{target}</span>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500 font-medium">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                  </p>
                  <button className="text-[10px] text-orange-500/0 group-hover:text-orange-500 transition-all font-bold uppercase tracking-tighter mt-1">
                    View Details
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 bg-[#141414] border-t border-[#262626] text-center">
        <button className="text-sm text-gray-500 hover:text-white transition-colors">Load more activity</button>
      </div>
    </div>
  );
}
