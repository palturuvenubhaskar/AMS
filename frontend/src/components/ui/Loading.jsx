import cn from './cn';

const sizes = { sm: 'h-4 w-4 border-2', md: 'h-6 w-6 border-2', lg: 'h-8 w-8 border-[3px]' };

export function Spinner({ size = 'md', className }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block animate-spin rounded-full border-line-strong border-t-accent',
        sizes[size] ?? sizes.md,
        className
      )}
    />
  );
}

export function PageLoader({ label = 'Loading', className }) {
  return (
    <div className={cn('flex min-h-[50vh] flex-col items-center justify-center gap-3', className)}>
      <Spinner size="lg" />
      <p className="text-xs font-medium text-faint">{label}</p>
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse-soft rounded-md bg-sunken', className)} />;
}

export default Spinner;
