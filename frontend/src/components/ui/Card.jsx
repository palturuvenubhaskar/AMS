import cn from './cn';

export function Card({ className, children, ...props }) {
  return (
    <section
      className={cn(
        'rounded-lg border border-line bg-surface shadow-xs',
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function CardHeader({ className, children, actions, ...props }) {
  return (
    <header
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4',
        className
      )}
      {...props}
    >
      <div className="min-w-0">{children}</div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3 className={cn('text-[15px] font-bold leading-tight text-ink', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p className={cn('mt-1 text-[13px] leading-relaxed text-muted', className)} {...props}>
      {children}
    </p>
  );
}

export function CardBody({ className, children, ...props }) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <footer
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 border-t border-line bg-sunken/60 px-5 py-3.5',
        className
      )}
      {...props}
    >
      {children}
    </footer>
  );
}

export default Card;
