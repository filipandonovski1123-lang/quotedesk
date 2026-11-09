import clsx from 'clsx';
import { Camera, CheckCircle2, Loader2, Send, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Button, Field, inputCls } from '../components/ui';
import type { Answers, OtherQuotes, Timing } from '../lib/types';
import { loadPage, submitEnquiry } from './api';
import type { PublicPage } from './model';
import { compressPhoto } from './photos';

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

/** The public page a tradie shares: customers describe the job, add photos, and send it. No account needed. */
export default function EnquiryPage({ slug }: { slug: string }) {
  const [page, setPage] = useState<PublicPage | null | 'loading'>('loading');
  useEffect(() => {
    loadPage(slug)
      .then(setPage)
      .catch(() => setPage(null));
  }, [slug]);

  if (page === 'loading')
    return (
      <Shell>
        <p className="flex items-center gap-2 text-ink-2">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </p>
      </Shell>
    );
  if (!page)
    return (
      <Shell>
        <h1 className="text-[20px] font-semibold">This link isn’t working</h1>
        <p className="mt-2 text-ink-2">The business may have changed its link. Check with them for the right one.</p>
      </Shell>
    );
  return <Form page={page} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-10">
      {children}
      <p className="mt-12 text-center text-[12px] text-ink-3">
        Powered by{' '}
        <a href="#/" className="font-medium text-ink-2 hover:underline">
          QuoteDesk
        </a>{' '}
        ·{' '}
        <a href="#/privacy" className="hover:underline">
          Privacy
        </a>
      </p>
    </main>
  );
}

function Form({ page }: { page: PublicPage }) {
  const first = page.jobs[0];
  const [jobType, setJobType] = useState(first?.id ?? 'general');
  const job = page.jobs.find((j) => j.id === jobType) ?? first;
  const defaults = (id: string): Answers => Object.fromEntries((page.jobs.find((j) => j.id === id)?.questions ?? []).map((q) => [q.id, q.default]));
  const [answers, setAnswers] = useState<Answers>(() => defaults(jobType));
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [postcode, setPostcode] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [busyPhotos, setBusyPhotos] = useState(false);
  const [timing, setTiming] = useState<Timing | ''>('');
  const [budget, setBudget] = useState('');
  const [other, setOther] = useState<OtherQuotes | ''>('');
  const [notes, setNotes] = useState('');
  const [trap, setTrap] = useState('');
  const [state, setState] = useState<'form' | 'sending' | 'sent'>('form');
  const [error, setError] = useState<string | null>(null);

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusyPhotos(true);
    setError(null);
    try {
      const room = 4 - photos.length;
      const done = await Promise.all(Array.from(files).slice(0, room).map((f) => compressPhoto(f)));
      setPhotos((p) => [...p, ...done].slice(0, 4));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t add that photo.');
    } finally {
      setBusyPhotos(false);
    }
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (trap) return setState('sent'); // a bot filled the hidden field
    if (!/^\d{4}$/.test(postcode.trim())) return setError('Enter a 4-digit postcode.');
    if (phone.replace(/\D/g, '').length < 8) return setError('Enter a mobile number so they can text you back.');
    setError(null);
    setState('sending');
    try {
      await submitEnquiry(
        page.uid,
        {
          name: name.trim().slice(0, 80),
          phone: phone.trim().slice(0, 20),
          postcode: postcode.trim(),
          jobType: job?.id ?? 'general',
          jobLabel: job?.label ?? 'General job',
          answers,
          photoCount: photos.length,
          timing: timing || 'flexible',
          budget: budget ? Math.min(10_000_000, Number(budget.replace(/[^0-9.]/g, '')) || 0) || null : null,
          otherQuotes: other || 'unsure',
          notes: notes.trim().slice(0, 1000),
        },
        photos,
      );
      setState('sent');
    } catch {
      setState('form');
      setError('That didn’t send. Check your connection and try again.');
    }
  };

  if (state === 'sent')
    return (
      <Shell>
        <CheckCircle2 className="size-10 text-good" />
        <h1 className="mt-3 text-[22px] font-semibold">Sent to {page.business}</h1>
        <p className="mt-2 leading-relaxed text-ink-2">
          Thanks{name ? `, ${name.trim().split(/\s+/)[0]}` : ''}. {page.owner} will text you at {phone || 'your number'}, usually within a day, with a price guide or a time to come and look.
        </p>
      </Shell>
    );

  return (
    <Shell>
      <p className="text-[13px] font-medium text-accent">{page.business}</p>
      <h1 className="mt-1 text-[24px] leading-tight font-semibold">Get a price for your job</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-2">A few quick questions and some photos, so {page.owner} can give you a price guide without waiting for a site visit.</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {page.jobs.length > 1 && (
          <Field label="What do you need?">
            <select
              className={inputCls}
              value={jobType}
              onChange={(e) => {
                setJobType(e.target.value);
                setAnswers(defaults(e.target.value));
              }}
            >
              {page.jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.label}
                </option>
              ))}
            </select>
          </Field>
        )}

        {job?.questions.map((q) => (
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
                {q.options?.map((o) => (
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
                    aria-pressed={answers[q.id] === v}
                    onClick={() => setAnswers({ ...answers, [q.id]: v })}
                    className={clsx('h-10 flex-1 rounded-lg border text-[14px] font-medium', answers[q.id] === v ? 'border-navy bg-navy text-white' : 'border-line bg-surface')}
                  >
                    {v ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            )}
          </Field>
        ))}

        <Field label="Photos (up to 4)" hint="Photos of the area and access make the price guide much more accurate.">
          <div className="flex flex-wrap items-center gap-2">
            {photos.map((src, i) => (
              <div key={i} className="relative">
                <img src={src} alt={`Photo ${i + 1}`} className="size-16 rounded-lg object-cover" />
                <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => setPhotos(photos.filter((_, j) => j !== i))} className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-ink text-white">
                  <X className="size-3" />
                </button>
              </div>
            ))}
            {photos.length < 4 && (
              <label className="inline-flex h-16 cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-line px-4 text-[13px] font-medium hover:bg-surface-2">
                {busyPhotos ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />} Add photos
                <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => void addPhotos(e.target.files)} />
              </label>
            )}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Postcode">
            <input className={inputCls} inputMode="numeric" maxLength={4} value={postcode} onChange={(e) => setPostcode(e.target.value.replace(/\D/g, ''))} required autoComplete="postal-code" />
          </Field>
          <Field label="When?">
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
        </div>

        <Field label="Rough budget (optional)" hint="Helps suggest the right options. Leave blank if you’re not sure.">
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

        <Field label="Anything else?">
          <textarea className={clsx(inputCls, 'min-h-[80px]')} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Access, deadlines, what you have in mind…" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Your name">
            <input className={inputCls} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
          </Field>
          <Field label="Mobile">
            <input className={inputCls} maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} required inputMode="tel" autoComplete="tel" />
          </Field>
        </div>

        <input tabIndex={-1} aria-hidden="true" autoComplete="off" className="hidden" value={trap} onChange={(e) => setTrap(e.target.value)} name="company_website" />

        {error && (
          <p role="alert" className="text-[13px] text-bad">
            {error}
          </p>
        )}
        <Button type="submit" variant="accent" className="h-12 w-full text-[15px]" disabled={state === 'sending' || busyPhotos}>
          {state === 'sending' ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send to {page.owner}
        </Button>
        <p className="text-center text-[12px] leading-relaxed text-ink-3">
          {page.business} will contact you by text about this job only. Your details go to them and aren’t sold or shared.
        </p>
      </form>
    </Shell>
  );
}
