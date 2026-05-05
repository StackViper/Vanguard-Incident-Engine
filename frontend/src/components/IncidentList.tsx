import { Search, Database, Activity, Server, Cpu, Clock, Terminal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { SeverityBadge } from './SeverityBadge';
import clsx from 'clsx';

interface IncidentListProps {
  incidents: any[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const getIconForComponent = (componentId: string) => {
  const lower = componentId.toLowerCase();
  if (lower.includes('db') || lower.includes('data')) return Database;
  if (lower.includes('api') || lower.includes('gate')) return Activity;
  if (lower.includes('service')) return Server;
  return Cpu;
};

export function IncidentList({ incidents, selectedId, onSelect }: IncidentListProps) {
  const sortedIncidents = [...incidents].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="flex flex-col h-full bg-bg-base border-r border-border-dim overflow-hidden">
      {/* Feed Header */}
      <div className="px-4 py-3 border-b border-border-dim bg-surface/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[10px] font-bold text-white uppercase tracking-[0.1em]">Incident Feed</span>
        </div>
        <div className="relative group">
          <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="FILTER..." 
            className="bg-transparent border-none pl-6 py-0.5 text-[9px] font-bold focus:outline-none w-24 text-slate-400 placeholder:text-slate-700 uppercase"
          />
        </div>
      </div>

      {/* Feed Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0d1210]">
        {sortedIncidents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20">
            <Activity className="w-8 h-8 mb-4" />
            <p className="text-[9px] font-bold uppercase tracking-widest">NOMINAL STATE</p>
          </div>
        ) : (
          <div className="divide-y divide-border-dim/30">
            {sortedIncidents.map(inc => {
              const isSelected = selectedId === inc.id;
              const Icon = getIconForComponent(inc.component_id);
              
              return (
                <div 
                  key={inc.id}
                  onClick={() => onSelect(inc.id)}
                  className={clsx(
                    "px-4 py-3 cursor-pointer transition-all border-l-2 relative",
                    isSelected 
                      ? "bg-primary/5 border-primary" 
                      : "border-transparent hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={clsx(
                        "w-4 h-4 rounded-sm flex items-center justify-center border",
                        inc.severity === 'P0' ? 'text-critical border-critical/30 bg-critical/5' :
                        inc.severity === 'P1' ? 'text-warning border-warning/30 bg-warning/5' :
                        'text-info border-info/30 bg-info/5'
                      )}>
                        <Icon className="w-2.5 h-2.5" />
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                        {inc.id.substring(0, 8)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-600 text-[8px] font-bold uppercase">
                      <Clock className="w-2.5 h-2.5" />
                      {formatDistanceToNow(new Date(inc.updated_at), { addSuffix: true })}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-300 uppercase truncate">
                       {inc.component_id}
                    </span>
                    <span className="text-slate-700 text-[8px]">•</span>
                    <SeverityBadge severity={inc.severity} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
