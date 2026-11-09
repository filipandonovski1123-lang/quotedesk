import clsx from 'clsx';
import { FastForward, RotateCcw, SkipForward } from 'lucide-react';
import { useState } from 'react';
import { Button } from './components/ui';
import { advance, resetDemo, useAppState } from './lib/store';
import { Business } from './views/Business';
import { CustomerPhone } from './views/Customer';
import { TradiePhone } from './views/Tradie';
import { Phone } from './components/ui';

type Page = 'demo' | 'business';

export default function App() {
  const [page, setPage] = useState<Page>('demo');
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
          <p className="text-[16px] font-semibold">
            Quote<span className="text-accent">Desk</span> <span className="ml-1 text-[12px] font-medium text-ink-3">prototype</span>
          </p>
          <nav className="ml-auto flex rounded-lg border border-line bg-surface p-0.5" aria-label="Pages">
            {(
              [
                ['demo', 'Live demo', 'Demo'],
                ['business', 'How the business works', 'Business'],
              ] as const
            ).map(([id, label, short]) => (
              <button key={id} onClick={() => setPage(id)} aria-current={page === id ? 'page' : undefined} className={clsx('h-8 rounded-md px-3 text-[13px] font-medium whitespace-nowrap', page === id ? 'bg-navy text-white' : 'text-ink-2 hover:text-ink')}>
                <span className="sm:hidden">{short}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>
      {page === 'demo' ? <Demo /> : <Business />}
    </div>
  );
}

function Demo() {
  const s = useAppState();
  const [side, setSide] = useState<'customer' | 'tradie'>('customer');
  return (
    <main className="mx-auto max-w-6xl px-4 py-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2">
        <p className="text-[13px]">
          <span className="font-semibold">Day {s.day}</span>
          <span className="text-ink-3"> · supplier prices {s.materialIndex > 100 ? `+${(s.materialIndex - 100).toFixed(1)}%` : 'steady'}</span>
        </p>
        <div className="ml-auto flex flex-wrap gap-1.5">
          <Button size="sm" onClick={() => advance(1)}>
            <SkipForward className="size-4" /> Next day
          </Button>
          <Button size="sm" onClick={() => advance(7)}>
            <FastForward className="size-4" /> Skip a week
          </Button>
          <Button size="sm" variant="ghost" onClick={() => confirm('Reset the demo to its starting customers?') && resetDemo()}>
            <RotateCcw className="size-4" /> Reset
          </Button>
        </div>
      </div>

      <p className="mt-3 text-[12.5px] text-ink-2 md:hidden">Fill in an enquiry as the customer, then switch to the tradie’s phone to answer it. Skip days to watch the follow-ups work.</p>
      <ol className="mt-3 hidden gap-2 text-[12.5px] text-ink-2 md:grid md:grid-cols-4">
        {[
          ['1', 'As the customer, fill in the enquiry form (or use the example).'],
          ['2', 'As the tradie, open it in the inbox: see the price range, fit score and suggested reply.'],
          ['3', 'Send a ballpark or visit offer, then pay the deposit on the customer phone and send a quote.'],
          ['4', 'Skip days to watch follow-ups go out, prices creep up, and jobs come back.'],
        ].map(([k, t]) => (
          <li key={k} className="flex gap-2 rounded-lg bg-surface-2 px-3 py-2">
            <span className="font-semibold text-accent">{k}</span>
            {t}
          </li>
        ))}
      </ol>

      <div className="mt-3 grid grid-cols-2 rounded-lg border border-line bg-surface p-0.5 md:hidden">
        {(['customer', 'tradie'] as const).map((x) => (
          <button key={x} onClick={() => setSide(x)} className={clsx('h-9 rounded-md text-[13px] font-medium', side === x ? 'bg-navy text-white' : 'text-ink-2')}>
            {x === 'customer' ? 'Customer’s phone' : 'Tradie’s phone'}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col justify-center gap-8 md:flex-row">
        <div className={clsx(side !== 'customer' && 'hidden md:block')}>
          <Phone label="Customer’s phone">
            <CustomerPhone />
          </Phone>
        </div>
        <div className={clsx(side !== 'tradie' && 'hidden md:block')}>
          <Phone label="Tradie’s phone">
            <TradiePhone />
          </Phone>
        </div>
      </div>
    </main>
  );
}
