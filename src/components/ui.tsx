import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent'; size?: 'sm' | 'md' }) {
  return (
    <button
      {...rest}
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-10 px-4 text-sm',
        variant === 'primary' && 'bg-navy text-white hover:bg-ink',
        variant === 'accent' && 'bg-accent text-white hover:brightness-95',
        variant === 'secondary' && 'border border-line bg-surface text-ink hover:bg-surface-2',
        variant === 'ghost' && 'text-ink-2 hover:bg-surface-2 hover:text-ink',
        variant === 'danger' && 'border border-line bg-surface text-bad hover:bg-bad-soft',
        className,
      )}
    />
  );
}

export function Badge({ tone = 'neutral', children }: { tone?: 'good' | 'mid' | 'bad' | 'neutral' | 'accent' | 'navy'; children: ReactNode }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold whitespace-nowrap',
        tone === 'good' && 'bg-good-soft text-good',
        tone === 'mid' && 'bg-mid-soft text-mid',
        tone === 'bad' && 'bg-bad-soft text-bad',
        tone === 'neutral' && 'bg-surface-2 text-ink-2',
        tone === 'accent' && 'bg-accent-soft text-accent',
        tone === 'navy' && 'bg-navy text-white',
      )}
    >
      {children}
    </span>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  // Defaults only apply when the caller doesn't set its own, since two Tailwind colours on one element clash.
  const custom = className ?? '';
  return <div className={clsx('rounded-xl border', !/\bborder-[a-z]/.test(custom) && 'border-line', !/\bbg-/.test(custom) && 'bg-surface', className)}>{children}</div>;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-ink-3">{hint}</span>}
    </label>
  );
}

export const inputCls =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-[14px] text-ink outline-none focus:border-navy focus:ring-2 focus:ring-navy/15';

/** A phone-shaped frame on wide screens; plain full-width on phones. */
export function Phone({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section aria-label={label} className="flex w-full flex-col md:w-[380px] md:shrink-0">
      <p className="mb-2 hidden text-center text-[12px] font-semibold tracking-wide text-ink-3 uppercase md:block">{label}</p>
      <div className="relative flex h-[calc(100dvh-170px)] min-h-[560px] flex-col overflow-hidden bg-surface md:h-[760px] md:rounded-[34px] md:border-[10px] md:border-ink md:shadow-xl">
        {children}
      </div>
    </section>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <p className="text-[12px] text-ink-3">{label}</p>
      <p className="mt-0.5 text-[22px] leading-tight font-semibold tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-[12px] text-ink-2">{sub}</p>}
    </div>
  );
}
