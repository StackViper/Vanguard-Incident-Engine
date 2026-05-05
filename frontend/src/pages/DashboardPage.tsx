import { StatCards } from '../components/StatCards';
import { IncidentList } from '../components/IncidentList';
import { IncidentDetails } from '../components/IncidentDetails';
import { LayoutPanelLeft, ListFilter, Activity } from 'lucide-react';
import type { Incident } from '../types';

interface DashboardPageProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onSelect: (id: string) => void;
  onClearSelection: () => void;
  onTransition: (state: string) => Promise<void>;
  onSubmitRCA: (data: any) => Promise<void>;
}

export function DashboardPage({ incidents, selectedIncident, onSelect, onClearSelection, onTransition, onSubmitRCA }: DashboardPageProps) {
  return (
    <div className="flex h-[calc(100vh-2.5rem)] overflow-hidden">
      {/* 1. Left Sidebar: Context & Summary */}
      <div className="w-64 shrink-0 border-r border-border-dim bg-bg-base flex flex-col">
         <div className="px-4 py-3 border-b border-border-dim bg-surface/20 flex items-center gap-2">
            <LayoutPanelLeft className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Workspace</span>
         </div>
         
         <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-4 space-y-6">
               <div className="bg-surface/10 rounded-md border border-border-dim p-4">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                     Fleet Status
                     <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>
                  <div className="space-y-3">
                     {[
                       { label: 'Uptime', value: '99.98%' },
                       { label: 'Latency', value: '142ms' },
                       { label: 'Saturation', value: '34%' }
                     ].map(m => (
                       <div key={m.label} className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">{m.label}</span>
                          <span className="text-[10px] font-mono font-bold text-slate-300">{m.value}</span>
                       </div>
                     ))}
                  </div>
               </div>

               <div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">Navigation</div>
                  <div className="space-y-1">
                     <button className="w-full text-left px-2 py-1.5 rounded text-[10px] font-bold text-primary bg-primary/5 border border-primary/10 uppercase flex items-center gap-2">
                        <Activity className="w-3 h-3" /> Operational Log
                     </button>
                     <button className="w-full text-left px-2 py-1.5 rounded text-[10px] font-bold text-slate-500 hover:text-slate-300 hover:bg-white/5 uppercase flex items-center gap-2">
                        <ListFilter className="w-3 h-3" /> Saved Queries
                     </button>
                  </div>
               </div>
            </div>
         </div>

         <div className="p-4 border-t border-border-dim bg-surface/10">
            <div className="flex items-center justify-between text-[8px] font-bold text-slate-600 uppercase tracking-widest mb-1">
               Cluster Load
               <span>62%</span>
            </div>
            <div className="w-full h-1 bg-border-dim rounded-full overflow-hidden">
               <div className="h-full bg-primary/60 w-[62%]" />
            </div>
         </div>
      </div>

      {/* 2. Middle: Incident List / Main Workspace */}
      <div className="flex-1 flex flex-col bg-bg-base overflow-hidden min-w-0">
        <StatCards incidents={incidents} />
        <div className="flex-1 overflow-hidden flex flex-col">
          <IncidentList
            incidents={incidents}
            selectedId={selectedIncident?.id || null}
            onSelect={onSelect}
          />
        </div>
      </div>

      {/* 3. Right: Inspector Panel */}
      <div className="w-[450px] shrink-0 border-l border-border-dim bg-bg-base flex flex-col">
        <IncidentDetails
          incident={selectedIncident}
          onClose={onClearSelection}
          onTransition={onTransition}
          onSubmitRCA={onSubmitRCA}
        />
      </div>
    </div>
  );
}
