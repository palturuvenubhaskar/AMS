import cn from './cn';

const tones = {
  neutral: 'bg-sunken text-body ring-line',
  accent: 'bg-accent-soft text-accent ring-accent/20',
  positive: 'bg-positive-soft text-positive ring-positive/20',
  caution: 'bg-caution-soft text-caution ring-caution/20',
  negative: 'bg-negative-soft text-negative ring-negative/20',
  info: 'bg-info-soft text-info ring-info/20',
  outline: 'bg-transparent text-muted ring-line',
};

export default function Badge({ tone = 'neutral', className, children, dot = false, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-2xs font-semibold ' +
          'ring-1 ring-inset whitespace-nowrap',
        tones[tone] ?? tones.neutral,
        className
      )}
      {...props}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}
