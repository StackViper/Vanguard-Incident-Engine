import clsx from 'clsx';

export function StatusBadge({ status }: { status: string }) {
  const getStyle = () => {
    switch (status) {
      case 'OPEN':
        return 'text-critical border-critical/30';
      case 'INVESTIGATING':
        return 'text-warning border-warning/30';
      case 'RESOLVED':
      case 'CLOSED':
        return 'text-primary border-primary/30';
      default:
        return 'text-slate-500 border-border-dim';
    }
  };

  const label = status === 'INVESTIGATING' ? 'INVESTIGATING' : status === 'RESOLVED' ? 'RESOLVED' : status === 'CLOSED' ? 'CLOSED' : 'OPEN';

  return (
    <span className={clsx("px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-[0.1em] border flex items-center gap-1.5", getStyle())}>
      <div className={clsx("w-1 h-1 rounded-full", getStyle().split(' ')[0].replace('text-', 'bg-'))} />
      {label}
    </span>
  );
}
