import { useState } from 'react';
import { X, Activity, CheckCircle, Info, ShieldCheck } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { SeverityBadge } from './SeverityBadge';
import { StatusBadge } from './StatusBadge';
import clsx from 'clsx';

interface IncidentDetailsProps {
  incident: any | null;
  onClose: () => void;
  onTransition: (newState: string) => Promise<void>;
  onSubmitRCA: (rcaData: any) => Promise<void>;
}

export function IncidentDetails({ incident, onClose, onTransition, onSubmitRCA }: IncidentDetailsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'signals' | 'timeline' | 'rca'>('overview');

  if (!incident) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center bg-bg-base">
        <div className="w-16 h-16 rounded-full bg-surface border border-border-dim flex items-center justify-center mb-6 opacity-20">
          <Activity className="w-8 h-8" />
        </div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">No Selection</h3>
        <p className="text-[10px] text-slate-600 max-w-[240px] font-bold uppercase leading-relaxed tracking-wider">
          Select an incident from the timeline to inspect telemetry and logs.
        </p>
      </div>
    );
  }

  const handleRCA = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    onSubmitRCA({
      root_cause_category: formData.get('category'),
      fix_applied: formData.get('fix'),
      prevention_steps: formData.get('prevention'),
      start_time: new Date(formData.get('start') as string).toISOString(),
      end_time: new Date(formData.get('end') as string).toISOString()
    });
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'signals', label: 'Signals' },
    { id: 'timeline', label: 'Log' },
    { id: 'rca', label: 'RCA' }
  ] as const;

  return (
    <div className="h-full flex flex-col bg-bg-base border-l border-border-dim overflow-hidden">
      {/* Header Inspector */}
      <div className="p-4 border-b border-border-dim bg-surface/20">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-md bg-surface border border-border-dim flex items-center justify-center">
               <Info className="w-4 h-4 text-slate-500" />
             </div>
             <div>
               <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Inspector</div>
               <div className="text-xs font-bold text-white uppercase tracking-tight">INC-{incident.id.substring(0, 8)}</div>
             </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-md text-slate-600 hover:text-white transition-all">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <SeverityBadge severity={incident.severity} />
          <div className="w-px h-3 bg-border-dim" />
          <StatusBadge status={incident.status} />
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-surface/50 p-0.5 rounded-md border border-border-dim">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex-1 py-1 text-[9px] font-bold uppercase tracking-wider rounded transition-all",
                activeTab === tab.id 
                  ? "bg-bg-base text-primary shadow-sm" 
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Inspector */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 bg-[#0a0f0d]">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-surface/30 rounded p-3 border border-border-dim/50">
                <div className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mb-1">Created At</div>
                <div className="font-mono text-[10px] text-slate-300 uppercase">{format(new Date(incident.created_at), 'HH:mm:ss')}</div>
              </div>
              <div className="bg-surface/30 rounded p-3 border border-border-dim/50">
                <div className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mb-1">Latency</div>
                <div className="font-mono text-[10px] text-slate-300 uppercase">{formatDistanceToNow(new Date(incident.created_at))}</div>
              </div>
            </div>

            <div>
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Target Resource</div>
              <div className="bg-surface/20 border border-border-dim/50 rounded p-3 flex items-center gap-3">
                 <div className="w-7 h-7 rounded bg-bg-base border border-border-dim flex items-center justify-center">
                    <Activity className="w-3.5 h-3.5 text-primary/60" />
                 </div>
                 <div>
                   <div className="text-[11px] font-bold text-white uppercase tracking-wide">{incident.component_id}</div>
                   <div className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">Service Node</div>
                 </div>
              </div>
            </div>

            <div>
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">State Controls</div>
              <div className="grid grid-cols-1 gap-2">
                {['INVESTIGATING', 'RESOLVED', 'CLOSED'].map(state => {
                  const isActive = incident.status === state;
                  const label = state === 'INVESTIGATING' ? 'Investigate' : state === 'RESOLVED' ? 'Resolve' : 'Close';
                  return (
                    <button
                      key={state}
                      onClick={() => onTransition(state)}
                      disabled={isActive || (state === 'CLOSED' && !incident.rca)}
                      className={clsx(
                        "w-full px-3 py-2 rounded text-[10px] font-bold uppercase tracking-[0.1em] transition-all border text-left flex items-center justify-between",
                        isActive 
                          ? "border-primary/20 bg-primary/5 text-primary cursor-default"
                          : "border-border-dim bg-surface/30 text-slate-500 hover:text-white hover:bg-surface/50 disabled:opacity-20 disabled:cursor-not-allowed"
                      )}
                    >
                      {label}
                      {isActive && <CheckCircle className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'signals' && (
          <div className="space-y-2">
            {!incident.signals?.length ? (
              <div className="text-center py-12 text-slate-700 uppercase text-[9px] font-bold tracking-widest">No signals</div>
            ) : (
              incident.signals.map((sig: any, idx: number) => (
                <div key={idx} className="bg-surface/20 rounded p-3 border border-border-dim/50 font-mono text-[9px] hover:border-primary/20 transition-all group">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-primary/70 font-bold uppercase">{format(new Date(sig.timestamp), 'HH:mm:ss.SSS')}</span>
                    <span className="text-slate-700 group-hover:text-slate-500 transition-colors uppercase">ID: {sig._id?.substring(0,4) || idx}</span>
                  </div>
                  <div className="text-white font-bold mb-1 uppercase tracking-tight">{sig.error_type}</div>
                  {sig.message && <div className="text-slate-500 pl-2 border-l border-border-dim/50 py-0.5 mt-1 leading-relaxed">{sig.message}</div>}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-4">
            {[
              { type: 'Reported', time: incident.created_at, color: 'text-critical' },
              ...(incident.status === 'INVESTIGATING' || incident.status === 'RESOLVED' || incident.status === 'CLOSED' 
                ? [{ type: 'Investigation', time: incident.updated_at, color: 'text-warning' }] : []),
              ...(incident.status === 'RESOLVED' || incident.status === 'CLOSED' 
                ? [{ type: 'Resolution', time: incident.updated_at, color: 'text-primary' }] : [])
            ].map((ev, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                   <div className={clsx("w-1.5 h-1.5 rounded-full mt-1.5", ev.color.replace('text-', 'bg-'))} />
                   {i < 2 && <div className="w-px flex-1 bg-border-dim/30 my-1" />}
                </div>
                <div className="flex-1 pb-4">
                   <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">{ev.type} Phase</div>
                   <div className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">
                     {format(new Date(ev.time), 'MMM dd, HH:mm:ss')}
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'rca' && (
          <div className="h-full flex flex-col">
            {incident.rca ? (
              <div className="space-y-4 h-full">
                <div className="bg-primary/5 border border-primary/20 rounded p-3 flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">RCA Validated</span>
                </div>
                <div className="flex-1 space-y-4 overflow-y-auto">
                  <div className="bg-surface/20 rounded p-3 border border-border-dim/50">
                    <h4 className="text-slate-600 mb-2 font-bold uppercase tracking-widest text-[8px]">Classification</h4>
                    <p className="text-slate-300 text-[10px] font-bold uppercase">{incident.rca.root_cause_category}</p>
                  </div>
                  <div className="bg-surface/20 rounded p-3 border border-border-dim/50">
                    <h4 className="text-slate-600 mb-2 font-bold uppercase tracking-widest text-[8px]">Fix Details</h4>
                    <p className="text-slate-400 text-[10px] leading-relaxed">{incident.rca.fix_applied}</p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRCA} className="space-y-4">
                <div>
                  <label className="text-[8px] font-bold text-slate-600 mb-1.5 block uppercase tracking-[0.2em]">Category</label>
                  <input name="category" required placeholder="Root cause type..." className="w-full bg-surface border border-border-dim rounded px-3 py-2 focus:border-primary/40 outline-none text-[10px] font-bold text-white uppercase" />
                </div>
                <div>
                  <label className="text-[8px] font-bold text-slate-600 mb-1.5 block uppercase tracking-[0.2em]">Resolution</label>
                  <textarea name="fix" required placeholder="Steps taken..." className="w-full bg-surface border border-border-dim rounded px-3 py-2 focus:border-primary/40 outline-none text-[10px] h-20 custom-scrollbar text-white" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8px] font-bold text-slate-600 mb-1.5 block uppercase tracking-[0.2em]">Start</label>
                    <input type="datetime-local" name="start" required className="w-full bg-surface border border-border-dim rounded px-2 py-1.5 focus:border-primary/40 outline-none text-[9px] text-slate-400" />
                  </div>
                  <div>
                    <label className="text-[8px] font-bold text-slate-600 mb-1.5 block uppercase tracking-[0.2em]">End</label>
                    <input type="datetime-local" name="end" required className="w-full bg-surface border border-border-dim rounded px-2 py-1.5 focus:border-primary/40 outline-none text-[9px] text-slate-400" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-primary text-bg-base font-bold uppercase tracking-widest py-2 rounded shadow-lg shadow-primary/10 hover:bg-primary/90 transition-all text-[10px] mt-2">
                  Commit RCA
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
