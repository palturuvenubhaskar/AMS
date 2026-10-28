import cn from './cn';

/**
 * Page-level heading. Every route renders exactly one so the header bar can
 * stay quiet and functional.
 */
export default function PageHeader({ title, description, eyebrow, actions, className, children }) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1.5 text-2xs font-bold uppercase tracking-[0.14em] text-faint">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-xl font-bold tracking-tight text-ink sm:text-[22px]">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted">{description}</p>
        ) : null}
        {children}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
