import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Bell, RefreshCw, Terminal, CheckCircle, AlertCircle, Info, Menu } from 'lucide-react';
import type { Incident } from '../types';
import clsx from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
  incidents: Incident[];
  onRefresh?: () => Promise<void>;
  onRunSimulation?: () => Promise<void>;
  metrics: { throughput: number };
}


export function Layout({ children, incidents, onRefresh, onRunSimulation, metrics }: LayoutProps) {
  const location = useLocation();
  const activeCount = incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' | 'error' } | null>(null);

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setToast({ message: 'Metrics updated', type: 'info' });
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  const handleSimulate = async () => {
    if (onRunSimulation) {
      setIsSimulating(true);
      setToast({ message: 'Simulation starting...', type: 'info' });
      await onRunSimulation();
      setTimeout(() => {
        setIsSimulating(false);
        setToast({ message: 'Simulation in progress', type: 'success' });
      }, 2000);
    }
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-bg-base text-slate-400 font-sans relative">
      
      {/* Sidebar */}
      <div className={clsx(
        "fixed inset-0 z-[60] lg:relative lg:inset-auto lg:z-auto transition-transform duration-300 lg:translate-x-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {mobileMenuOpen && (
          <div className="absolute inset-0 bg-black/60 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
        )}
        <div className="relative h-full w-60">
          <Sidebar incidents={incidents} />
        </div>
      </div>
      
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100] animate-in fade-in slide-in-from-right-4 duration-300">
          <div className={clsx(
            "flex items-center gap-2 px-3 py-2 rounded-md border shadow-sm bg-card",
            toast.type === 'success' ? "border-emerald-500/20 text-emerald-500" :
            toast.type === 'error' ? "border-critical/20 text-critical" : "border-primary/20 text-primary"
          )}>
            {toast.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : 
             toast.type === 'error' ? <AlertCircle className="w-3.5 h-3.5" /> : <Info className="w-3.5 h-3.5" />}
            <span className="text-[10px] font-bold uppercase tracking-wider">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Thin Status Strip */}
        <header className="h-10 shrink-0 border-b border-border-dim bg-bg-base flex items-center justify-between px-6 z-50">
          <div className="flex items-center gap-6">
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-1 text-slate-500 hover:text-primary">
              <Menu className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
              <div className="flex items-center gap-2 text-primary/80">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" />
                System Healthy
              </div>
              <div className="w-px h-3 bg-border-dim" />
              <div className="text-slate-500">
                <span className="text-white">{activeCount}</span> Active Issues
              </div>
              <div className="w-px h-3 bg-border-dim" />
              <div className="text-slate-500">
                <span className="text-white">{metrics.throughput.toFixed(1)}</span> events/s
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {onRunSimulation && (
              <button 
                onClick={handleSimulate}
                disabled={isSimulating}
                className={clsx(
                  "flex items-center gap-2 px-3 py-1 rounded-md border text-[9px] font-bold uppercase tracking-widest transition-all",
                  isSimulating 
                    ? "bg-slate-800 border-white/5 text-slate-600"
                    : "bg-surface border-border-dim text-slate-400 hover:text-white hover:bg-border-dim"
                )}
              >
                {isSimulating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Terminal className="w-3 h-3" />}
                <span>{isSimulating ? 'Processing...' : 'Submit Signal'}</span>
              </button>
            )}

            <button onClick={handleRefresh} className={clsx("p-1.5 text-slate-500 hover:text-primary transition-colors", isRefreshing && "animate-spin")}>
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <div className="relative">
              <button 
                onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
                className={clsx("p-1.5 rounded-md transition-all relative", showNotifications ? "text-primary bg-primary/10" : "text-slate-500 hover:text-primary")}
              >
                <Bell className="w-3.5 h-3.5" />
                {activeCount > 0 && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-critical rounded-full border border-bg-base" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-card border border-border-dim rounded-md shadow-xl overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-3 py-2 border-b border-border-dim flex items-center justify-between bg-surface">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Notifications</span>
                    <span className="text-[9px] font-bold text-critical">{activeCount} New</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {incidents.slice(0, 5).map(inc => (
                      <div key={inc.id} className="px-3 py-2 border-b border-border-dim/50 hover:bg-white/5 cursor-pointer">
                        <div className="text-[10px] font-bold text-slate-300">{inc.severity} Incident Reported</div>
                        <div className="text-[9px] text-slate-500 mt-0.5 uppercase">{inc.component_id}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative pl-2 border-l border-border-dim">
              <button onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }} className="flex items-center gap-2 group">
                <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                  JD
                </div>
              </button>

              {showProfile && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-card border border-border-dim rounded-md shadow-xl overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-3 border-b border-border-dim bg-surface">
                    <div className="text-[10px] font-bold text-white uppercase">John Doe</div>
                    <div className="text-[9px] text-slate-500 mt-0.5 uppercase">SRE Engineer</div>
                  </div>
                  <div className="p-1">
                    <button className="w-full text-left px-2 py-1.5 rounded-md text-[9px] font-bold text-slate-400 hover:text-white hover:bg-white/5 uppercase">Settings</button>
                    <button className="w-full text-left px-2 py-1.5 rounded-md text-[9px] font-bold text-critical hover:bg-critical/10 uppercase">Logout</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area - No Inner Card Shadows */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative bg-bg-base">
          {children}
        </main>
      </div>
    </div>
  );
}
