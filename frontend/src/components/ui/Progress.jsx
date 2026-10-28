import cn from './cn';

const tones = {
  accent: 'bg-accent',
  positive: 'bg-positive',
  caution: 'bg-caution',
  negative: 'bg-negative',
  info: 'bg-info',
  neutral: 'bg-line-strong',
};

export default function Progress({ value = 0, tone = 'accent', className, label, showValue }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className={cn('w-full', className)}>
      {label || showValue ? (
        <div className="mb-1.5 flex items-center justify-between gap-3">
          {label ? <span className="text-xs font-medium text-muted">{label}</span> : null}
          {showValue ? <span className="tnum text-xs font-bold text-ink">{pct.toFixed(0)}%</span> : null}
        </div>
      ) : null}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-sunken ring-1 ring-inset ring-line"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-500 ease-out', tones[tone] ?? tones.accent)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
