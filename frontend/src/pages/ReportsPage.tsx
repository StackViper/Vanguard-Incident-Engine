import { useMemo } from 'react';
import { BarChart2, TrendingUp, Clock, AlertTriangle, FileText, Database } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import type { Incident } from '../types';

interface ReportsPageProps {
  incidents: Incident[];
}

export function ReportsPage({ incidents }: ReportsPageProps) {
  const stats = useMemo(() => {
    const total = incidents.length;
    const open = incidents.filter(i => i.status === 'OPEN').length;
    const investigating = incidents.filter(i => i.status === 'INVESTIGATING').length;
    const resolved = incidents.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length;

    // MTTR for resolved incidents with RCA
    const mttrValues = incidents
      .filter(i => i.rca)
      .map(i => {
        const start = new Date(i.rca!.start_time).getTime();
        const end = new Date(i.rca!.end_time).getTime();
        return (end - start) / 60000; // minutes
      });
    const avgMTTR = mttrValues.length > 0 ? Math.round(mttrValues.reduce((a, b) => a + b, 0) / mttrValues.length) : 0;

    // Daily counts for last 7 days
    const dailyCounts: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = startOfDay(subDays(new Date(), i));
      const dayStr = format(day, 'MMM dd');
      const count = incidents.filter(inc => {
        const d = startOfDay(new Date(inc.created_at));
        return d.getTime() === day.getTime();
      }).length;
      dailyCounts.push({ date: dayStr, count });
    }

    // Component breakdown
    const compMap: Record<string, number> = {};
    incidents.forEach(i => {
      compMap[i.component_id] = (compMap[i.component_id] || 0) + 1;
    });
    const componentData = Object.entries(compMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // Severity breakdown
    const sevData = [
      { name: 'P0', value: incidents.filter(i => i.severity === 'P0').length, color: '#f43f5e' },
      { name: 'P1', value: incidents.filter(i => i.severity === 'P1').length, color: '#f59e0b' },
      { name: 'P2', value: incidents.filter(i => i.severity === 'P2').length, color: '#10b981' },
    ].filter(d => d.value > 0);

    return { total, open, investigating, resolved, avgMTTR, dailyCounts, componentData, sevData };
  }, [incidents]);

  const summaryCards = [
    { title: 'INCIDENTS TOTAL', value: stats.total, icon: AlertTriangle, color: 'text-critical' },
    { title: 'ACTIVE CASES', value: stats.open + stats.investigating, icon: TrendingUp, color: 'text-warning' },
    { title: 'RECOVERY RATE', value: stats.total > 0 ? `${Math.round((stats.resolved / stats.total) * 100)}%` : '0%', icon: BarChart2, color: 'text-primary' },
    { title: 'AVG MTTR', value: stats.avgMTTR > 0 ? `${stats.avgMTTR}M` : 'N/A', icon: Clock, color: 'text-slate-500' },
  ];

  return (
    <div className="flex h-[calc(100vh-2.5rem)] overflow-hidden">
      {/* 1. Metric Sidebar */}
      <div className="w-80 shrink-0 border-r border-border-dim bg-bg-base flex flex-col">
         <div className="px-4 py-3 border-b border-border-dim bg-surface/20 flex items-center gap-2">
            <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Analytics Engine</span>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {summaryCards.map(card => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="bg-surface/10 border border-border-dim p-4 rounded-md">
                   <div className="flex items-center gap-2 mb-3">
                      <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{card.title}</span>
                   </div>
                   <div className="text-2xl font-bold text-white tracking-tight leading-none">{card.value}</div>
                </div>
              );
            })}
         </div>

         <div className="p-4 border-t border-border-dim bg-surface/5">
            <div className="text-[8px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">
               Reports generated automatically based on audit trail.
            </div>
         </div>
      </div>

      {/* 2. Visualization Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0d1210] p-8">
        <div className="max-w-5xl mx-auto space-y-8">
           <div className="flex items-center justify-between border-b border-border-dim/50 pb-4">
              <div>
                 <h2 className="text-xl font-bold text-white uppercase tracking-tight">System Performance Report</h2>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Timeline Audit & Impact Analysis</p>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                 <span className="text-[9px] font-bold text-slate-600 uppercase">Operational Status: Nominal</span>
              </div>
           </div>

           <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8 bg-surface/5 border border-border-dim rounded-md p-6 h-80 flex flex-col">
                 <div className="flex items-center gap-2 mb-8">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Incident Frequency (7D)</span>
                 </div>
                 <div className="flex-1 -ml-4">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={stats.dailyCounts}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                          <XAxis dataKey="date" hide />
                          <YAxis hide />
                          <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: '#0a0f0d', borderColor: '#1a221f', borderRadius: '4px', fontSize: '10px' }} />
                          <Bar dataKey="count" fill="#4ADE80" opacity={0.3} radius={[2, 2, 0, 0]} barSize={40} />
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              <div className="col-span-12 lg:col-span-4 bg-surface/5 border border-border-dim rounded-md p-6 h-80 flex flex-col items-center justify-center">
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 w-full text-center">Impact Spread</span>
                 <div className="h-40 w-full relative">
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                       <div className="text-xl font-bold text-white">{stats.total}</div>
                       <div className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Total</div>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie data={stats.sevData} innerRadius={50} outerRadius={65} paddingAngle={4} dataKey="value" stroke="none">
                             {stats.sevData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                          </Pie>
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
              </div>
           </div>

           <div className="bg-surface/5 border border-border-dim rounded-md p-6">
              <div className="flex items-center gap-2 mb-8">
                 <Database className="w-3.5 h-3.5 text-slate-500" />
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Component Criticality Heatmap</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                 {stats.componentData.map((c, i) => {
                    const pct = Math.round((c.value / stats.total) * 100);
                    return (
                       <div key={c.name} className="flex flex-col group">
                          <div className="flex justify-between items-center mb-2">
                             <div className="flex items-center gap-3">
                                <span className="text-[9px] text-slate-600 font-mono">#{i + 1}</span>
                                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wide">{c.name}</span>
                             </div>
                             <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                {c.value} LOGS
                             </span>
                          </div>
                          <div className="h-1 bg-surface border border-border-dim rounded-full overflow-hidden">
                             <div className="h-full bg-primary/40 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                       </div>
                    );
                 })}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
