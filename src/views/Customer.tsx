import clsx from 'clsx';
import { Camera, CreditCard, Lock, Plus, Send, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Badge, Button, Field, inputCls } from '../components/ui';
import { aud, defaultAnswers, jobOf, SUBURBS, TRADES } from '../lib/pricing';
import { acceptQuote, customerSays, payDeposit, setCustomerEnquiry, submitEnquiry, useAppState } from '../lib/store';
import type { Answers, Enquiry, EnquiryInput, OtherQuotes, Timing } from '../lib/types';
import { Thread } from './Thread';

export function CustomerPhone() {
  const s = useAppState();
  const current = s.enquiries.find((e) => e.id === s.customerEnquiryId) ?? null;
  return (
    <>
      <header className="flex items-center gap-2 border-b border-line bg-surface px-4 py-3">
        <div className="grid size-9 place-items-center rounded-full bg-navy text-[13px] font-semibold text-white">{s.profile.business.slice(0, 1)}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold">{s.profile.business}</p>
          <p className="truncate text-[12px] text-ink-3">{current ? 'Text messages' : `quotedesk.app/${slug(s.profile.business)}`}</p>
        </div>
        {current && (
          <Button size="sm" variant="ghost" onClick={() => setCustomerEnquiry(null)} aria-label="Start a new enquiry">
            <Plus className="size-4" /> New
          </Button>
        )}
      </header>
      {current ? <CustomerThread e={current} /> : <EnquiryForm />}
    </>
  );
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const TIMINGS: { value: Timing; label: string }[] = [
  { value: 'asap', label: 'As soon as possible' },
  { value: 'month', label: 'In the next month or two' },
  { value: 'flexible', label: 'Flexible' },
  { value: 'browsing', label: 'Just getting prices for now' },
];
const OTHER: { value: OtherQuotes; label: string }[] = [
  { value: 'none', label: 'No, just you' },
  { value: 'one', label: 'One other' },
  { value: 'several', label: 'Several' },
  { value: 'unsure', label: 'Not sure yet' },
];

function EnquiryForm() {
  const s = useAppState();
  const trade = TRADES[s.profile.trade];
  const [jobType, setJobType] = useState(trade.jobs[0]!.id);
  const job = jobOf(s.profile.trade, jobType);
  const [answers, setAnswers] = useState<Answers>(() => defaultAnswers(job));
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [suburb, setSuburb] = useState('');
  const [photos, setPhotos] = useState(0);
  const [timing, setTiming] = useState<Timing | ''>('');
  const [budget, setBudget] = useState('');
  const [other, setOther] = useState<OtherQuotes | ''>('');
  const [notes, setNotes] = useState('');

  const pickJob = (id: string) => {
    setJobType(id);
    setAnswers(defaultAnswers(jobOf(s.profile.trade, id)));
  };

  const fillExample = () => {
    setName('Alex Chen');
    setPhone('0418 555 302');
    setSuburb('Epping');
    setPhotos(3);
    setTiming('month');
    setBudget('');
    setOther('one');
    setNotes('Back of the house, slight slope. Photos show the area and access from the driveway.');
  };

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    const input: EnquiryInput = {
      name: name.trim(),
      phone: phone.trim(),
      suburb,
      jobType,
      answers,
      photos,
      timing: timing || 'flexible',
      budget: budget ? Number(budget.replace(/[^0-9.]/g, '')) || null : null,
      otherQuotes: other || 'unsure',
      notes: notes.trim(),
    };
    submitEnquiry(input);
  };

  return (
    <form onSubmit={submit} className="scroll-thin flex-1 space-y-4 overflow-y-auto px-4 py-4">
      <div>
        <h2 className="text-[18px] font-semibold">Get a price for your job</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
          A few quick questions so {s.profile.owner} can give you a price range today, without waiting for a site visit.
        </p>
        <button type="button" onClick={fillExample} className="mt-2 text-[12.5px] font-medium text-accent hover:underline">
          Demo: fill with an example customer
        </button>
      </div>

      <Field label="What do you need?">
        <select className={inputCls} value={jobType} onChange={(e) => pickJob(e.target.value)}>
          {trade.jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.label}
            </option>
          ))}
        </select>
      </Field>

      {job.questions.map((q) => (
        <Field key={q.id} label={q.label + (q.unit ? ` (${q.unit})` : '')}>
          {q.type === 'number' ? (
            <input
              type="number"
              inputMode="numeric"
              min={q.min}
              max={q.max}
              className={inputCls}
              value={String(answers[q.id] ?? '')}
              onChange={(e) => setAnswers({ ...answers, [q.id]: Number(e.target.value) })}
              required
            />
          ) : q.type === 'select' ? (
            <select className={inputCls} value={String(answers[q.id])} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}>
              {q.options!.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex gap-2">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => setAnswers({ ...answers, [q.id]: v })}
                  className={clsx('h-9 flex-1 rounded-lg border text-[13px] font-medium', answers[q.id] === v ? 'border-navy bg-navy text-white' : 'border-line bg-surface')}
                >
                  {v ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          )}
        </Field>
      ))}

      <Field label="Photos" hint="Photos are the best way to get an accurate range.">
        <div className="flex items-center gap-2">
          <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] font-medium hover:bg-surface-2">
            <Camera className="size-4" /> Add photos
            <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => setPhotos(photos + (e.target.files?.length ?? 0))} />
          </label>
          <span className="text-[13px] text-ink-2">{photos ? `${photos} added` : 'None yet'}</span>
          {photos > 0 && (
            <button type="button" className="text-[12px] text-ink-3 hover:underline" onClick={() => setPhotos(0)}>
              Clear
            </button>
          )}
        </div>
      </Field>

      <Field label="Your suburb">
        <select className={inputCls} value={suburb} onChange={(e) => setSuburb(e.target.value)} required>
          <option value="" disabled>
            Choose…
          </option>
          {SUBURBS.map((x) => (
            <option key={x.name}>{x.name}</option>
          ))}
        </select>
      </Field>

      <Field label="When would you like it done?">
        <select className={inputCls} value={timing} onChange={(e) => setTiming(e.target.value as Timing)} required>
          <option value="" disabled>
            Choose…
          </option>
          {TIMINGS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Rough budget (optional)" hint="Helps us suggest the right options. Leave blank if you're not sure.">
        <input className={inputCls} inputMode="numeric" placeholder="e.g. 15000" value={budget} onChange={(e) => setBudget(e.target.value)} />
      </Field>

      <Field label="Are you getting other quotes?">
        <select className={inputCls} value={other} onChange={(e) => setOther(e.target.value as OtherQuotes)} required>
          <option value="" disabled>
            Choose…
          </option>
          {OTHER.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Anything else we should know?">
        <textarea className={clsx(inputCls, 'min-h-[72px]')} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Access, deadlines, what you have in mind…" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Name">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
        </Field>
        <Field label="Mobile">
          <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} required inputMode="tel" autoComplete="tel" />
        </Field>
      </div>

      <Button type="submit" variant="accent" className="w-full">
        <Send className="size-4" /> Send my details
      </Button>
      <p className="pb-2 text-center text-[11.5px] text-ink-3">Replies come by text. Reply STOP any time.</p>
    </form>
  );
}

function CustomerThread({ e }: { e: Enquiry }) {
  const s = useAppState();
  const [paying, setPaying] = useState(false);
  const fee = s.profile.siteVisitFee;
  const owner = s.profile.owner;

  return (
    <>
      <Thread e={e} side="customer" />
      <div className="border-t border-line bg-surface p-3">
        {e.status === 'new' && <p className="text-center text-[13px] text-ink-2">Waiting for {owner} to reply…</p>}
        {(e.status === 'ballpark' || e.status === 'visit_offered') && (
          <div className="space-y-2">
            <Button variant="accent" className="w-full" onClick={() => setPaying(true)}>
              <CreditCard className="size-4" /> Book a site visit · {aud(fee)} deposit
            </Button>
            <Button variant="ghost" size="sm" className="w-full" onClick={() => customerSays(e.id, 'Thanks for the guide, but that’s more than we want to spend.', 'lost')}>
              That's over my budget
            </Button>
          </div>
        )}
        {e.status === 'visit_booked' && <p className="text-center text-[13px] text-ink-2">Site visit booked. Your exact quote will arrive here after the visit.</p>}
        {e.status === 'quoted' && e.quote && (
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
              <span className="text-[13px] text-ink-2">Your quote</span>
              <span className="text-[17px] font-semibold tabular-nums">{aud(e.quote.amount)}</span>
            </div>
            <Button variant="accent" className="w-full" onClick={() => acceptQuote(e.id)}>
              Accept quote
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" onClick={() => customerSays(e.id, 'Still thinking about it, will let you know.')}>
                Still deciding
              </Button>
              <Button size="sm" variant="ghost" onClick={() => customerSays(e.id, 'Thanks, but we’ve gone with someone else.', 'lost')}>
                Went elsewhere
              </Button>
            </div>
          </div>
        )}
        {(e.status === 'won' || e.status === 'lost' || e.status === 'declined') && (
          <p className="text-center text-[13px] text-ink-2">
            {e.status === 'won' ? 'Booked in. ' : 'This enquiry is closed. '}
            <button className="font-medium text-accent hover:underline" onClick={() => setCustomerEnquiry(null)}>
              Start another enquiry
            </button>
          </p>
        )}
      </div>
      {paying && <PaySheet fee={fee} business={s.profile.business} onClose={() => setPaying(false)} onPay={() => (payDeposit(e.id), setPaying(false))} />}
    </>
  );
}

function PaySheet({ fee, business, onClose, onPay }: { fee: number; business: string; onClose: () => void; onPay: () => void }) {
  return (
    <div className="absolute inset-0 z-10 flex items-end bg-ink/40" role="dialog" aria-modal="true" aria-label="Pay deposit">
      <div className="pop w-full rounded-t-2xl bg-surface p-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold">Book your site visit</p>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 text-ink-3 hover:bg-surface-2">
            <X className="size-4" />
          </button>
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
          {aud(fee)} deposit to {business}. It comes off your final bill if you go ahead with the job.
        </p>
        <div className="mt-3 rounded-lg border border-dashed border-line p-3 text-[13px] text-ink-2">
          <Badge tone="accent">Demo</Badge> No real card is charged. The real product would use Stripe here.
        </div>
        <Button variant="primary" className="mt-3 w-full" onClick={onPay}>
          <Lock className="size-4" /> Pay {aud(fee)} and pick a time
        </Button>
      </div>
    </div>
  );
}
