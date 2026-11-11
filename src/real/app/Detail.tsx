import clsx from 'clsx';
import { ArrowLeft, CalendarDays, Check, Clock, ExternalLink, FileText, MapPin, MessageSquare, Phone, Trash2, X } from 'lucide-react';
import { PriceFit } from '../../components/worksite';
import { useEffect, useState, type ReactNode } from 'react';
import { Badge, Button, Card, Field, inputCls } from '../../components/ui';
import { aud, fitLabel, jobOf, range, suggestAction, type Suggestion } from '../../lib/pricing';
import { deleteEnquiry, loadPhotos, newToken, publishQuote, updateEnquiry } from '../api';
import { ago, DAY, draft, estimateOf, firstName, fitOf, followUpDraft, quoteDraft, quoteUrl, scheduleFollowUps, smsHref, when } from '../logic';
import type { LogEntry, RealEnquiry, RealStatus } from '../model';
import { useApp } from './ctx';
import { SendBox } from './SendBox';

export const STATUS: Record<RealStatus, { label: string; tone: 'good' | 'mid' | 'bad' | 'neutral' | 'accent' | 'navy' }> = {
  new: { label: 'New', tone: 'accent' },
  ballpark: { label: 'Ballpark sent', tone: 'neutral' },
  visit_offered: { label: 'Visit offered', tone: 'neutral' },
  visit_booked: { label: 'Visit booked · quote due', tone: 'accent' },
  quoted: { label: 'Quoted', tone: 'navy' },
  won: { label: 'Won', tone: 'good' },
  lost: { label: 'Lost', tone: 'bad' },
  declined: { label: 'Declined', tone: 'neutral' },
};

const log = (e: RealEnquiry, kind: LogEntry['kind'], text: string): LogEntry[] => [...(e.log ?? []), { at: Date.now(), kind, text }];

export function Detail({ e, onBack }: { e: RealEnquiry; onBack: () => void }) {
  const { user } = useApp();
  useEffect(() => {
    if (!e.seenAt) void updateEnquiry(user.uid, e.id, { seenAt: Date.now() }).catch(() => undefined);
  }, [e.id, e.seenAt, user.uid]);

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="sticky top-0 z-10 flex items-center gap-1 bg-navy px-1.5 py-2.5 text-white">
        <button onClick={onBack} aria-label="Back" className="grid size-12 place-items-center rounded-xl hover:bg-white/10">
          <ArrowLeft className="size-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[24px] leading-tight font-bold">{e.name}</p>
          <p className="truncate text-[12.5px] text-white/75">
            Enquiry · {ago(e.createdMs)}
          </p>
        </div>
        <a href={smsHref(e.phone, `Hi ${firstName(e.name)}, `)} className="grid size-12 place-items-center rounded-xl hover:bg-white/10" aria-label={`Text ${e.name}`}>
          <MessageSquare className="size-5" />
        </a>
        <a href={`tel:${e.phone.replace(/[^\d+]/g, '')}`} className="grid size-12 place-items-center rounded-xl hover:bg-white/10" aria-label={`Call ${e.name}`}>
          <Phone className="size-5" />
        </a>
      </header>
      <Photos e={e} />
      <div className="flex-1 space-y-3 p-3 pb-10 md:p-5">
        <Summary e={e} />
        <Actions e={e} />
        <Facts e={e} />
        <History e={e} />
        <button
          className="flex items-center gap-1.5 px-1 text-[12.5px] text-bad hover:underline"
          onClick={() => {
            if (!confirm(`Delete ${e.name}'s enquiry, photos and quote for good? This can't be undone.`)) return;
            onBack();
            void deleteEnquiry(user.uid, e.id, e.quote?.token).catch(() => alert('Couldn’t delete it. Check your connection and try again.'));
          }}
        >
          <Trash2 className="size-3.5" /> Delete this enquiry
        </button>
      </div>
    </div>
  );
}

const ACTIONS: Record<Suggestion, { short: string; label: string; desc: string; status: RealStatus; kind: LogEntry['kind'] }> = {
  visit: { short: 'offer a visit', label: 'Offer a paid site visit', desc: 'Send the price guide and how to book a measure-up.', status: 'visit_offered', kind: 'visit' },
  ballpark: { short: 'send a ballpark', label: 'Send a ballpark', desc: 'Send the price guide first. They book a visit if it suits.', status: 'ballpark', kind: 'ballpark' },
  decline: { short: 'decline politely', label: 'Decline politely', desc: 'A kind no, without a drive or a phone call.', status: 'declined', kind: 'decline' },
};

function Actions({ e }: { e: RealEnquiry }) {
  const { user, profile } = useApp();
  const save = (patch: Partial<RealEnquiry>) => updateEnquiry(user.uid, e.id, patch);

  if (e.status === 'new') return <NewActions e={e} />;

  if (e.status === 'ballpark' || e.status === 'visit_offered')
    return (
      <Card className="p-3">
        <p className="text-[14px] font-semibold">Waiting for {firstName(e.name)} to book a visit</p>
        <p className="mt-0.5 text-[12.5px] text-ink-2">Their reply comes to your phone. When they’ve booked{profile.visitFee ? ' and paid' : ''}, tap below so you can quote after the visit.</p>
        <div className="mt-3 grid gap-2">
          <Button variant="primary" onClick={() => void save({ status: 'visit_booked', depositPaid: profile.visitFee > 0, log: log(e, 'status', profile.visitFee ? `Visit booked, ${aud(profile.visitFee)} paid` : 'Visit booked') })}>
            <Check className="size-4" /> They booked{profile.visitFee ? ` and paid ${aud(profile.visitFee)}` : ' a visit'}
          </Button>
          <Button variant="ghost" onClick={() => void save({ status: 'lost', closedAt: Date.now(), log: log(e, 'status', 'Not going ahead') })}>
            They’re not going ahead
          </Button>
        </div>
      </Card>
    );

  if (e.status === 'visit_booked') return <QuoteComposer e={e} />;
  if (e.status === 'quoted') return <QuoteOut e={e} />;

  return (
    <Card className="p-3">
      <p className="text-[14px] font-medium">
        {e.status === 'won' && `Won${e.wonValue ? `: ${aud(e.wonValue)}` : ''}${e.wonAfterFollowUp ? ', after a follow-up.' : '.'}`}
        {e.status === 'lost' && 'Lost. They went another way.'}
        {e.status === 'declined' && 'Declined politely. No site visit needed.'}
      </p>
      <Button size="sm" variant="ghost" className="mt-2" onClick={() => void save({ status: e.quote ? 'quoted' : 'new', log: log(e, 'status', 'Reopened') })}>
        Reopen
      </Button>
    </Card>
  );
}

function NewActions({ e }: { e: RealEnquiry }) {
  const { user, profile } = useApp();
  const fit = fitOf(profile, e);
  const est = estimateOf(profile, e);
  const suggestion = suggestAction(fit.score);
  const [choice, setChoice] = useState<Suggestion | null>(null);
  return (
    <Card className="p-3">
      <p className="font-display text-[22px] leading-tight font-bold">{choice ? ACTIONS[choice].label : 'Reply'}</p>
      {!est && !choice && <p className="mt-0.5 text-[12.5px] text-ink-3">Tip: set prices for “{e.jobLabel}” in Settings and every enquiry gets a price guide.</p>}
      {!choice ? (
        <div className="mt-3 space-y-2">
          <Button variant="accent" className="h-14 w-full text-[16px]" onClick={() => setChoice(suggestion)}>
            <MessageSquare className="size-5" /> Reply by text
          </Button>
          <p className="px-1 pb-1 text-[13px] text-ink-2"><strong className="text-ink">Suggested: {ACTIONS[suggestion].short}.</strong> {ACTIONS[suggestion].desc}</p>
          {(['visit', 'ballpark', 'decline'] as const)
            .filter((a) => a !== suggestion)
            .map((a) => (
              <Button key={a} className="w-full" onClick={() => setChoice(a)}>
                {ACTIONS[a].label}
              </Button>
            ))}
        </div>
      ) : (
        <div className="mt-3">
          <p className="mb-2 text-[13px] text-ink-2">Written in your voice. Change anything, then send.</p>
          <SendBox
            phone={e.phone}
            name={e.name}
            draft={draft(profile, e, choice)}
            onCancel={() => setChoice(null)}
            onSent={(text) =>
              updateEnquiry(user.uid, e.id, {
                status: ACTIONS[choice].status,
                ...(choice === 'decline' ? { closedAt: Date.now() } : {}),
                log: log(e, ACTIONS[choice].kind, text),
              })
            }
          />
        </div>
      )}
    </Card>
  );
}

function QuoteComposer({ e }: { e: RealEnquiry }) {
  const { user, profile } = useApp();
  const est = estimateOf(profile, e);
  const start = est ? Math.round(((est.low + est.high) / 2 - (e.depositPaid ? profile.visitFee : 0)) / 10) * 10 : 0;
  const [amount, setAmount] = useState(start ? String(start) : '');
  const [notes, setNotes] = useState('');
  const [token] = useState(newToken);
  const [ready, setReady] = useState(false);
  const value = Number(amount.replace(/\D/g, '')) || 0;

  const send = async (text: string) => {
    const now = Date.now();
    const validUntil = now + profile.quoteValidDays * DAY;
    await publishQuote(token, {
      uid: user.uid,
      enquiryId: e.id,
      business: profile.business,
      owner: profile.owner,
      phone: profile.phone,
      customerFirst: firstName(e.name),
      jobLabel: e.jobLabel,
      amount: value,
      validUntil,
      paymentLink: profile.paymentLink,
      notes: notes.trim().slice(0, 1500),
      abn: profile.abn?.trim() || undefined,
      licence: profile.licence?.trim() || undefined,
      status: 'open',
      createdAt: now,
    });
    await updateEnquiry(user.uid, e.id, {
      status: 'quoted',
      quote: { amount: value, sentAt: now, token, validUntil },
      followUps: scheduleFollowUps(profile, now),
      log: log(e, 'quote', text),
    });
  };

  return (
    <Card className="p-3">
      <p className="text-[14px] font-semibold">Visit done? Send the exact quote</p>
      <p className="mt-0.5 text-[12.5px] text-ink-2">
        {e.depositPaid && profile.visitFee ? `${aud(profile.visitFee)} visit fee paid. ` : ''}Price guide was {range(est)}. Follow-ups are scheduled automatically once it’s sent.
      </p>
      {!ready ? (
        <>
          <Field label="Quote amount, including GST ($)">
            <input className={clsx(inputCls, 'mt-1 text-[16px]')} inputMode="numeric" value={amount} onChange={(ev) => setAmount(ev.target.value)} />
          </Field>
          <Field label="What’s included (optional)" hint="Shown under the price on their quote page: scope, materials, exclusions, timing.">
            <textarea className={clsx(inputCls, 'mt-1 min-h-[90px] text-[13.5px]')} maxLength={1500} value={notes} onChange={(ev) => setNotes(ev.target.value)} placeholder="e.g. Supply and install large cat door in glass slider, includes new glass panel. Removal of old glass. 1 day." />
          </Field>
          <Button variant="primary" className="mt-2 w-full" disabled={value <= 0} onClick={() => setReady(true)}>
            Write the quote text
          </Button>
        </>
      ) : (
        <div className="mt-2">
          <p className="mb-2 text-[12.5px] text-ink-2">
            Quote of <strong>{aud(value)}</strong>. The link lets them accept it in one tap.
          </p>
          <SendBox phone={e.phone} name={e.name} draft={quoteDraft(profile, e, value, token)} onSent={send} onCancel={() => setReady(false)} label="Text quote to" />
        </div>
      )}
    </Card>
  );
}

function QuoteOut({ e }: { e: RealEnquiry }) {
  const { user, now, quotes } = useApp();
  const q = e.quote!;
  const pub = quotes.find((x) => x.token === q.token);
  const save = (patch: Partial<RealEnquiry>) => updateEnquiry(user.uid, e.id, patch);
  const close = (outcome: 'won' | 'lost') =>
    save({
      status: outcome,
      closedAt: Date.now(),
      wonValue: outcome === 'won' ? q.amount : undefined,
      wonAfterFollowUp: outcome === 'won' ? e.followUps.some((f) => f.status === 'sent') : undefined,
      followUps: e.followUps.map((f) => (f.status === 'scheduled' ? { ...f, status: 'cancelled' } : f)),
      log: log(e, 'status', outcome === 'won' ? 'Marked as won' : 'Marked as lost'),
    } as Partial<RealEnquiry>);

  return (
    <>
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-ink-3">Quote sent {when(q.sentAt, now)}</p>
          <p className="text-[20px] font-semibold tabular-nums">{aud(q.amount)}</p>
        </div>
        <p className="mt-1 text-[12.5px] text-ink-2">
          {now > q.validUntil ? 'Expired' : `Valid until ${new Date(q.validUntil).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}`}
          {pub?.status === 'declined' && ' · They said no on the quote page'}
        </p>
        <a href={quoteUrl(q.token)} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-medium text-navy hover:underline">
          View their quote page <ExternalLink className="size-3" />
        </a>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button size="sm" onClick={() => void close('won')}>
            <Check className="size-4" /> They said yes
          </Button>
          <Button size="sm" variant="ghost" onClick={() => void close('lost')}>
            <X className="size-4" /> Went elsewhere
          </Button>
        </div>
      </Card>
      {e.followUps.map((f) => (
        <FollowUpCard key={f.n} e={e} n={f.n} />
      ))}
    </>
  );
}

export function FollowUpCard({ e, n, compact }: { e: RealEnquiry; n: 1 | 2 | 3; compact?: boolean }) {
  const { user, profile, now } = useApp();
  const f = e.followUps.find((x) => x.n === n)!;
  const [open, setOpen] = useState(false);
  const due = f.status === 'scheduled' && f.dueAt <= now;
  const set = (status: 'sent' | 'skipped', text?: string) =>
    updateEnquiry(user.uid, e.id, {
      followUps: e.followUps.map((x) => (x.n === n ? { ...x, status, ...(status === 'sent' ? { sentAt: Date.now() } : {}) } : x)),
      ...(text ? { log: log(e, 'followup', text) } : {}),
    });
  const state = f.status === 'scheduled' ? (due ? 'Due now' : `Due ${when(f.dueAt, now)}`) : { sent: 'Sent', skipped: 'Skipped', cancelled: 'Not needed', scheduled: '' }[f.status];
  return (
    <Card className={clsx('p-3', due && 'border-accent')}>
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[13.5px] font-semibold">
          <Clock className="size-3.5 text-ink-3" /> {compact ? `${e.name} · follow-up ${n}` : `Follow-up ${n}`}
        </p>
        <Badge tone={f.status === 'sent' ? 'good' : due ? 'accent' : 'neutral'}>{state}</Badge>
      </div>
      {compact && <p className="mt-0.5 text-[12px] text-ink-3">{e.jobLabel} · quoted {aud(e.quote?.amount ?? 0)}</p>}
      {f.status === 'scheduled' &&
        (open || due ? (
          <div className="mt-2">
            <SendBox phone={e.phone} name={e.name} draft={followUpDraft(profile, e, n)} onSent={(t) => set('sent', t)} rows={4} label="Text" />
            <button className="mt-1 text-[12px] text-ink-3 hover:underline" onClick={() => void set('skipped')}>
              Skip this one
            </button>
          </div>
        ) : (
          <button className="mt-1 text-[12.5px] font-medium text-navy hover:underline" onClick={() => setOpen(true)}>
            Send it early
          </button>
        ))}
    </Card>
  );
}

/** The customer's photos, big and first: they're what a tradie looks at before anything else. */
function Photos({ e }: { e: RealEnquiry }) {
  const { user } = useApp();
  const [photos, setPhotos] = useState<string[] | null>(e.photoCount ? null : []);
  const [big, setBig] = useState<number | null>(null);
  useEffect(() => {
    if (e.photoCount) void loadPhotos(user.uid, e.id).then(setPhotos).catch(() => setPhotos([]));
  }, [e.id, e.photoCount, user.uid]);
  if (!e.photoCount) return null;
  const shown = (photos ?? Array.from({ length: e.photoCount }, () => '')).slice(0, 3);
  const more = e.photoCount - shown.length;
  return (
    <>
      <div className={clsx('grid gap-1.5 bg-surface p-2', shown.length === 1 ? 'grid-cols-1' : shown.length === 2 ? 'grid-cols-2' : 'grid-cols-[2fr_1fr_1fr]')} aria-label={`${e.photoCount} photos from ${e.name}`}>
        {shown.map((src, i) =>
          src ? (
            <button key={i} onClick={() => setBig(i)} aria-label={`Open photo ${i + 1}`} className="relative h-36 overflow-hidden rounded-xl md:h-60">
              <img src={src} alt={`Photo ${i + 1} from ${e.name}`} className="size-full object-cover" />
              {i === shown.length - 1 && more > 0 && <span className="absolute inset-0 grid place-items-center bg-ink/55 font-display text-[28px] font-bold text-white">+{more}</span>}
            </button>
          ) : (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-surface-2 md:h-60" />
          ),
        )}
      </div>
      {big !== null && photos && (
        <div className="fixed inset-0 z-50 flex flex-col bg-ink/95 p-3" role="dialog" aria-label="Photos">
          <button className="ml-auto grid size-12 place-items-center rounded-xl text-white hover:bg-white/10" onClick={() => setBig(null)} aria-label="Close photos">
            <X className="size-6" />
          </button>
          <div className="grid flex-1 place-items-center overflow-hidden">
            <img src={photos[big]} alt="" className="max-h-full max-w-full rounded-lg" />
          </div>
          {photos.length > 1 && (
            <div className="flex justify-center gap-2 pt-3">
              {photos.map((src, i) => (
                <button key={i} onClick={() => setBig(i)} aria-label={`Photo ${i + 1}`} className={clsx('size-14 overflow-hidden rounded-lg border-2', i === big ? 'border-white' : 'border-transparent opacity-60')}>
                  <img src={src} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

/** What it is, what it's worth, how good a lead it is: readable at a glance. */
function Summary({ e }: { e: RealEnquiry }) {
  const { profile } = useApp();
  const fit = fitOf(profile, e);
  const label = fitLabel(fit.score);
  const est = estimateOf(profile, e);
  const timing = { asap: 'ASAP', month: 'Next month or two', flexible: 'Flexible', browsing: 'Just getting prices' }[e.timing];
  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-start justify-between gap-2">
          <h2 className="min-w-0 font-display text-[30px] leading-[1.05] font-bold">{e.jobLabel}</h2>
          <Badge tone={STATUS[e.status].tone}>{STATUS[e.status].label}</Badge>
        </div>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-ink-2">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-4" /> {e.postcode}
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-4" /> {timing}
          </span>
          {!!e.budget && <span>Budget {aud(e.budget)}</span>}
        </p>
      </div>
      <PriceFit price={est ? range(est) : null} priceNote={est ? '(incl. GST) from your rates' : 'Add prices in Settings'} score={fit.score} scoreLabel={label.label} tone={label.tone === 'good' ? 'good' : label.tone === 'bad' ? 'bad' : 'mid'} />
      <Card className="rounded-2xl p-3.5">
        <p className="flex items-center gap-1.5 text-[14px] font-bold">
          <FileText className="size-4 text-ink-2" /> Job details
        </p>
        <p className="mt-1.5 text-[14.5px] leading-relaxed whitespace-pre-line text-ink">{e.notes?.trim() || `${e.jobLabel}. No description given.`}</p>
        {!!e.photoCount && (
          <p className="mt-1 text-[13px] text-ink-3">
            {e.photoCount} photo{e.photoCount === 1 ? '' : 's'} above.
          </p>
        )}
      </Card>
      <p className="px-1 text-[12px] text-ink-3">Only you see the price guide and fit score. Customers only ever see the quote you send.</p>
    </div>
  );
}

function Facts({ e }: { e: RealEnquiry }) {
  const { profile } = useApp();
  const job = jobOf(profile.trade, e.jobType, profile.customJobs);
  const fit = fitOf(profile, e);

  const answer = (id: string) => {
    const q = job.questions.find((x) => x.id === id);
    const v = e.answers?.[id];
    if (!q) return String(v ?? '');
    if (q.type === 'boolean') return v ? 'Yes' : 'No';
    if (q.type === 'select') return q.options?.find((o) => o.value === v)?.label ?? String(v);
    return `${v}${q.unit ? ' ' + q.unit : ''}`;
  };
  const timing = { asap: 'As soon as possible', month: 'Next month or two', flexible: 'Flexible', browsing: 'Just getting prices' }[e.timing];
  const other = { none: 'No', one: 'One other', several: 'Several', unsure: 'Not sure' }[e.otherQuotes];

  return (
    <>
      <Card className="p-3">
        <p className="text-[14px] font-bold">Why this fit score</p>
        <ul className="mt-2 space-y-1">
          {fit.reasons.map((r) => (
            <li key={r.text} className="flex items-start gap-1.5 text-[13px]">
              {r.neutral ? <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ink-3" /> : r.good ? <Check className="mt-0.5 size-3.5 shrink-0 text-good" /> : <X className="mt-0.5 size-3.5 shrink-0 text-bad" />}
              {r.text}
            </li>
          ))}
        </ul>
      </Card>
      <Card className="p-3">
        <p className="text-[14px] font-bold">All their answers</p>
        <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13.5px]">
          <Fact k="Job">{e.jobLabel}</Fact>
          {job.questions.map((q) => (
            <Fact key={q.id} k={q.label}>
              {answer(q.id)}
            </Fact>
          ))}
          <Fact k="When">{timing}</Fact>
          <Fact k="Budget">{e.budget ? aud(e.budget) : 'Not given'}</Fact>
          <Fact k="Other quotes">{other}</Fact>
          <Fact k="Postcode">{e.postcode}</Fact>
          <Fact k="Mobile">{e.phone}</Fact>
        </dl>
      </Card>
    </>
  );
}

const Fact = ({ k, children }: { k: string; children: ReactNode }) => (
  <>
    <dt className="text-ink-3">{k}</dt>
    <dd className="font-medium break-words">{children}</dd>
  </>
);

function History({ e }: { e: RealEnquiry }) {
  const items = [...(e.log ?? [])].reverse();
  if (!items.length) return null;
  return (
    <Card className="p-3">
      <p className="text-[12px] text-ink-3">History</p>
      <ol className="mt-2 space-y-2">
        {items.map((l, i) => (
          <li key={i} className="text-[13px]">
            <p className="text-[11.5px] text-ink-3">{new Date(l.at).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</p>
            <p className={clsx('whitespace-pre-line', l.kind === 'status' ? 'font-medium' : 'text-ink-2')}>{l.text}</p>
          </li>
        ))}
      </ol>
    </Card>
  );
}
