import clsx from 'clsx';

export function SeverityBadge({ severity }: { severity: string }) {
  const getStyle = () => {
    switch (severity) {
      case 'P0':
        return 'text-critical border-critical/40 bg-critical/5';
      case 'P1':
        return 'text-warning border-warning/40 bg-warning/5';
      case 'P2':
        return 'text-primary border-primary/40 bg-primary/5';
      default:
        return 'text-slate-500 border-border-dim bg-surface/30';
    }
  };

  const label = severity === 'P0' ? 'P0' : severity === 'P1' ? 'P1' : severity === 'P2' ? 'P2' : 'PX';

  return (
    <span className={clsx("px-1.5 py-0.5 rounded-sm text-[8px] font-bold border uppercase tracking-widest leading-none flex items-center gap-1", getStyle())}>
      <div className={clsx("w-1 h-1 rounded-full", getStyle().split(' ')[0].replace('text-', 'bg-'))} />
      {label}
    </span>
  );
}
