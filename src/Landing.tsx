import { Camera, Clock, MessageSquare, ShieldCheck, Sparkles, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from './components/ui';

const FEATURES: { icon: ReactNode; title: string; text: string }[] = [
  { icon: <Camera className="size-5" />, title: 'Enquiries arrive complete', text: 'Your link asks the questions you’d ask: size, materials, timing, budget, other quotes, plus photos. No more “how much for a deck?”' },
  { icon: <Sparkles className="size-5" />, title: 'A price guide and a fit score', text: 'Every enquiry gets a price range from your own rates, and a score that flags tyre-kickers, out-of-area jobs and tiny budgets.' },
  { icon: <MessageSquare className="size-5" />, title: 'Reply in one tap', text: 'Offer a paid site visit, send a ballpark, or decline politely. The text is written in your voice and sends from your own phone.' },
  { icon: <Wallet className="size-5" />, title: 'Paid site visits', text: 'Ask for a visit fee that comes off the job. Serious customers pay. The rest drop out before you’ve driven anywhere.' },
  { icon: <Clock className="size-5" />, title: 'Every quote followed up', text: 'Days 2, 7 and 14, ready to send. Customers accept online in one tap, and the job shows as won.' },
  { icon: <ShieldCheck className="size-5" />, title: 'Your data stays yours', text: 'No ads, nothing sold. Download everything or delete your account any time.' },
];

export function Landing() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4">
        <p className="text-[19px] font-bold">
          Quote<span className="text-accent">Desk</span>
        </p>
        <nav className="ml-auto flex items-center gap-1 text-[14px]">
          <a href="#/demo" className="rounded-lg px-3 py-1.5 text-ink-2 hover:bg-surface-2 hover:text-ink">
            Try the demo
          </a>
          <a href="#/app/signin" className="inline-flex h-10 items-center rounded-xl border border-line-strong bg-surface px-4 font-semibold hover:bg-surface-2">
            Sign in
          </a>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4">
        <section className="py-12 md:py-20">
          <p className="text-[13px] font-semibold tracking-wide text-accent uppercase">For tradies who quote</p>
          <h1 className="mt-3 max-w-3xl text-[36px] leading-[1.05] font-bold tracking-tight md:text-[56px]">Stop quoting for free. Follow up every quote.</h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-ink-2 md:text-[18px]">
            QuoteDesk sorts serious customers from tyre-kickers before you drive out, gives you a price guide from your own rates, and makes sure no quote goes quiet without a follow-up.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#/app" className="inline-flex h-14 items-center rounded-xl bg-navy px-7 text-[16px] font-bold text-white hover:bg-ink">
              Start free pilot
            </a>
            <a href="#/demo" className="inline-flex h-14 items-center rounded-xl border border-line-strong bg-surface px-7 text-[16px] font-semibold hover:bg-surface-2">
              See how it works
            </a>
          </div>
          <p className="mt-3 text-[13px] text-ink-3">Free during the pilot · Works on your phone · Set up in about 3 minutes</p>
        </section>

        <section className="grid gap-3 pb-14 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="p-5">
              <div className="grid size-9 place-items-center rounded-lg bg-accent-soft text-accent">{f.icon}</div>
              <p className="mt-3 text-[17px] font-bold">{f.title}</p>
              <p className="mt-1 text-[14px] leading-relaxed text-ink-2">{f.text}</p>
            </Card>
          ))}
        </section>

        <section className="pb-16">
          <Card className="grid gap-6 p-6 md:grid-cols-3">
            <div>
              <p className="text-[13px] font-semibold text-accent">1. Share your link</p>
              <p className="mt-1 text-[14px] text-ink-2">On your website, Google profile, socials and missed-call text.</p>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-accent">2. Answer in a tap</p>
              <p className="mt-1 text-[14px] text-ink-2">See the price guide and fit score, then send the right reply from your phone.</p>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-accent">3. Never forget a follow-up</p>
              <p className="mt-1 text-[14px] text-ink-2">QuoteDesk lines them up on the right days, and customers accept online.</p>
            </div>
          </Card>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-wrap gap-x-4 gap-y-1 px-4 py-6 text-[13px] text-ink-3">
          <span>QuoteDesk · pilot</span>
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
