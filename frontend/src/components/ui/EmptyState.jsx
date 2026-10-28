import cn from './cn';

export default function EmptyState({ icon: Icon, title, description, action, className, compact }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'px-4 py-8' : 'px-6 py-14',
        className
      )}
    >
      {Icon ? (
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-sunken text-faint">
          <Icon size={20} />
        </span>
      ) : null}
      <p className="text-[13px] font-semibold text-ink">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
