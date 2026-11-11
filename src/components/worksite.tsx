import clsx from 'clsx';
import { BadgeCheck, Check, ChevronRight, HardHat, ReceiptText } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * The "Site Tough" building blocks shared by the real app and the demo: a big navy header,
 * orange-iconed section titles, white list cards with thumbnails, and an orange-active tab bar.
 */

/** `wide`: on tablets and computers the header turns into a plain page title, since the sidebar carries the navy. */
export function AppHeader({ title, subtitle, right, compact, wide }: { title: string; subtitle?: ReactNode; right?: ReactNode; compact?: boolean; wide?: boolean }) {
  return (
    <header
      className={clsx(
        'sticky top-0 z-10 flex items-end gap-3 bg-navy px-4 text-white',
        compact ? 'pt-3 pb-3' : 'pt-6 pb-5',
        wide && 'md:static md:bg-transparent md:px-6 md:pt-8 md:pb-2 md:text-ink lg:px-8',
      )}
    >
      <div className="min-w-0 flex-1">
        <h1 className={clsx('font-display leading-none font-bold tracking-tight', compact ? 'text-[28px]' : 'text-[38px]', wide && 'md:text-[40px]')}>{title}</h1>
        {subtitle && <p className={clsx('mt-1.5 truncate text-[14px] text-white/80', wide && 'md:text-[15px] md:text-ink-2')}>{subtitle}</p>}
      </div>
      <span className={clsx(wide && 'md:hidden')}>{right ?? <HardHat className="size-12 shrink-0 text-[#f0a05c]" strokeWidth={1.6} aria-hidden />}</span>
    </header>
  );
}

/** The navy menu down the left on tablets and computers. */
export function Sidebar<T extends string>({ items, active, onChange, footer }: { items: TabItem<T>[]; active: T; onChange: (t: T) => void; footer?: ReactNode }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col bg-navy text-white md:flex lg:w-64">
      <p className="flex items-center gap-2.5 px-5 pt-6 pb-7 font-display text-[27px] leading-none font-bold">
        <span className="grid size-9 place-items-center rounded-lg bg-white/10 text-[#f0a05c]">
          <Check className="size-6" strokeWidth={3.2} />
        </span>
        QuoteDesk
      </p>
      <nav className="flex flex-col gap-1 px-3" aria-label="QuoteDesk">
        {items.map((t) => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              aria-current={on ? 'page' : undefined}
              className={clsx('flex h-12 items-center gap-3 rounded-xl px-3 text-left text-[15px] [&>svg]:size-5', on ? 'bg-white font-bold text-navy' : 'font-medium text-white/85 hover:bg-white/10 hover:text-white')}
            >
              <span className={clsx(on && 'text-accent', '[&>svg]:size-5')}>{t.icon}</span>
              <span className="flex-1">{t.label}</span>
              {!!t.count && <span className="grid min-w-6 place-items-center rounded-full bg-accent px-1.5 text-[12px] font-bold text-white">{t.count}</span>}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto p-4">{footer}</div>
    </aside>
  );
}

export function SectionTitle({ icon, children, count }: { icon: ReactNode; children: ReactNode; count?: number }) {
  return (
    <h2 className="flex items-center gap-2.5 px-4 pt-5 pb-2.5">
      <span className="text-accent [&>svg]:size-[22px]">{icon}</span>
      <span className="font-display text-[22px] leading-none font-bold">{children}</span>
      {!!count && <span className="ml-auto grid size-7 place-items-center rounded-full bg-accent text-[13px] font-bold text-white">{count}</span>}
    </h2>
  );
}

export function ListCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('mx-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_1px_3px_rgb(23_32_42/0.06)]', className)}>{children}</div>;
}

export function ListRow({ thumb, title, sub, onClick, extra, active }: { thumb: ReactNode; title: ReactNode; sub: ReactNode; onClick: () => void; extra?: ReactNode; active?: boolean }) {
  return (
    <button onClick={onClick} aria-current={active || undefined} className={clsx('flex min-h-[76px] w-full items-center gap-3 px-3 py-2.5 text-left', active ? 'bg-accent-soft shadow-[inset_4px_0_0_var(--color-accent)]' : 'hover:bg-surface-2')}>
      {thumb}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15.5px] font-bold">{title}</p>
        <p className="mt-0.5 truncate text-[13.5px] text-ink-2">{sub}</p>
        {extra && <div className="mt-1 flex flex-wrap items-center gap-1.5">{extra}</div>}
      </div>
      <ChevronRight className="size-5 shrink-0 text-ink-3" />
    </button>
  );
}

/** A customer's photo, or an orange icon tile when there isn't one. */
export function Thumb({ src, icon, count }: { src?: string | null; icon: ReactNode; count?: number }) {
  return (
    <span className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-accent-soft text-accent [&>svg]:size-6">
      {src ? <img src={src} alt="" className="size-full object-cover" /> : icon}
      {!!count && count > 1 && <span className="absolute right-0.5 bottom-0.5 rounded bg-ink/75 px-1 text-[10px] font-bold text-white">{count}</span>}
    </span>
  );
}

/** "New · Preston": the status word coloured, then the place. */
export function StatusLine({ status, tone, rest }: { status: string; tone: 'accent' | 'navy' | 'good' | 'muted'; rest?: ReactNode }) {
  return (
    <>
      <span className={clsx('font-semibold', tone === 'accent' && 'text-accent', tone === 'navy' && 'text-navy', tone === 'good' && 'text-good', tone === 'muted' && 'text-ink-3')}>{status}</span>
      {rest && <> · {rest}</>}
    </>
  );
}

export type TabItem<T extends string> = { id: T; icon: ReactNode; label: string; count?: number };

export function TabBar<T extends string>({ items, active, onChange, fixed = true, className }: { items: TabItem<T>[]; active: T; onChange: (t: T) => void; fixed?: boolean; className?: string }) {
  return (
    <nav
      className={clsx('z-20 grid border-t border-line bg-surface', fixed && 'fixed inset-x-0 bottom-0 pb-[env(safe-area-inset-bottom)]', className)}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      aria-label="QuoteDesk"
    >
      {items.map((t) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            aria-current={on ? 'page' : undefined}
            className={clsx('relative flex min-h-[60px] flex-col items-center justify-center gap-1 text-[11.5px]', on ? 'font-bold text-accent' : 'font-medium text-ink-2')}
          >
            {t.icon}
            {t.label}
            {!!t.count && <span className="absolute top-1.5 right-[calc(50%-22px)] grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-white">{t.count}</span>}
          </button>
        );
      })}
    </nav>
  );
}

/** The two numbers a tradie checks first: what it's worth, and how good a lead it is. */
export function PriceFit({ price, priceNote, score, scoreLabel, tone }: { price: string | null; priceNote: string; score: number; scoreLabel: string; tone: 'good' | 'mid' | 'bad' }) {
  return (
    <div className="grid grid-cols-[1.35fr_1fr] gap-2.5">
      <div className="rounded-2xl border border-line bg-surface p-3.5">
        <p className="flex items-center gap-1.5 text-[13px] font-bold">
          <ReceiptText className="size-4 text-ink-2" /> Price guide
        </p>
        <p className={clsx('mt-1.5 font-display leading-none font-bold tabular-nums', price ? (price.length > 13 ? 'text-[22px] whitespace-nowrap' : 'text-[30px]') : 'text-[20px] text-ink-2')}>{price ?? 'Not priced yet'}</p>
        <p className="mt-1 text-[12px] text-ink-3">{priceNote}</p>
      </div>
      <div className={clsx('rounded-2xl border p-3.5', tone === 'good' ? 'border-good/25 bg-good-soft' : tone === 'bad' ? 'border-bad/25 bg-bad-soft' : 'border-mid/25 bg-mid-soft')}>
        <p className={clsx('flex items-center gap-1.5 text-[13px] font-bold', tone === 'good' ? 'text-good' : tone === 'bad' ? 'text-bad' : 'text-mid')}>
          <BadgeCheck className="size-4" /> Fit score
        </p>
        <p className={clsx('mt-1.5 font-display text-[34px] leading-none font-bold tabular-nums', tone === 'good' ? 'text-good' : tone === 'bad' ? 'text-bad' : 'text-mid')}>{score}%</p>
        <p className="mt-1 text-[12px] font-semibold text-ink-2">{scoreLabel}</p>
      </div>
    </div>
  );
}
