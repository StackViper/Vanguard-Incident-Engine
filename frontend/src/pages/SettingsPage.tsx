import { useState } from 'react';
import { Server, Key, Save, CheckCircle, Info } from 'lucide-react';

export function SettingsPage() {
  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_API_URL || 'http://localhost:8000');
  const [wsUrl, setWsUrl] = useState(import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/incidents');
  const [apiKey, setApiKey] = useState('secret_key_123');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('vantage_api_url', apiUrl);
    localStorage.setItem('vantage_ws_url', wsUrl);
    localStorage.setItem('vantage_api_key', apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex flex-col h-full bg-bg-base overflow-y-auto custom-scrollbar p-8">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight uppercase mb-1">Configuration</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Environment & Connectivity Settings</p>
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="bg-surface/10 border border-border-dim rounded-md p-6">
              <div className="flex items-center gap-3 mb-8">
                <Server className="w-4 h-4 text-primary" />
                <span className="text-[11px] font-bold text-white uppercase tracking-wider">Service Endpoints</span>
              </div>

              {saved && (
                <div className="mb-6 p-3 rounded bg-primary/5 border border-primary/10 text-primary text-[9px] font-bold uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5" /> Workspace Config Updated
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="text-[9px] font-bold text-slate-500 mb-2 block uppercase tracking-widest">Backend API Address</label>
                  <input
                    value={apiUrl}
                    onChange={e => setApiUrl(e.target.value)}
                    className="w-full bg-bg-base border border-border-dim rounded px-3 py-2 focus:border-primary/40 outline-none text-[10px] font-mono text-slate-300"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 mb-2 block uppercase tracking-widest">WebSocket Stream URL</label>
                  <input
                    value={wsUrl}
                    onChange={e => setWsUrl(e.target.value)}
                    className="w-full bg-bg-base border border-border-dim rounded px-3 py-2 focus:border-primary/40 outline-none text-[10px] font-mono text-slate-300"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 mb-2 block uppercase tracking-widest flex items-center gap-2">
                    <Key className="w-3 h-3" /> Access Credentials
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    className="w-full bg-bg-base border border-border-dim rounded px-3 py-2 focus:border-primary/40 outline-none text-[10px] font-mono text-slate-300"
                  />
                </div>
                <div className="pt-4">
                  <button onClick={handleSave} className="bg-primary text-bg-base font-bold uppercase tracking-widest px-6 py-2 rounded transition-all flex items-center gap-2 text-[10px] shadow-lg shadow-primary/10">
                    <Save className="w-3.5 h-3.5" /> Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-surface/10 border border-border-dim rounded-md p-6">
               <div className="flex items-center gap-3 mb-6">
                <Info className="w-4 h-4 text-slate-500" />
                <span className="text-[11px] font-bold text-white uppercase tracking-wider">System Info</span>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Version', value: '2.4.0-stable' },
                  { label: 'Engine', value: 'Vantage Pro' },
                  { label: 'Uptime', value: '14d 02h' },
                  { label: 'Region', value: 'US-EAST-1' }
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-border-dim/50 last:border-0">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{item.label}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
