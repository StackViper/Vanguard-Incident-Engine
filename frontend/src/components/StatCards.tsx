import { Flame, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import clsx from 'clsx';

interface StatCardsProps {
  incidents: any[];
}

const generateSparklineData = () => Array.from({ length: 12 }, () => ({ val: Math.floor(Math.random() * 20) + 5 }));

export function StatCards({ incidents }: StatCardsProps) {
  const p0Count = incidents.filter(i => i.severity === 'P0' && i.status !== 'RESOLVED' && i.status !== 'CLOSED').length;
  const p1Count = incidents.filter(i => i.severity === 'P1' && i.status !== 'RESOLVED' && i.status !== 'CLOSED').length;
  const p2Count = incidents.filter(i => i.severity === 'P2' && i.status !== 'RESOLVED' && i.status !== 'CLOSED').length;
  
  const today = new Date().toDateString();
  const resolvedToday = incidents.filter(i => 
    (i.status === 'RESOLVED' || i.status === 'CLOSED') && 
    new Date(i.updated_at).toDateString() === today
  ).length;

  const cards = [
    { title: 'P0 - CRITICAL', count: p0Count, icon: Flame, color: 'text-critical' },
    { title: 'P1 - HIGH', count: p1Count, icon: AlertTriangle, color: 'text-warning' },
    { title: 'P2 - MEDIUM', count: p2Count, icon: AlertCircle, color: 'text-info' },
    { title: 'RESOLVED 24H', count: resolvedToday, icon: CheckCircle, color: 'text-primary' }
  ];

  return (
    <div className="grid grid-cols-4 border-b border-border-dim bg-bg-base overflow-hidden shrink-0">
      {cards.map((card, i) => {
        const Icon = card.icon;
        const sparkData = generateSparklineData();
        return (
          <div key={card.title} className={clsx(
            "p-4 flex flex-col gap-2 relative group transition-colors",
            i < 3 && "border-r border-border-dim/50"
          )}>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{card.title}</span>
              <Icon className={clsx("w-3 h-3", card.color)} />
            </div>
            <div className="flex items-end justify-between">
               <div className="text-xl font-bold text-white tracking-tight leading-none">{card.count}</div>
               <div className="w-16 h-6 opacity-30">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={sparkData}>
                     <Area type="monotone" dataKey="val" stroke="currentColor" strokeWidth={1} fill="transparent" isAnimationActive={false} className={card.color} />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
