import { Activity, Shield, FileText, BarChart2, Zap, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import type { Incident } from '../types';

const NAV_ITEMS = [
  { name: 'Dashboard', icon: Activity, path: '/' },
  { name: 'Incidents', icon: Shield, path: '/incidents' },
  { name: 'RCA', icon: FileText, path: '/rca' },
  { name: 'Reports', icon: BarChart2, path: '/reports' },
  { name: 'Signals', icon: Zap, path: '/signals' },
  { name: 'Settings', icon: Settings, path: '/settings' },
];

interface SidebarProps {
  incidents: Incident[];
}

export function Sidebar({ incidents }: SidebarProps) {
  const activeCount = incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length;

  return (
    <aside className="w-full bg-surface border-r border-border-dim flex flex-col h-screen shrink-0 relative z-20">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center border border-primary/20">
          <Activity className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h1 className="font-bold text-sm leading-none text-white tracking-tight uppercase">Vantage</h1>
          <p className="text-[8px] text-slate-500 font-bold tracking-[0.2em] uppercase mt-1">Workspace</p>
        </div>
      </div>
      
      <nav className="flex-1 px-3 py-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => clsx(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-[10px] font-bold uppercase tracking-wider border",
                isActive
                  ? "bg-primary/5 text-primary border-primary/10 shadow-sm"
                  : "text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/5"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.name}
              {item.name === 'Incidents' && activeCount > 0 && (
                <span className="ml-auto bg-critical/10 text-critical text-[9px] px-1.5 py-0.5 rounded border border-critical/20">
                  {activeCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border-dim">
        <div className="flex items-center gap-2 mb-2 opacity-50">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Active Status</span>
        </div>
        <div className="text-[9px] font-bold text-slate-400 uppercase">
          {activeCount > 0 ? `${activeCount} Issues Found` : "Nominal"}
        </div>
      </div>
    </aside>
  );
}
