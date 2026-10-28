import cn from './cn';

const base =
  'inline-flex items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap ' +
  'transition-colors duration-150 ease-out select-none ' +
  'disabled:cursor-not-allowed disabled:opacity-45 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-canvas';

const variants = {
  // Solid ink button — the primary action across the app.
  primary: 'bg-ink text-canvas hover:bg-ink/90 active:bg-ink/80 shadow-xs',
  accent: 'bg-accent text-accent-ink hover:bg-accent-hover shadow-xs',
  secondary:
    'bg-surface text-ink border border-line hover:bg-sunken hover:border-line-strong shadow-xs',
  ghost: 'text-muted hover:bg-sunken hover:text-ink',
  subtle: 'bg-sunken text-body hover:bg-line/70 hover:text-ink',
  danger: 'bg-negative-soft text-negative hover:bg-negative/20',
  'danger-solid': 'bg-negative text-white hover:opacity-90 shadow-xs',
  link: 'text-accent hover:underline underline-offset-4 px-0',
};

const sizes = {
  xs: 'h-7 px-2.5 text-2xs',
  sm: 'h-8 px-3 text-xs',
  md: 'h-[38px] px-4 text-[13px]',
  lg: 'h-11 px-5 text-sm',
  icon: 'h-9 w-9 p-0',
  'icon-sm': 'h-8 w-8 p-0',
};

export default function Button({
  as: Tag = 'button',
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...props
}) {
  return (
    <Tag
      className={cn(base, variants[variant] ?? variants.secondary, sizes[size] ?? sizes.md, className)}
      {...props}
    >
      {children}
    </Tag>
  );
}
