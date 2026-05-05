import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ChartsProps {
  trendData: any[];
  incidents: any[];
}

export function Charts({ trendData, incidents }: ChartsProps) {
  const p0 = incidents.filter(i => i.severity === 'P0').length;
  const p1 = incidents.filter(i => i.severity === 'P1').length;
  const p2 = incidents.filter(i => i.severity === 'P2').length;
  const resolved = incidents.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length;
  const pieData = [
    { name: 'P0', value: p0, color: '#f43f5e' },
    { name: 'P1', value: p1, color: '#f59e0b' },
    { name: 'P2', value: p2, color: '#10b981' },
    { name: 'Resolved', value: resolved, color: '#64748b' }
  ].filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-12 gap-1 border-t border-border-dim bg-bg-base">
      <div className="col-span-8 p-6 h-[300px] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Incident Volume / 24h</span>
          <div className="flex gap-4">
             <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase">
               <div className="w-1.5 h-1.5 rounded-full bg-critical" /> CRITICAL
             </div>
             <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase">
               <div className="w-1.5 h-1.5 rounded-full bg-warning" /> DEGRADED
             </div>
          </div>
        </div>
        <div className="flex-1 -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis dataKey="time" hide />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0d1210', borderColor: '#1a221f', borderRadius: '4px', fontSize: '10px', color: '#fff' }}
              />
              <Line type="monotone" dataKey="P0" stroke="#f43f5e" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="P1" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="P2" stroke="#10b981" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="col-span-4 p-6 border-l border-border-dim h-[300px] flex flex-col items-center justify-center">
         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 w-full text-center">Severity Mix</span>
         <div className="h-40 w-full relative">
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <div className="text-xl font-bold text-white tracking-tighter">{incidents.length}</div>
               <div className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Total</div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={50} outerRadius={65} paddingAngle={4} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
}
