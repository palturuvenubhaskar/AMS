import cn from './cn';

const sizes = {
  xs: 'h-6 w-6 text-[10px] rounded-md',
  sm: 'h-8 w-8 text-xs rounded-md',
  md: 'h-9 w-9 text-[13px] rounded-lg',
  lg: 'h-12 w-12 text-base rounded-lg',
  xl: 'h-16 w-16 text-xl rounded-xl',
};

export default function Avatar({ name, size = 'md', tone = 'accent', className, src }) {
  const initials = (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const tones = {
    accent: 'bg-accent-soft text-accent',
    ink: 'bg-ink text-canvas',
    neutral: 'bg-sunken text-muted',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={cn('shrink-0 object-cover', sizes[size], className)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center font-bold tracking-wide',
        sizes[size] ?? sizes.md,
        tones[tone] ?? tones.accent,
        className
      )}
    >
      {initials || '?'}
    </span>
  );
}
