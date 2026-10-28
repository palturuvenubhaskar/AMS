import cn from './cn';

const control =
  'w-full rounded-md border border-line bg-surface px-3 text-[13px] text-ink ' +
  'placeholder:text-faint shadow-xs transition-colors duration-150 ' +
  'hover:border-line-strong focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/12 ' +
  'disabled:cursor-not-allowed disabled:bg-sunken disabled:text-muted';

export function Label({ className, children, required, ...props }) {
  return (
    <label
      className={cn('mb-1.5 block text-xs font-semibold text-body', className)}
      {...props}
    >
      {children}
      {required ? <span className="ml-0.5 text-negative">*</span> : null}
    </label>
  );
}

export function Input({ className, ...props }) {
  return <input className={cn(control, 'h-9', className)} {...props} />;
}

export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(control, 'h-9 cursor-pointer appearance-none bg-no-repeat pr-8', className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236a7383' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundPosition: 'right 0.6rem center',
      }}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn(control, 'min-h-[84px] resize-y py-2', className)} {...props} />;
}

/** Label + control + hint/error, in one vertical stack. */
export function Field({ label, htmlFor, hint, error, required, className, children }) {
  return (
    <div className={cn('min-w-0', className)}>
      {label ? (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      ) : null}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-negative">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-faint">{hint}</p>
      ) : null}
    </div>
  );
}

export function Switch({ checked, onChange, label, description, disabled, id }) {
  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          'relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2',
          checked ? 'bg-accent' : 'bg-line-strong',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <span
          className={cn(
            'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform duration-150',
            checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
          )}
        />
      </button>
      {label || description ? (
        <div className="min-w-0">
          {label ? <p className="text-[13px] font-semibold text-ink">{label}</p> : null}
          {description ? <p className="text-xs text-muted">{description}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

export default Input;
