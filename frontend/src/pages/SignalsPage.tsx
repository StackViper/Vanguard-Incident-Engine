import { useState } from 'react';
import { Send, Trash2, Zap, CheckCircle, AlertCircle, Terminal } from 'lucide-react';
import clsx from 'clsx';

interface SignalsPageProps {
  onSendSignal: (data: any) => Promise<void>;
}

const PRESET_SIGNALS = [
  {
    label: 'DB TIMEOUT',
    data: { component_id: 'user-service-prod', error_type: 'DB Connection Timeout', metadata: { component_type: 'rdbms', region: 'us-east-1' } }
  },
  {
    label: 'CACHE PEAK',
    data: { component_id: 'redis-cluster-02', error_type: 'Cache Memory High', metadata: { component_type: 'cache', usage_pct: '92' } }
  },
  {
    label: 'API LATENCY',
    data: { component_id: 'payment-gateway', error_type: 'API Gateway Timeout', metadata: { component_type: 'api', endpoint: '/checkout' } }
  },
  {
    label: 'DISK CRITICAL',
    data: { component_id: 'log-service-01', error_type: 'Disk Space Warning', metadata: { component_type: 'infra', disk_usage: '95%' } }
  },
];

export function SignalsPage({ onSendSignal }: SignalsPageProps) {
  const [componentId, setComponentId] = useState('');
  const [errorType, setErrorType] = useState('');
  const [metaEntries, setMetaEntries] = useState<{ key: string; value: string }[]>([{ key: 'environment', value: 'production' }]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [sentCount, setSentCount] = useState(0);

  const addMeta = () => setMetaEntries([...metaEntries, { key: '', value: '' }]);
  const removeMeta = (i: number) => setMetaEntries(metaEntries.filter((_, idx) => idx !== i));
  const updateMeta = (i: number, field: 'key' | 'value', val: string) => {
    const copy = [...metaEntries];
    copy[i][field] = val;
    setMetaEntries(copy);
  };

  const send = async (data: any) => {
    setSending(true);
    setResult(null);
    try {
      await onSendSignal(data);
      setSentCount(c => c + 1);
      setResult({ type: 'success', msg: `SIGNAL COMMITTED: ${data.component_id}` });
    } catch (err: any) {
      setResult({ type: 'error', msg: err.message });
    } finally {
      setSending(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const metadata: Record<string, string> = {};
    metaEntries.forEach(m => { if (m.key) metadata[m.key] = m.value; });
    await send({ component_id: componentId, error_type: errorType, metadata });
  };

  return (
    <div className="flex h-[calc(100vh-2.5rem)] overflow-hidden">
      {/* 1. Presets Sidebar */}
      <div className="w-80 shrink-0 border-r border-border-dim bg-bg-base flex flex-col">
        <div className="p-4 border-b border-border-dim bg-surface/20 flex items-center gap-2">
           <Terminal className="w-3.5 h-3.5 text-slate-500" />
           <span className="text-[10px] font-bold text-white uppercase tracking-widest">Signal Control</span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          <div>
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-4">Operational Presets</div>
            <div className="space-y-1">
               {PRESET_SIGNALS.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => send(preset.data)}
                    disabled={sending}
                    className="w-full flex items-center justify-between p-3 rounded border border-transparent bg-surface/5 hover:border-primary/20 hover:bg-white/5 transition-all group disabled:opacity-30"
                  >
                    <div className="text-left">
                       <div className="text-[10px] font-bold text-slate-300 group-hover:text-primary transition-colors">{preset.label}</div>
                       <div className="text-[8px] font-mono text-slate-600 uppercase mt-0.5">{preset.data.component_id}</div>
                    </div>
                    <Send className="w-3 h-3 text-slate-700 group-hover:text-primary transition-colors" />
                  </button>
               ))}
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 p-4 rounded">
             <div className="text-[9px] font-bold text-primary uppercase tracking-widest mb-1">Session Activity</div>
             <div className="text-2xl font-bold text-primary tracking-tighter">{sentCount}</div>
             <div className="text-[8px] font-bold text-primary/40 uppercase tracking-widest mt-1">Signals Dispatched</div>
          </div>
        </div>
      </div>

      {/* 2. Custom Command Engine */}
      <div className="flex-1 flex flex-col bg-[#0a0f0d] overflow-hidden">
        <div className="px-6 py-3 border-b border-border-dim bg-surface/10 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manual Ingestion Console</span>
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
             <span className="text-[9px] font-bold text-slate-600 uppercase">Input Terminal Active</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
          <div className="max-w-2xl mx-auto w-full">
            {result && (
              <div className={clsx(
                "mb-8 p-4 rounded border flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.2em]",
                result.type === 'success' ? 'bg-primary/5 border-primary/10 text-primary' : 'bg-critical/5 border-critical/10 text-critical'
              )}>
                {result.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {result.msg}
              </div>
            )}

            <form onSubmit={handleCustomSubmit} className="space-y-10">
              <div className="space-y-6">
                <div>
                  <label className="text-[9px] font-bold text-slate-600 mb-2 block uppercase tracking-widest">Resource Identifier</label>
                  <input
                    value={componentId}
                    onChange={e => setComponentId(e.target.value)}
                    required
                    placeholder="E.G. API-GATEWAY-NODE-01"
                    className="w-full bg-bg-base border border-border-dim rounded px-4 py-2.5 focus:border-primary/40 outline-none text-[10px] font-bold text-white uppercase"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-600 mb-2 block uppercase tracking-widest">Telemetry Code / Error Type</label>
                  <input
                    value={errorType}
                    onChange={e => setErrorType(e.target.value)}
                    required
                    placeholder="E.G. ERR_CONNECTION_REFUSED"
                    className="w-full bg-bg-base border border-border-dim rounded px-4 py-2.5 focus:border-primary/40 outline-none text-[10px] font-bold text-white uppercase"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Metadata Payload</label>
                    <button type="button" onClick={addMeta} className="text-[8px] font-bold text-primary hover:bg-primary/10 px-2 py-1 rounded border border-primary/20 transition-all uppercase tracking-widest">
                       + Add Key
                    </button>
                  </div>
                  <div className="space-y-2">
                    {metaEntries.map((entry, i) => (
                      <div key={i} className="flex items-center gap-2 group">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <input
                            value={entry.key}
                            onChange={e => updateMeta(i, 'key', e.target.value)}
                            placeholder="KEY"
                            className="bg-bg-base border border-border-dim rounded px-3 py-2 text-[10px] focus:border-primary/40 outline-none text-slate-300 font-mono uppercase"
                          />
                          <input
                            value={entry.value}
                            onChange={e => updateMeta(i, 'value', e.target.value)}
                            placeholder="VALUE"
                            className="bg-bg-base border border-border-dim rounded px-3 py-2 text-[10px] focus:border-primary/40 outline-none text-slate-300 font-mono uppercase"
                          />
                        </div>
                        {metaEntries.length > 1 && (
                          <button type="button" onClick={() => removeMeta(i)} className="text-slate-700 hover:text-critical transition-colors p-2">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border-dim/50">
                 <button type="submit" disabled={sending} className="w-full bg-primary text-bg-base font-bold uppercase tracking-[0.3em] py-3 rounded shadow-lg shadow-primary/10 hover:bg-primary/90 transition-all text-[10px] flex items-center justify-center gap-3">
                    {sending ? 'DISPATCHING...' : <><Zap className="w-3.5 h-3.5" /> Dispatch Signal</>}
                 </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
