import cn from './cn';

/**
 * Compact segmented control used for filters and view switches.
 */
export default function Segmented({ options, value, onChange, className, size = 'md' }) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg border border-line bg-sunken p-0.5',
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(option.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md font-semibold transition-colors duration-150',
              size === 'sm' ? 'h-7 px-2.5 text-2xs' : 'h-8 px-3 text-xs',
              active
                ? 'bg-surface text-ink shadow-xs ring-1 ring-line'
                : 'text-muted hover:text-ink'
            )}
          >
            {option.icon ? <option.icon size={13} /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
