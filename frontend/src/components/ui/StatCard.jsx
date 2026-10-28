import cn from './cn';

const tones = {
  neutral: 'bg-sunken text-muted',
  accent: 'bg-accent-soft text-accent',
  positive: 'bg-positive-soft text-positive',
  caution: 'bg-caution-soft text-caution',
  negative: 'bg-negative-soft text-negative',
  info: 'bg-info-soft text-info',
};

/**
 * A single metric. Deliberately flat: label + number, no gradient tiles.
 */
export default function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'neutral',
  className,
  children,
}) {
  return (
    <div
      className={cn(
        'group relative flex flex-col justify-between gap-3 rounded-lg border border-line ' +
          'bg-surface p-4 shadow-xs transition-colors duration-150 hover:border-line-strong',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[12.5px] font-semibold text-muted">{label}</span>
        {Icon ? (
          <span
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
              tones[tone] ?? tones.neutral
            )}
          >
            <Icon size={15} strokeWidth={2.2} />
          </span>
        ) : null}
      </div>

      <div>
        <div className="tnum text-[26px] font-bold leading-none tracking-tight text-ink">
          {value}
        </div>
        {hint ? <div className="mt-1.5 text-xs font-medium text-faint">{hint}</div> : null}
        {children}
      </div>
    </div>
  );
}
