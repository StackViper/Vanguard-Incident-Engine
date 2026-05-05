import { useState } from 'react';
import { FileText, CheckCircle, AlertCircle, Clock, Database, Info, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';
import type { Incident } from '../types';

interface RCAPageProps {
  incidents: Incident[];
  onSelectIncident: (id: string) => void;
  onSubmitRCA: (data: any) => Promise<void>;
  selectedIncident: Incident | null;
}

export function RCAPage({ incidents, onSelectIncident, onSubmitRCA, selectedIncident }: RCAPageProps) {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const needsRCA = incidents.filter(i => !i.rca && i.status !== 'CLOSED');
  const hasRCA = incidents.filter(i => i.rca);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.target as HTMLFormElement);
    try {
      await onSubmitRCA({
        root_cause_category: formData.get('category'),
        fix_applied: formData.get('fix'),
        prevention_steps: formData.get('prevention'),
        start_time: new Date(formData.get('start') as string).toISOString(),
        end_time: new Date(formData.get('end') as string).toISOString()
      });
      setSuccess(`RCA submitted for ${selectedIncident.id.substring(0, 8)}`);
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      setError(err.message || 'Failed to submit RCA');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-2.5rem)] overflow-hidden">
      {/* 1. Selection Column */}
      <div className="w-80 shrink-0 border-r border-border-dim bg-bg-base flex flex-col">
        <div className="p-4 border-b border-border-dim bg-surface/20 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">Audit Registry</span>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-8">
            {/* Needs RCA */}
            <div>
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <AlertCircle className="w-3 h-3 text-warning" /> Pending RCA
              </div>
              {needsRCA.length === 0 ? (
                <div className="py-6 text-center border border-dashed border-border-dim/50 rounded-md">
                   <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Cleared</span>
                </div>
              ) : (
                <div className="space-y-1">
                  {needsRCA.map(inc => (
                    <button
                      key={inc.id}
                      onClick={() => onSelectIncident(inc.id)}
                      className={clsx(
                        "w-full text-left p-3 rounded border transition-all relative",
                        selectedIncident?.id === inc.id
                          ? 'bg-primary/5 border-primary/20 text-primary'
                          : 'bg-surface/5 border-transparent hover:bg-white/5'
                      )}
                    >
                      <div className="flex justify-between items-start">
                         <div className="text-[10px] font-mono font-bold tracking-tight uppercase">INC-{inc.id.substring(0, 8)}</div>
                         <div className="text-[8px] font-bold text-slate-500 uppercase">{inc.severity}</div>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase truncate">{inc.component_id}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Completed RCA */}
            <div>
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-primary" /> Completed
              </div>
              <div className="space-y-1">
                {hasRCA.map(inc => (
                  <button
                    key={inc.id}
                    onClick={() => onSelectIncident(inc.id)}
                    className={clsx(
                      "w-full text-left p-3 rounded border transition-all group",
                      selectedIncident?.id === inc.id
                        ? 'bg-primary/5 border-primary/20 text-primary'
                        : 'bg-transparent border-transparent hover:bg-white/5'
                    )}
                  >
                    <div className="flex justify-between items-center">
                       <div className="text-[10px] font-mono font-bold text-slate-500 group-hover:text-slate-400">INC-{inc.id.substring(0, 8)}</div>
                       <ShieldCheck className="w-3 h-3 text-primary/30" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Audit Form / View */}
      <div className="flex-1 flex flex-col bg-[#0a0f0d] overflow-hidden min-w-0">
        <div className="px-6 py-3 border-b border-border-dim bg-surface/10 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Post-Mortem Engine</span>
          {selectedIncident && (
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-[9px] font-bold text-slate-500 uppercase">Target Identified: {selectedIncident.id.substring(0, 8)}</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
          <div className="max-w-3xl mx-auto w-full">
            {success && (
              <div className="mb-8 p-4 bg-primary/5 border border-primary/10 rounded flex items-center gap-3 text-primary">
                 <CheckCircle className="w-4 h-4" />
                 <span className="text-[10px] font-bold uppercase tracking-widest">{success}</span>
              </div>
            )}
            {error && (
              <div className="mb-8 p-4 bg-critical/5 border border-critical/10 rounded flex items-center gap-3 text-critical">
                 <AlertCircle className="w-4 h-4" />
                 <span className="text-[10px] font-bold uppercase tracking-widest">{error}</span>
              </div>
            )}

            {!selectedIncident ? (
              <div className="h-96 flex flex-col items-center justify-center text-slate-700 opacity-20">
                <Database className="w-12 h-12 mb-4" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Select Incident to Begin RCA</p>
              </div>
            ) : selectedIncident.rca ? (
              <div className="space-y-12">
                <div>
                   <h2 className="text-xl font-bold text-white uppercase tracking-tight mb-2 flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-primary" /> RCA Validated
                   </h2>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Reviewing established root cause and resolution data.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-surface/10 border border-border-dim p-4 rounded">
                      <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-2">Category</div>
                      <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">{selectedIncident.rca.root_cause_category}</div>
                   </div>
                   <div className="bg-surface/10 border border-border-dim p-4 rounded">
                      <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-2">Stability Period</div>
                      <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">Nominal Status</div>
                   </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                       <Info className="w-3 h-3" /> Resolution Narrative
                    </div>
                    <div className="bg-surface/5 border border-border-dim/50 p-6 rounded text-[11px] text-slate-400 leading-relaxed font-bold uppercase tracking-wide whitespace-pre-wrap">
                       {selectedIncident.rca.fix_applied}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-10">
                <div>
                   <h2 className="text-xl font-bold text-white uppercase tracking-tight mb-2">Establish Root Cause</h2>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Perform audit on target: <span className="text-slate-300">{selectedIncident.component_id}</span></p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12">
                      <label className="text-[9px] font-bold text-slate-600 mb-2 block uppercase tracking-widest">Classification</label>
                      <input name="category" required placeholder="e.g. INFRASTRUCTURE, DB_LATENCY, DEPLOY_FAIL" className="w-full bg-bg-base border border-border-dim rounded px-4 py-2.5 focus:border-primary/40 outline-none text-[10px] font-bold text-white uppercase" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-600 mb-2 block uppercase tracking-widest">Remediation Steps</label>
                    <textarea name="fix" required rows={4} placeholder="Log resolution procedures..." className="w-full bg-bg-base border border-border-dim rounded px-4 py-2.5 focus:border-primary/40 outline-none text-[10px] font-bold text-white uppercase custom-scrollbar" />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-600 mb-2 block uppercase tracking-widest">Prevention Vector</label>
                    <textarea name="prevention" required rows={4} placeholder="Outline measures for vector avoidance..." className="w-full bg-bg-base border border-border-dim rounded px-4 py-2.5 focus:border-primary/40 outline-none text-[10px] font-bold text-white uppercase custom-scrollbar" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-dim/50">
                    <div>
                      <label className="text-[9px] font-bold text-slate-600 mb-2 block uppercase tracking-widest flex items-center gap-2"><Clock className="w-3 h-3"/> Origin</label>
                      <input type="datetime-local" name="start" required className="w-full bg-bg-base border border-border-dim rounded px-3 py-2 focus:border-primary/40 outline-none text-[10px] text-slate-400" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-600 mb-2 block uppercase tracking-widest flex items-center gap-2"><Clock className="w-3 h-3"/> Termination</label>
                      <input type="datetime-local" name="end" required className="w-full bg-bg-base border border-border-dim rounded px-3 py-2 focus:border-primary/40 outline-none text-[10px] text-slate-400" />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={submitting} className="w-full bg-primary text-bg-base font-bold uppercase tracking-[0.2em] py-3 rounded shadow-lg shadow-primary/10 hover:bg-primary/90 transition-all text-[10px]">
                  {submitting ? 'COMMITTING DATA...' : 'COMMIT AUDIT LOG'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
