import { useState, useMemo } from 'react';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { IncidentDetails } from '../components/IncidentDetails';
import { formatDistanceToNow } from 'date-fns';
import { Search, Filter, Hash, Clock, Component } from 'lucide-react';
import clsx from 'clsx';
import type { Incident } from '../types';

interface IncidentsPageProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onSelect: (id: string) => void;
  onClearSelection: () => void;
  onTransition: (state: string) => Promise<void>;
  onSubmitRCA: (data: any) => Promise<void>;
}

export function IncidentsPage({ incidents, selectedIncident, onSelect, onClearSelection, onTransition, onSubmitRCA }: IncidentsPageProps) {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filtered = useMemo(() => {
    return incidents.filter(inc => {
      const matchSearch = !search ||
        inc.component_id.toLowerCase().includes(search.toLowerCase()) ||
        inc.id.toLowerCase().includes(search.toLowerCase());
      const matchSev = severityFilter === 'ALL' || inc.severity === severityFilter;
      const matchStatus = statusFilter === 'ALL' || inc.status === statusFilter;
      return matchSearch && matchSev && matchStatus;
    }).sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [incidents, search, severityFilter, statusFilter]);

  return (
    <div className="flex h-[calc(100vh-2.5rem)] overflow-hidden">
      {/* 1. Filters Column */}
      <div className="w-56 shrink-0 border-r border-border-dim bg-bg-base/50 flex flex-col">
        <div className="p-4 border-b border-border-dim bg-surface/30">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white">Filters</span>
          </div>
          
          <div className="relative mb-6">
            <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-surface border border-border-dim rounded-md pl-8 pr-3 py-1.5 text-[10px] font-bold focus:outline-none focus:border-primary/40 transition-all text-slate-300 uppercase"
            />
          </div>

          <div className="space-y-6">
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.1em] mb-2 block">Severity</span>
              <div className="flex flex-wrap gap-1.5">
                {['ALL', 'P0', 'P1', 'P2'].map(s => (
                  <button
                    key={s}
                    onClick={() => setSeverityFilter(s)}
                    className={clsx(
                      "px-2 py-1 rounded text-[9px] font-bold transition-all border uppercase",
                      severityFilter === s
                        ? "bg-primary/10 border-primary/20 text-primary"
                        : "bg-surface/50 border-border-dim text-slate-500 hover:text-slate-300"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.1em] mb-2 block">Status</span>
              <div className="flex flex-col gap-1">
                {['ALL', 'OPEN', 'INVESTIGATING', 'RESOLVED'].map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={clsx(
                      "w-full text-left px-2 py-1.5 rounded text-[9px] font-bold transition-all border uppercase flex justify-between items-center",
                      statusFilter === s
                        ? "bg-primary/5 border-primary/10 text-primary"
                        : "bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5"
                    )}
                  >
                    {s}
                    {statusFilter === s && <div className="w-1 h-1 rounded-full bg-primary" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-auto p-4 border-t border-border-dim text-[8px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">
          Incident Workspace v2.4.0<br/>
          Cluster: Prod-US-East-1
        </div>
      </div>

      {/* 2. Timeline Feed Column */}
      <div className="flex-1 flex flex-col bg-bg-base relative min-w-0">
        <div className="px-6 py-3 border-b border-border-dim bg-surface/10 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
            Timeline Feed <span className="text-slate-600 ml-2">/ {filtered.length} Items</span>
          </span>
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
             <span className="text-[9px] font-bold text-slate-500 uppercase">Auto-Sync Active</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0d1210]">
          {filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30">
               <Hash className="w-8 h-8 mb-4" />
               <span className="text-[10px] font-bold uppercase tracking-widest">No matching logs found</span>
            </div>
          ) : (
            <div className="divide-y divide-border-dim/30">
              {filtered.map(inc => (
                <div
                  key={inc.id}
                  onClick={() => onSelect(inc.id)}
                  className={clsx(
                    "p-4 cursor-pointer transition-all border-l-2 relative",
                    selectedIncident?.id === inc.id
                      ? "bg-primary/5 border-primary"
                      : "border-transparent hover:bg-white/5 hover:border-border-dim"
                  )}
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-3">
                      <SeverityBadge severity={inc.severity} />
                      <span className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                        INC-{inc.id.substring(0, 8)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 text-[9px] font-bold uppercase">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(inc.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Component className="w-3 h-3 text-slate-600" />
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">
                       {inc.component_id}
                    </span>
                    <span className="text-slate-700 mx-1">—</span>
                    <StatusBadge status={inc.status} />
                  </div>

                  <div className="text-[10px] text-slate-500 leading-relaxed truncate opacity-70">
                    Potential anomaly detected in service mesh. Throughput drop observed at edge-proxy node.
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Detail Inspector Column */}
      <div className="w-[480px] shrink-0 border-l border-border-dim bg-surface/5 flex flex-col">
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
