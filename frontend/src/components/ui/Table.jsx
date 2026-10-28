import cn from './cn';

/** Panel + horizontal scroll wrapper around a table. */
export function TableShell({ className, children }) {
  return (
    <div className={cn('overflow-hidden rounded-lg border border-line bg-surface shadow-xs', className)}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function Table({ className, children, ...props }) {
  return (
    <table className={cn('w-full border-collapse text-left', className)} {...props}>
      {children}
    </table>
  );
}

export function THead({ className, children }) {
  return (
    <thead className={cn('bg-sunken', className)}>
      {children}
    </thead>
  );
}

export function TBody({ className, children }) {
  return <tbody className={cn('divide-y divide-line', className)}>{children}</tbody>;
}

export function TR({ className, children, ...props }) {
  return (
    <tr className={cn('transition-colors duration-100 hover:bg-sunken/70', className)} {...props}>
      {children}
    </tr>
  );
}

export function Th({ className, children, align = 'left', ...props }) {
  return (
    <th
      scope="col"
      className={cn(
        'whitespace-nowrap border-b border-line px-4 py-2.5 text-2xs font-bold uppercase ' +
          'tracking-[0.08em] text-muted',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function Td({ className, children, align = 'left', ...props }) {
  return (
    <td
      className={cn(
        'px-4 py-3 text-[13px] text-body align-middle',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
}

/** Full-width row used when a table has no data. */
export function TableEmpty({ colSpan, icon: Icon, title, description, action }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-14">
        <div className="flex flex-col items-center text-center">
          {Icon ? (
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-sunken text-faint">
              <Icon size={20} />
            </span>
          ) : null}
          <p className="text-[13px] font-semibold text-ink">{title}</p>
          {description ? <p className="mt-1 max-w-sm text-xs text-muted">{description}</p> : null}
          {action ? <div className="mt-4">{action}</div> : null}
        </div>
      </td>
    </tr>
  );
}

export default Table;
