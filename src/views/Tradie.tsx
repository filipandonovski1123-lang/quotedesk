import clsx from 'clsx';
import { ArrowLeft, BarChart3, Check, ChevronRight, Clock, Image, Inbox, MessageSquare, Settings as Cog, Sparkles, TrendingUp, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Badge, Button, Card, Field, inputCls, Stat } from '../components/ui';
import { PLAN_PRICE, results } from '../lib/metrics';
import { aud, fitLabel, jobOf, range, suggestAction, TRADES, type Suggestion } from '../lib/pricing';
import { approveFollowUp, draftFor, draftQuote, markOutcome, priceRise, reprice, respond, sendQuote, skipFollowUp, updateProfile, useAppState } from '../lib/store';
import type { Enquiry, Status, TradeId } from '../lib/types';
import { Thread } from './Thread';

type Tab = 'inbox' | 'quotes' | 'results' | 'settings';

export function TradiePhone() {
  const s = useAppState();
  const [tab, setTab] = useState<Tab>('inbox');
  const [openId, setOpenId] = useState<string | null>(null);
  const open = s.enquiries.find((e) => e.id === openId) ?? null;
  const r = results(s);
  const needs = s.enquiries.filter((e) => needsYou(e, s.materialIndex)).length;

  if (open) return <Detail e={open} onBack={() => setOpenId(null)} />;

  return (
    <>
      <header className="border-b border-line bg-surface px-4 py-3">
        <p className="text-[12px] text-ink-3">{s.profile.business}</p>
        <h2 className="text-[17px] font-semibold">{tab === 'inbox' ? 'Enquiries' : tab === 'quotes' ? 'Quotes out' : tab === 'results' ? 'Results' : 'Settings'}</h2>
      </header>
      <div className="scroll-thin flex-1 overflow-y-auto bg-bg/50">
        {tab === 'inbox' && <InboxList onOpen={setOpenId} />}
        {tab === 'quotes' && <QuotesList onOpen={setOpenId} />}
        {tab === 'results' && <Results />}
        {tab === 'settings' && <Settings />}
      </div>
      <nav className="grid grid-cols-4 border-t border-line bg-surface" aria-label="Tradie app">
        <TabBtn icon={<Inbox className="size-5" />} label="Inbox" active={tab === 'inbox'} onClick={() => setTab('inbox')} count={needs} />
        <TabBtn icon={<MessageSquare className="size-5" />} label="Quotes" active={tab === 'quotes'} onClick={() => setTab('quotes')} count={r.awaiting} />
        <TabBtn icon={<BarChart3 className="size-5" />} label="Results" active={tab === 'results'} onClick={() => setTab('results')} />
        <TabBtn icon={<Cog className="size-5" />} label="Settings" active={tab === 'settings'} onClick={() => setTab('settings')} />
      </nav>
    </>
  );
}

function TabBtn({ icon, label, active, onClick, count }: { icon: ReactNode; label: string; active: boolean; onClick: () => void; count?: number }) {
  return (
    <button onClick={onClick} aria-current={active ? 'page' : undefined} className={clsx('relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium', active ? 'text-navy' : 'text-ink-3')}>
      {icon}
      {label}
      {!!count && <span className="absolute top-1 right-[calc(50%-20px)] grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] text-white">{count}</span>}
    </button>
  );
}

function needsYou(e: Enquiry, materialIndex: number) {
  return e.status === 'new' || e.status === 'visit_booked' || e.followUps.some((f) => f.status === 'awaiting') || priceRise(e, materialIndex) >= 0.03;
}

const STATUS: Record<Status, { label: string; tone: 'good' | 'mid' | 'bad' | 'neutral' | 'accent' | 'navy' }> = {
  new: { label: 'New', tone: 'accent' },
  ballpark: { label: 'Ballpark sent', tone: 'neutral' },
  visit_offered: { label: 'Visit offered', tone: 'neutral' },
  visit_booked: { label: 'Visit booked · quote due', tone: 'accent' },
  quoted: { label: 'Quoted', tone: 'navy' },
  won: { label: 'Won', tone: 'good' },
  lost: { label: 'Lost', tone: 'bad' },
  declined: { label: 'Declined', tone: 'neutral' },
};

function Row({ e, onOpen, extra }: { e: Enquiry; onOpen: (id: string) => void; extra?: ReactNode }) {
  const s = useAppState();
  const fit = fitLabel(e.fit.score);
  return (
    <button onClick={() => onOpen(e.id)} className="flex w-full items-center gap-3 border-b border-line bg-surface px-4 py-3 text-left hover:bg-surface-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[14px] font-semibold">{e.name}</p>
          <Badge tone={STATUS[e.status].tone}>{STATUS[e.status].label}</Badge>
        </div>
        <p className="mt-0.5 truncate text-[12.5px] text-ink-2">
          {jobOf(s.profile.trade, e.jobType).label} · {e.suburb} · {e.quote ? aud(e.quote.amount) : range(e.estimate)}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {e.status === 'new' && <Badge tone={fit.tone}>{fit.label} · {e.fit.score}</Badge>}
          {extra}
        </div>
      </div>
      <ChevronRight className="size-4 shrink-0 text-ink-3" />
    </button>
  );
}

function Section({ title, children, empty }: { title: string; children: ReactNode[]; empty?: string }) {
  return (
    <div>
      <p className="px-4 pt-4 pb-1.5 text-[11.5px] font-semibold tracking-wide text-ink-3 uppercase">{title}</p>
      {children.length ? children : empty ? <p className="px-4 pb-2 text-[13px] text-ink-3">{empty}</p> : null}
    </div>
  );
}

function InboxList({ onOpen }: { onOpen: (id: string) => void }) {
  const s = useAppState();
  const sorted = [...s.enquiries].sort((a, b) => b.createdDay - a.createdDay);
  const needs = sorted.filter((e) => needsYou(e, s.materialIndex));
  const waiting = sorted.filter((e) => !needsYou(e, s.materialIndex) && ['ballpark', 'visit_offered', 'quoted'].includes(e.status));
  const closed = sorted.filter((e) => ['won', 'lost', 'declined'].includes(e.status));
  const extra = (e: Enquiry) => (
    <>
      {e.followUps.some((f) => f.status === 'awaiting') && <Badge tone="accent">Follow-up to approve</Badge>}
      {priceRise(e, s.materialIndex) >= 0.03 && <Badge tone="mid">Prices up {Math.round(priceRise(e, s.materialIndex) * 100)}%</Badge>}
    </>
  );
  return (
    <>
      <Section title={`Needs you (${needs.length})`} empty="All caught up.">
        {needs.map((e) => (
          <Row key={e.id} e={e} onOpen={onOpen} extra={extra(e)} />
        ))}
      </Section>
      <Section title={`Waiting on the customer (${waiting.length})`} empty="Nothing waiting.">
        {waiting.map((e) => (
          <Row key={e.id} e={e} onOpen={onOpen} />
        ))}
      </Section>
      <Section title={`Closed (${closed.length})`}>
        {closed.map((e) => (
          <Row key={e.id} e={e} onOpen={onOpen} />
        ))}
      </Section>
    </>
  );
}

function FollowDots({ e }: { e: Enquiry }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label="Follow-ups">
      {e.followUps.map((f) => (
        <span
          key={f.n}
          title={`Follow-up ${f.n}: ${f.status}`}
          className={clsx(
            'size-2 rounded-full',
            f.status === 'sent' && 'bg-good',
            f.status === 'awaiting' && 'bg-accent',
            f.status === 'scheduled' && 'border border-ink-3',
            f.status === 'cancelled' && 'bg-line',
          )}
        />
      ))}
    </span>
  );
}

function QuotesList({ onOpen }: { onOpen: (id: string) => void }) {
  const s = useAppState();
  const out = s.enquiries.filter((e) => e.status === 'quoted');
  const total = out.reduce((v, e) => v + (e.quote?.amount ?? 0), 0);
  return (
    <>
      <div className="px-4 pt-4">
        <Card className="p-3">
          <p className="text-[12px] text-ink-3">Open quotes</p>
          <p className="text-[22px] font-semibold tabular-nums">{aud(total)}</p>
          <p className="text-[12px] text-ink-2">
            {out.length} quote{out.length === 1 ? '' : 's'} being followed up on days 2, 7 and 14{s.profile.autoSend ? ', sent automatically' : ', waiting for your approval each time'}.
          </p>
        </Card>
      </div>
      <Section title="Following up" empty="No open quotes. Send one from an enquiry with a booked visit.">
        {out.map((e) => {
          const next = e.followUps.find((f) => f.status === 'scheduled' || f.status === 'awaiting');
          return (
            <Row
              key={e.id}
              e={e}
              onOpen={onOpen}
              extra={
                <>
                  <FollowDots e={e} />
                  <span className="text-[11.5px] text-ink-3">{next ? (next.status === 'awaiting' ? 'Follow-up waiting for you' : `Next follow-up day ${next.dueDay}`) : 'All follow-ups sent'}</span>
                  {priceRise(e, s.materialIndex) >= 0.03 && <Badge tone="mid">Prices up {Math.round(priceRise(e, s.materialIndex) * 100)}%</Badge>}
                </>
              }
            />
          );
        })}
      </Section>
    </>
  );
}

function Results() {
  const s = useAppState();
  const r = results(s);
  const roi = r.wonBackValue > 0 ? Math.round(r.wonBackValue / PLAN_PRICE) : 0;
  return (
    <div className="space-y-3 p-4">
      <Card className="border-navy bg-navy p-4 text-white">
        <p className="text-[12px] text-white/70">Brought back by follow-ups</p>
        <p className="text-[28px] font-semibold tabular-nums">{aud(r.wonBackValue)}</p>
        <p className="text-[12.5px] text-white/80">
          {r.wonBack} job{r.wonBack === 1 ? '' : 's'} said yes after a follow-up you didn't have to remember. QuoteDesk costs {aud(PLAN_PRICE)} a month
          {roi > 1 ? `, so that's about ${roi}× what you paid.` : '.'}
        </p>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Site visits avoided" value={r.avoided} sub="Answered without driving out" />
        <Stat label="Hours saved" value={r.hoursSaved.toFixed(1)} sub="Visits, quoting and follow-up texts" />
        <Stat label="Deposits taken" value={aud(r.deposits)} sub="Paid site visits" />
        <Stat label="Win rate" value={r.winRate === null ? '–' : `${Math.round(r.winRate * 100)}%`} sub={`${r.won} won of ${r.quotes} quoted`} />
        <Stat label="Work won" value={aud(r.wonValue)} sub="All quotes accepted" />
        <Stat label="Follow-ups sent" value={r.followUpsSent} sub="Each one you didn't write" />
      </div>
      <p className="text-[11.5px] leading-relaxed text-ink-3">Prototype numbers come from the demo customers. Hours assume a site visit and quote take {jobOf(s.profile.trade, TRADES[s.profile.trade].jobs[0]!.id).quoteHours} hours and a follow-up text takes 5 minutes.</p>
    </div>
  );
}

function Settings() {
  const s = useAppState();
  const p = s.profile;
  return (
    <div className="space-y-4 p-4">
      <Card className="p-3">
        <p className="text-[12px] text-ink-3">Your enquiry link</p>
        <p className="font-mono text-[13px]">quotedesk.app/{p.business.toLowerCase().replace(/[^a-z0-9]+/g, '-')}</p>
        <p className="mt-1 text-[12px] text-ink-2">Put it on your website, Google profile and missed-call text. Every enquiry arrives with photos, budget and timing.</p>
      </Card>
      <Field label="Trade (demo)" hint="Switching trade resets the demo with example customers for that trade.">
        <select className={inputCls} value={p.trade} onChange={(e) => updateProfile({ trade: e.target.value as TradeId })}>
          {Object.values(TRADES).map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Your name">
          <input className={inputCls} value={p.owner} onChange={(e) => updateProfile({ owner: e.target.value })} />
        </Field>
        <Field label="Business">
          <input className={inputCls} value={p.business} onChange={(e) => updateProfile({ business: e.target.value })} />
        </Field>
      </div>
      <Field label={`Your prices: ${Math.round(p.rateMultiplier * 100)}% of the example rates`} hint="In the real product you'd enter your own rates, or it learns them from past quotes.">
        <input type="range" min={0.7} max={1.4} step={0.05} value={p.rateMultiplier} onChange={(e) => updateProfile({ rateMultiplier: Number(e.target.value) })} className="w-full accent-navy" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Site visit fee">
          <input className={inputCls} inputMode="numeric" value={p.siteVisitFee} onChange={(e) => updateProfile({ siteVisitFee: Number(e.target.value.replace(/\D/g, '')) || 0 })} />
        </Field>
        <Field label="Area you cover (km)">
          <input className={inputCls} inputMode="numeric" value={p.radiusKm} onChange={(e) => updateProfile({ radiusKm: Number(e.target.value.replace(/\D/g, '')) || 0 })} />
        </Field>
      </div>
      <Field label="Message style">
        <select className={inputCls} value={p.tone} onChange={(e) => updateProfile({ tone: e.target.value as 'casual' | 'professional' })}>
          <option value="casual">Casual (Hi Sarah, Dave here…)</option>
          <option value="professional">Professional (Hello Sarah, this is Dave…)</option>
        </select>
      </Field>
      <label className="flex items-start gap-3 rounded-lg border border-line bg-surface p-3">
        <input type="checkbox" className="mt-0.5 size-4 accent-navy" checked={p.autoSend} onChange={(e) => updateProfile({ autoSend: e.target.checked })} />
        <span>
          <span className="block text-[13.5px] font-medium">Send follow-ups automatically</span>
          <span className="block text-[12px] text-ink-2">Off: each follow-up waits for you to approve it first.</span>
        </span>
      </label>
    </div>
  );
}

// ---------- one enquiry ----------

function Detail({ e, onBack }: { e: Enquiry; onBack: () => void }) {
  const s = useAppState();
  const [view, setView] = useState<'details' | 'messages'>('details');
  const job = jobOf(s.profile.trade, e.jobType);
  return (
    <>
      <header className="flex items-center gap-2 border-b border-line bg-surface px-2 py-2">
        <Button variant="ghost" size="sm" onClick={onBack} aria-label="Back">
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14.5px] font-semibold">{e.name}</p>
          <p className="truncate text-[12px] text-ink-3">
            {job.label} · {e.suburb} · {e.phone}
          </p>
        </div>
        <Badge tone={STATUS[e.status].tone}>{STATUS[e.status].label}</Badge>
      </header>
      <div className="grid grid-cols-2 gap-1 border-b border-line bg-surface p-1.5">
        {(['details', 'messages'] as const).map((v) => (
          <button key={v} onClick={() => setView(v)} className={clsx('h-8 rounded-md text-[13px] font-medium', view === v ? 'bg-surface-2 text-ink' : 'text-ink-3')}>
            {v === 'details' ? 'Details' : `Messages (${e.messages.length})`}
          </button>
        ))}
      </div>
      {view === 'messages' ? (
        <Thread e={e} side="tradie" />
      ) : (
        <div className="scroll-thin flex-1 space-y-3 overflow-y-auto bg-bg/50 p-3">
          <ActionPanel e={e} onShowMessages={() => setView('messages')} />
          <EnquiryFacts e={e} />
        </div>
      )}
    </>
  );
}

function EnquiryFacts({ e }: { e: Enquiry }) {
  const s = useAppState();
  const job = jobOf(s.profile.trade, e.jobType);
  const fit = fitLabel(e.fit.score);
  const answer = (id: string) => {
    const q = job.questions.find((x) => x.id === id)!;
    const v = e.answers[id];
    if (q.type === 'boolean') return v ? 'Yes' : 'No';
    if (q.type === 'select') return q.options?.find((o) => o.value === v)?.label ?? String(v);
    return `${v}${q.unit ? ' ' + q.unit : ''}`;
  };
  const timing = { asap: 'As soon as possible', month: 'Next month or two', flexible: 'Flexible', browsing: 'Just getting prices' }[e.timing];
  const other = { none: 'No', one: 'One other', several: 'Several', unsure: 'Not sure' }[e.otherQuotes];
  return (
    <>
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-ink-3">Fit score</p>
          <Badge tone={fit.tone}>{fit.label}</Badge>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <p className="text-[24px] font-semibold tabular-nums">{e.fit.score}</p>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div className={clsx('h-full rounded-full', fit.tone === 'good' ? 'bg-good' : fit.tone === 'mid' ? 'bg-mid' : 'bg-bad')} style={{ width: `${e.fit.score}%` }} />
          </div>
        </div>
        <ul className="mt-2 space-y-1">
          {e.fit.reasons.map((r) => (
            <li key={r.text} className="flex items-start gap-1.5 text-[12.5px]">
              {r.good ? <Check className="mt-0.5 size-3.5 shrink-0 text-good" /> : <X className="mt-0.5 size-3.5 shrink-0 text-bad" />}
              {r.text}
            </li>
          ))}
        </ul>
      </Card>
      <Card className="p-3">
        <p className="text-[12px] text-ink-3">The job</p>
        <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13px]">
          {job.questions.map((q) => (
            <Fact key={q.id} k={q.label} v={answer(q.id)} />
          ))}
          <Fact k="When" v={timing} />
          <Fact k="Budget" v={e.budget ? aud(e.budget) : 'Not given'} />
          <Fact k="Other quotes" v={other} />
          <Fact k="Distance" v={`${e.km} km`} />
        </dl>
        {e.notes && <p className="mt-2 rounded-lg bg-surface-2 p-2 text-[12.5px] text-ink-2">“{e.notes}”</p>}
        <div className="mt-2 flex gap-1.5">
          {e.photos ? (
            Array.from({ length: Math.min(e.photos, 4) }, (_, i) => (
              <div key={i} className="grid size-14 place-items-center rounded-lg bg-surface-2 text-ink-3" aria-label={`Photo ${i + 1}`}>
                <Image className="size-5" />
              </div>
            ))
          ) : (
            <p className="text-[12.5px] text-ink-3">No photos sent.</p>
          )}
        </div>
      </Card>
    </>
  );
}

const Fact = ({ k, v }: { k: string; v: string }) => (
  <>
    <dt className="text-ink-3">{k}</dt>
    <dd className="font-medium">{v}</dd>
  </>
);

const ACTIONS: Record<Suggestion, { label: string; desc: string }> = {
  visit: { label: 'Offer a paid site visit', desc: 'Send the range and a booking link with a deposit.' },
  ballpark: { label: 'Send a ballpark', desc: 'Send the range first. They book a paid visit if it suits.' },
  decline: { label: 'Decline politely', desc: 'A kind no, without a drive or a phone call.' },
};

function ActionPanel({ e, onShowMessages }: { e: Enquiry; onShowMessages: () => void }) {
  const s = useAppState();
  if (e.status === 'new') return <NewActions e={e} onSent={onShowMessages} />;
  if (e.status === 'visit_booked') return <QuoteComposer e={e} onSent={onShowMessages} />;
  if (e.status === 'quoted') return <FollowUps e={e} />;
  const closed = e.status === 'won' || e.status === 'lost' || e.status === 'declined';
  return (
    <Card className="p-3">
      <p className="text-[13.5px] font-medium">
        {e.status === 'won' && `Won: ${aud(e.wonValue ?? 0)}${e.wonAfterFollowUp ? ', after a follow-up' : ''}.`}
        {e.status === 'lost' && 'Lost. The customer went another way.'}
        {e.status === 'declined' && 'Declined politely. No site visit needed.'}
        {(e.status === 'ballpark' || e.status === 'visit_offered') && `Waiting for ${e.name.split(' ')[0]} to book a ${aud(s.profile.siteVisitFee)} site visit.`}
      </p>
      <p className="mt-1 text-[12.5px] text-ink-2">
        {closed ? 'Nothing more to do here.' : 'When they pay the deposit, it moves to “Needs you” so you can quote after the visit.'}
      </p>
      <Button size="sm" className="mt-2" onClick={onShowMessages}>
        See messages
      </Button>
    </Card>
  );
}

function NewActions({ e, onSent }: { e: Enquiry; onSent: () => void }) {
  const suggestion = suggestAction(e.fit.score);
  const [choice, setChoice] = useState<Suggestion | null>(null);
  const [text, setText] = useState('');
  const pick = (a: Suggestion) => {
    setChoice(a);
    setText(draftFor(e, a));
  };
  return (
    <Card className="p-3">
      <p className="flex items-center gap-1.5 text-[12px] text-ink-3">
        <Sparkles className="size-3.5 text-accent" /> Price range from your rates
      </p>
      <p className="text-[24px] font-semibold tabular-nums">{range(e.estimate)}</p>
      {!choice ? (
        <div className="mt-3 space-y-2">
          {(['visit', 'ballpark', 'decline'] as const).map((a) => (
            <button
              key={a}
              onClick={() => pick(a)}
              className={clsx('w-full rounded-lg border p-3 text-left hover:bg-surface-2', a === suggestion ? 'border-accent bg-accent-soft/50' : 'border-line')}
            >
              <span className="flex items-center gap-2 text-[13.5px] font-semibold">
                {ACTIONS[a].label}
                {a === suggestion && <Badge tone="accent">Suggested</Badge>}
              </span>
              <span className="block text-[12.5px] text-ink-2">{ACTIONS[a].desc}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <p className="text-[12.5px] font-medium">{ACTIONS[choice].label}: draft written for you. Edit anything, then send.</p>
          <textarea className={clsx(inputCls, 'min-h-[180px] text-[13px]')} value={text} onChange={(ev) => setText(ev.target.value)} />
          <div className="flex gap-2">
            <Button variant="primary" className="flex-1" onClick={() => (respond(e.id, choice, text), onSent())}>
              Send text
            </Button>
            <Button variant="ghost" onClick={() => setChoice(null)}>
              Back
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function QuoteComposer({ e, onSent }: { e: Enquiry; onSent: () => void }) {
  const s = useAppState();
  const start = Math.round(((e.estimate.low + e.estimate.high) / 2 - s.profile.siteVisitFee) / 10) * 10;
  const [amount, setAmount] = useState(start);
  const [text, setText] = useState(() => draftQuote(e, start));
  const [edited, setEdited] = useState(false);
  const changeAmount = (v: number) => {
    setAmount(v);
    if (!edited) setText(draftQuote(e, v));
  };
  return (
    <Card className="p-3">
      <p className="text-[13.5px] font-semibold">Visit done? Send the exact quote</p>
      <p className="mt-0.5 text-[12.5px] text-ink-2">
        Deposit of {aud(s.profile.siteVisitFee)} paid. Ballpark was {range(e.estimate)}. Follow-ups start automatically once it's sent.
      </p>
      <Field label="Quote amount (inc. GST)">
        <input className={clsx(inputCls, 'mt-1')} inputMode="numeric" value={amount} onChange={(ev) => changeAmount(Number(ev.target.value.replace(/\D/g, '')) || 0)} />
      </Field>
      <textarea
        className={clsx(inputCls, 'mt-2 min-h-[150px] text-[13px]')}
        value={text}
        onChange={(ev) => (setText(ev.target.value), setEdited(true))}
        aria-label="Quote message"
      />
      <Button variant="primary" className="mt-2 w-full" disabled={amount <= 0} onClick={() => (sendQuote(e.id, amount, text), onSent())}>
        Send quote
      </Button>
    </Card>
  );
}

function FollowUps({ e }: { e: Enquiry }) {
  const s = useAppState();
  const rise = priceRise(e, s.materialIndex);
  return (
    <>
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-ink-3">Quote sent day {e.quote!.sentDay}</p>
          <p className="text-[18px] font-semibold tabular-nums">{aud(e.quote!.amount)}</p>
        </div>
        {rise >= 0.03 && (
          <div className="mt-2 rounded-lg bg-mid-soft p-2.5">
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-mid">
              <TrendingUp className="size-4" /> Supplier prices are up {Math.round(rise * 100)}% since you quoted
            </p>
            <p className="mt-0.5 text-[12px] text-ink-2">Update the quote before it's accepted, so the job doesn't eat your margin.</p>
            <Button size="sm" className="mt-2" onClick={() => reprice(e.id)}>
              Update to {aud(Math.round((e.quote!.amount * (1 + rise)) / 10) * 10)} and tell them
            </Button>
          </div>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button size="sm" variant="secondary" onClick={() => markOutcome(e.id, 'won')}>
            <Check className="size-4" /> They said yes
          </Button>
          <Button size="sm" variant="ghost" onClick={() => markOutcome(e.id, 'lost')}>
            They went elsewhere
          </Button>
        </div>
      </Card>
      {e.followUps.map((f) => (
        <FollowUpCard key={f.n} e={e} n={f.n} />
      ))}
    </>
  );
}

function FollowUpCard({ e, n }: { e: Enquiry; n: 1 | 2 | 3 }) {
  const f = e.followUps.find((x) => x.n === n)!;
  const [text, setText] = useState(f.text);
  const state = { scheduled: 'Scheduled', awaiting: 'Waiting for you', sent: 'Sent', cancelled: 'Not needed' }[f.status];
  return (
    <Card className={clsx('p-3', f.status === 'awaiting' && 'border-accent')}>
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[13px] font-semibold">
          <Clock className="size-3.5 text-ink-3" /> Follow-up {n} · day {f.dueDay}
        </p>
        <Badge tone={f.status === 'sent' ? 'good' : f.status === 'awaiting' ? 'accent' : 'neutral'}>{state}</Badge>
      </div>
      {f.status === 'awaiting' ? (
        <>
          <textarea className={clsx(inputCls, 'mt-2 min-h-[90px] text-[13px]')} value={text} onChange={(ev) => setText(ev.target.value)} aria-label={`Follow-up ${n}`} />
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="primary" onClick={() => approveFollowUp(e.id, n, text)}>
              Approve and send
            </Button>
            <Button size="sm" variant="ghost" onClick={() => skipFollowUp(e.id, n)}>
              Skip
            </Button>
          </div>
        </>
      ) : (
        <p className={clsx('mt-1.5 text-[12.5px] leading-snug', f.status === 'cancelled' ? 'text-ink-3 line-through' : 'text-ink-2')}>{f.text}</p>
      )}
    </Card>
  );
}
