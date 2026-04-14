import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  isUp: boolean;
  icon: LucideIcon;
  color: string;
}

export default function StatCard({ title, value, change, isUp, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#262626] hover:border-orange-500/50 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2 rounded-lg", color)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className={cn("flex items-center gap-1 text-sm font-medium", isUp ? "text-green-500" : "text-red-500")}>
          {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {change}
        </div>
      </div>
      <div>
        <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
      </div>
    </div>
  );
}
