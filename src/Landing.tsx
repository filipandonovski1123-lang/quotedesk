import { Camera, Check, Clock, MessageSquare, ShieldCheck, Sparkles, Wallet } from 'lucide-react';
import { lazy, Suspense, type ReactNode } from 'react';
import { Card } from './components/ui';

const FEATURES: { icon: ReactNode; title: string; text: string }[] = [
  { icon: <Camera className="size-5" />, title: 'Enquiries arrive complete', text: 'Your link asks the questions you’d ask: size, materials, timing, budget, other quotes, plus photos. No more “how much for a deck?”' },
  { icon: <Sparkles className="size-5" />, title: 'A price guide and a fit score', text: 'Every enquiry gets a price range from your own rates, and a score that flags tyre-kickers, out-of-area jobs and tiny budgets.' },
  { icon: <MessageSquare className="size-5" />, title: 'Reply in one tap', text: 'Offer a paid site visit, send a ballpark, or decline politely. The text is written in your voice and sends from your own phone.' },
  { icon: <Wallet className="size-5" />, title: 'Paid site visits', text: 'Ask for a visit fee that comes off the job. Serious customers pay. The rest drop out before you’ve driven anywhere.' },
  { icon: <Clock className="size-5" />, title: 'Every quote followed up', text: 'Days 2, 7 and 14, ready to send. Customers accept online in one tap, and the job shows as won.' },
  { icon: <ShieldCheck className="size-5" />, title: 'Your data stays yours', text: 'No ads, nothing sold. Download everything or delete your account any time.' },
];

// The real demo app, shown live in a phone on the landing page. Loaded after the page itself.
const DemoPhone = lazy(() => import('./views/Tradie').then((m) => ({ default: m.TradiePhone })));

export function Landing() {
  return (
    <div className="min-h-dvh">
      <div className="bg-navy text-white">
        <header className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4">
          <p className="flex items-center gap-2 font-display text-[26px] leading-none font-bold">
            <span className="grid size-8 place-items-center rounded-lg bg-white/10 text-[#f0a05c]">
              <Check className="size-5" strokeWidth={3.2} />
            </span>
            QuoteDesk
          </p>
          <nav className="ml-auto flex items-center gap-1 text-[14px]">
            <a href="#/demo" className="hidden rounded-lg px-3 py-1.5 text-white/80 hover:text-white sm:inline">
              Try the demo
            </a>
            <a href="#/app/signin" className="inline-flex h-10 items-center rounded-xl border border-white/30 px-4 font-semibold hover:bg-white/10">
              Sign in
            </a>
          </nav>
        </header>

        <section className="mx-auto grid max-w-5xl items-center gap-10 px-4 pt-8 pb-14 md:grid-cols-[1fr_auto] md:pt-14 md:pb-20">
          <div>
            <p className="text-[13px] font-bold tracking-wide text-[#f0a05c] uppercase">For tradies who quote</p>
            <h1 className="mt-3 font-display text-[50px] leading-[0.95] font-bold tracking-tight md:text-[74px]">
              Stop quoting for free.
              <br />
              Follow up every quote.
            </h1>
            <p className="mt-5 max-w-xl text-[16.5px] leading-relaxed text-white/85 md:text-[18px]">
              QuoteDesk sorts serious customers from tyre-kickers before you drive out, gives you a price guide from your own rates, and makes sure no quote goes quiet.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#/app" className="inline-flex h-14 items-center rounded-xl bg-accent px-7 text-[17px] font-bold text-white hover:brightness-95">
                Start free pilot
              </a>
              <a href="#/demo" className="inline-flex h-14 items-center rounded-xl border border-white/30 px-7 text-[16px] font-semibold hover:bg-white/10">
                See how it works
              </a>
            </div>
            <p className="mt-3 text-[13px] text-white/70">Free during the pilot · Works on your phone · Set up in about 3 minutes</p>
          </div>
          <div className="mx-auto h-[640px] w-[330px] overflow-hidden rounded-[42px] border-[10px] border-[#0d1620] bg-surface text-ink shadow-2xl">
            <div className="flex h-full flex-col">
              <Suspense fallback={<div className="flex-1 bg-bg" />}>
                <DemoPhone />
              </Suspense>
            </div>
          </div>
        </section>
      </div>

      <main className="mx-auto max-w-5xl px-4 pt-12">
        <h2 className="mb-5 font-display text-[34px] leading-none font-bold">Built for real work</h2>
        <section className="grid gap-3 pb-14 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="rounded-2xl p-5">
              <div className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent">{f.icon}</div>
              <p className="mt-3 font-display text-[22px] leading-tight font-bold">{f.title}</p>
              <p className="mt-1 text-[14px] leading-relaxed text-ink-2">{f.text}</p>
            </Card>
          ))}
        </section>

        <section className="pb-16">
          <Card className="grid gap-6 rounded-2xl p-6 md:grid-cols-3">
            <div>
              <p className="font-display text-[22px] font-bold text-accent">1. Share your link</p>
              <p className="mt-1 text-[14px] text-ink-2">On your website, Google profile, socials and missed-call text.</p>
            </div>
            <div>
              <p className="font-display text-[22px] font-bold text-accent">2. Answer in a tap</p>
              <p className="mt-1 text-[14px] text-ink-2">See the price guide and fit score, then send the right reply from your phone.</p>
            </div>
            <div>
              <p className="font-display text-[22px] font-bold text-accent">3. Never forget a follow-up</p>
              <p className="mt-1 text-[14px] text-ink-2">QuoteDesk lines them up on the right days, and customers accept online.</p>
            </div>
          </Card>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-wrap gap-x-4 gap-y-1 px-4 py-6 text-[13px] text-ink-3">
          <span className="font-semibold text-ink-2">QuoteDesk · pilot</span>
          <a href="#/privacy" className="hover:underline">
            Privacy
          </a>
          <a href="#/terms" className="hover:underline">
            Terms
          </a>
        </div>
      </footer>
    </div>
  );
}
