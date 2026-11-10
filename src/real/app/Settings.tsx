import clsx from 'clsx';
import { Bell, Copy, Download, LogOut, Plus, Share2, Trash2 } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Button, Card, Field, inputCls } from '../../components/ui';
import { TRADES, jobsFor, ratesFor, type CustomJob } from '../../lib/pricing';
import { authMessage, deleteEverything, exportEverything, saveProfile, signOut } from '../api';
import type { TradieProfile } from '../model';
import { enquiryLink, useApp } from './ctx';
import { disablePush, enablePush, pushState, type PushState } from '../push';

export function Settings() {
  const { user, profile } = useApp();
  const [p, setP] = useState<TradieProfile>(profile);
  // The saved version this form started from. If it changes elsewhere (another phone) and there are
  // no local edits, follow it instead of showing phantom "unsaved changes".
  const [base, setBase] = useState<TradieProfile>(profile);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const dirty = JSON.stringify(p) !== JSON.stringify(base);
  if (base !== profile && !dirty) {
    setBase(profile);
    setP(profile);
  }
  const set = (patch: Partial<TradieProfile>) => setP({ ...p, ...patch });

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await saveProfile(user.uid, p);
      setBase(p);
      setMsg('Saved.');
    } catch {
      setMsg('Couldn’t save. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 p-4 pb-28">
      <LinkCard profile={profile} />

      <Section title="Your business">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Your first name">
            <input className={inputCls} value={p.owner} maxLength={40} onChange={(e) => set({ owner: e.target.value })} />
          </Field>
          <Field label="Your mobile" hint="Shown on quote pages so customers can text you.">
            <input className={inputCls} value={p.phone} maxLength={20} inputMode="tel" onChange={(e) => set({ phone: e.target.value })} />
          </Field>
        </div>
        <Field label="Business name">
          <input className={inputCls} value={p.business} maxLength={60} onChange={(e) => set({ business: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ABN (optional)">
            <input className={inputCls} inputMode="numeric" maxLength={20} value={p.abn ?? ''} onChange={(e) => set({ abn: e.target.value })} />
          </Field>
          <Field label="Licence no. (optional)">
            <input className={inputCls} maxLength={30} value={p.licence ?? ''} onChange={(e) => set({ licence: e.target.value })} />
          </Field>
        </div>
        <p className="-mt-1 text-[12px] text-ink-3">Shown on your quotes so customers can see you’re a real, licensed business.</p>
        <p className="-mt-1 text-[12px] text-ink-3">Your enquiry link stays the same if you rename the business, so links you’ve already shared keep working.</p>
        <Field label="Trade" hint="Changes the built-in job types. Your own job types and any prices you’ve set are kept.">
          <select className={inputCls} value={p.trade} onChange={(e) => set({ trade: e.target.value as TradieProfile['trade'] })}>
            {Object.values(TRADES).map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Postcodes you cover" hint="e.g. 2070-2125, 2150. Leave blank to skip the area check.">
          <input className={inputCls} value={p.areas} onChange={(e) => set({ areas: e.target.value })} />
        </Field>
      </Section>

      <Section title="Site visits and payments">
        <Field label="Site visit fee ($)" hint="0 means free visits.">
          <input className={inputCls} inputMode="numeric" value={p.visitFee} onChange={(e) => set({ visitFee: Number(e.target.value.replace(/\D/g, '')) || 0 })} />
        </Field>
        <Field label="How customers pay you" hint="Paste a payment link (Stripe, Square, PayPal) or write your PayID or bank details. It goes into your visit and quote texts.">
          <input className={inputCls} value={p.paymentLink} maxLength={200} placeholder="https://buy.stripe.com/… or PayID: 0412 345 678" onChange={(e) => set({ paymentLink: e.target.value })} />
        </Field>
      </Section>

      <Section title="Messages and follow-ups">
        <Field label="Message style">
          <select className={inputCls} value={p.tone} onChange={(e) => set({ tone: e.target.value as TradieProfile['tone'] })}>
            <option value="casual">Casual (Hi Sarah, {p.owner || 'Dave'} here…)</option>
            <option value="professional">Professional (Hello Sarah, this is {p.owner || 'Dave'}…)</option>
          </select>
        </Field>
        <div className="grid grid-cols-4 gap-2">
          {([0, 1, 2] as const).map((i) => (
            <Field key={i} label={`Follow-up ${i + 1}`}>
              <input
                className={inputCls}
                inputMode="numeric"
                value={p.followUpDays[i]}
                onChange={(e) => {
                  const d = [...p.followUpDays] as TradieProfile['followUpDays'];
                  d[i] = Math.max(1, Math.min(60, Number(e.target.value.replace(/\D/g, '')) || 1));
                  set({ followUpDays: d });
                }}
              />
            </Field>
          ))}
          <Field label="Quote valid">
            <input className={inputCls} inputMode="numeric" value={p.quoteValidDays} onChange={(e) => set({ quoteValidDays: Math.max(1, Math.min(180, Number(e.target.value.replace(/\D/g, '')) || 30)) })} />
          </Field>
        </div>
        <p className="text-[12px] text-ink-3">Days after the quote is sent. Quote valid is in days too.</p>
      </Section>

      <Prices p={p} set={set} />

      <Alerts />

      <Section title="Your data">
        <p className="text-[13px] text-ink-2">Everything you and your customers enter is yours. Download it any time, or delete it all.</p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={async () => {
              const data = await exportEverything(user.uid);
              const a = document.createElement('a');
              a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
              a.download = `quotedesk-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
            }}
          >
            <Download className="size-4" /> Download my data
          </Button>
          <Button size="sm" variant="ghost" onClick={() => void signOut()}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
        <DeleteAccount />
        <p className="text-[12px] text-ink-3">
          <a href="#/privacy" className="underline">
            Privacy
          </a>{' '}
          ·{' '}
          <a href="#/terms" className="underline">
            Terms
          </a>{' '}
          · Signed in as {user.email}
        </p>
      </Section>

      {(dirty || msg) && (
        <div className="fixed inset-x-0 bottom-16 z-20 mx-auto flex max-w-lg items-center gap-2 border-t border-line bg-surface px-4 py-2.5 shadow-lg">
          <p className="flex-1 text-[13px] text-ink-2">{dirty ? 'You have unsaved changes.' : msg}</p>
          {dirty && (
            <>
              <Button size="sm" variant="ghost" onClick={() => setP(base)}>
                Undo
              </Button>
              <Button size="sm" variant="primary" disabled={saving || !p.owner.trim() || !p.business.trim()} onClick={() => void save()}>
                Save
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="space-y-3 p-4">
      <p className="text-[15px] font-semibold">{title}</p>
      {children}
    </Card>
  );
}

export function LinkCard({ profile }: { profile: TradieProfile }) {
  const url = enquiryLink(profile.slug);
  const [copied, setCopied] = useState<'link' | 'text' | null>(null);
  const missedCall = `Sorry I missed your call, I'm on a job. For the fastest price, send me the details and a few photos here: ${url} – ${profile.owner}, ${profile.business}`;
  const copy = (what: 'link' | 'text', s: string) =>
    void navigator.clipboard.writeText(s).then(
      () => (setCopied(what), setTimeout(() => setCopied(null), 1500)),
      () => undefined,
    );
  return (
    <Card className="border-navy bg-navy p-4 text-white">
      <p className="text-[12.5px] text-white/70">Your enquiry link</p>
      <p className="mt-0.5 font-mono text-[13px] break-all">{url}</p>
      <p className="mt-1.5 text-[12.5px] text-white/80">Put it on your website, Google profile, Facebook page and your missed-call text. Every enquiry arrives with photos, budget and timing.</p>
      <div className="mt-3 flex gap-2">
        <button className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-[13px] font-medium text-navy" onClick={() => copy('link', url)}>
          <Copy className="size-3.5" /> {copied === 'link' ? 'Copied' : 'Copy link'}
        </button>
        {'share' in navigator && (
          <button className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/30 px-3 text-[13px] font-medium" onClick={() => void navigator.share({ url, title: 'Get a price' }).catch(() => undefined)}>
            <Share2 className="size-3.5" /> Share
          </button>
        )}
        <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center rounded-lg border border-white/30 px-3 text-[13px] font-medium">
          Preview
        </a>
      </div>
      <div className="mt-4 rounded-lg bg-white/10 p-3">
        <p className="text-[12.5px] font-semibold">Missed-call text</p>
        <p className="mt-1 text-[12.5px] leading-snug text-white/85">{missedCall}</p>
        <button className="mt-2 inline-flex h-7 items-center gap-1.5 rounded-md bg-white px-2.5 text-[12.5px] font-medium text-navy" onClick={() => copy('text', missedCall)}>
          <Copy className="size-3.5" /> {copied === 'text' ? 'Copied' : 'Copy text'}
        </button>
        <p className="mt-1.5 text-[11.5px] text-white/65">Set it as your phone’s auto-reply for missed calls (most phones and business apps can do this).</p>
      </div>
    </Card>
  );
}

function Prices({ p, set }: { p: TradieProfile; set: (x: Partial<TradieProfile>) => void }) {
  const builtIn = TRADES[p.trade].jobs;
  const setRate = (jobId: string, rateId: string, v: number) => set({ rates: { ...p.rates, [jobId]: { ...(p.rates[jobId] ?? {}), [rateId]: v } } });
  const updateCustom = (id: string, patch: Partial<CustomJob>) => set({ customJobs: p.customJobs.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  const offered = jobsFor(p.trade, p.customJobs, p.hiddenJobs).length;
  return (
    <Section title="Your prices">
      <p className="text-[13px] text-ink-2">These make the price guide. Starting numbers are examples only, so change them to your real prices.</p>
      {builtIn.map((job) => {
        const hidden = p.hiddenJobs.includes(job.id);
        const rates = ratesFor(job, p.rates);
        return (
          <div key={job.id} className={clsx('rounded-lg border border-line p-3', hidden && 'opacity-60')}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[14px] font-semibold">{job.label}</p>
              <label className="flex items-center gap-1.5 text-[12.5px] text-ink-2">
                <input type="checkbox" className="accent-navy" checked={!hidden} onChange={(e) => set({ hiddenJobs: e.target.checked ? p.hiddenJobs.filter((x) => x !== job.id) : [...p.hiddenJobs, job.id] })} />
                Offered
              </label>
            </div>
            {!hidden && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {job.rates.map((r) => (
                  <label key={r.id} className="block text-[12px] text-ink-2">
                    {r.label} <span className="text-ink-3">({r.unit})</span>
                    <input className={clsx(inputCls, 'mt-0.5')} inputMode="numeric" value={rates[r.id] ?? 0} onChange={(e) => setRate(job.id, r.id, Number(e.target.value.replace(/[^\d.]/g, '')) || 0)} />
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
      {p.customJobs.map((c) => (
        <div key={c.id} className="rounded-lg border border-line p-3">
          <div className="flex items-center gap-2">
            <input className={clsx(inputCls, 'font-semibold')} value={c.label} maxLength={50} onChange={(e) => updateCustom(c.id, { label: e.target.value })} aria-label="Job name" />
            <Button size="sm" variant="ghost" aria-label={`Remove ${c.label}`} onClick={() => set({ customJobs: p.customJobs.filter((x) => x.id !== c.id) })}>
              <Trash2 className="size-4" />
            </Button>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <label className="block text-[12px] text-ink-2">
              Base / call-out ($)
              <input className={clsx(inputCls, 'mt-0.5')} inputMode="numeric" value={c.base} onChange={(e) => updateCustom(c.id, { base: Number(e.target.value.replace(/[^\d.]/g, '')) || 0 })} />
            </label>
            <label className="block text-[12px] text-ink-2">
              Priced per (unit)
              <input className={clsx(inputCls, 'mt-0.5')} value={c.unit} maxLength={20} placeholder="m², rooms…" onChange={(e) => updateCustom(c.id, { unit: e.target.value })} />
            </label>
            <label className="block text-[12px] text-ink-2">
              $ per unit
              <input className={clsx(inputCls, 'mt-0.5')} inputMode="numeric" value={c.perUnit} disabled={!c.unit} onChange={(e) => updateCustom(c.id, { perUnit: Number(e.target.value.replace(/[^\d.]/g, '')) || 0 })} />
            </label>
          </div>
          <p className="mt-1 text-[11.5px] text-ink-3">{c.unit ? `Customers are asked “How many ${c.unit}”.` : 'Fixed price: no quantity question. Leave everything at 0 to skip the price guide.'}</p>
        </div>
      ))}
      <Button
        size="sm"
        onClick={() => set({ customJobs: [...p.customJobs, { id: `job${Date.now().toString(36)}`, label: 'New job', unit: '', base: 0, perUnit: 0, spread: 0.2 }] })}
        disabled={p.customJobs.length >= 12}
      >
        <Plus className="size-4" /> Add your own job type
      </Button>
      {offered === 0 && <p className="text-[12.5px] text-bad">Offer at least one job, or customers can’t choose what they need.</p>}
    </Section>
  );
}

function Alerts() {
  const { user } = useApp();
  const [state, setState] = useState<PushState | 'loading'>('loading');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void pushState().then(setState);
  }, []);
  const run = async (fn: () => Promise<PushState>) => {
    setBusy(true);
    setError(null);
    try {
      setState(await fn());
    } catch {
      setError('Couldn’t change alerts on this device. Try again, or check your browser’s notification settings.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Section title="Phone alerts">
      <p className="text-[13px] text-ink-2">A notification on this device for every new enquiry and every quote accepted, plus a 7am summary when follow-ups are due. Works even when QuoteDesk is closed. Turn it on for each phone or computer you use.</p>
      {state === 'loading' ? null : state === 'not-ready' ? (
        <p className="text-[12.5px] text-ink-3">Coming soon to your account.</p>
      ) : state === 'needs-install' ? (
        <p className="text-[12.5px] leading-relaxed text-ink-2">
          On iPhone, alerts need QuoteDesk on your home screen: tap <strong>Share</strong> in Safari, then <strong>Add to Home Screen</strong>, open it from there and come back to this page.
        </p>
      ) : state === 'unsupported' ? (
        <p className="text-[12.5px] text-ink-3">This browser can’t show alerts. Try Chrome, Edge or Safari.</p>
      ) : state === 'blocked' ? (
        <p className="text-[12.5px] text-ink-3">Alerts are blocked for this site. Allow notifications in your browser’s site settings, then reload.</p>
      ) : state === 'on' ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[13px] font-medium text-good">Alerts are on for this device.</p>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => void run(() => disablePush(user.uid))}>
            Turn off
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="primary" disabled={busy} onClick={() => void run(() => enablePush(user.uid))}>
          <Bell className="size-4" /> Turn on alerts for this device
        </Button>
      )}
      {error && <p className="text-[12.5px] text-bad">{error}</p>}
    </Section>
  );
}

function DeleteAccount() {
  const { user, profile } = useApp();
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!open)
    return (
      <button className="text-[12.5px] text-bad hover:underline" onClick={() => setOpen(true)}>
        Delete my account and all data…
      </button>
    );
  return (
    <div className="rounded-lg border border-bad/40 bg-bad-soft/40 p-3">
      <p className="text-[13px] font-medium text-bad">This permanently deletes your account, enquiries, photos and quotes. It can’t be undone.</p>
      <Field label="Enter your password to confirm">
        <input className={clsx(inputCls, 'mt-1')} type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} />
      </Field>
      {error && <p className="mt-1 text-[12.5px] text-bad">{error}</p>}
      <div className="mt-2 flex gap-2">
        <Button
          size="sm"
          variant="danger"
          disabled={busy || !pw}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await deleteEverything(user, pw, profile.slug);
            } catch (e) {
              setError(authMessage(e));
              setBusy(false);
            }
          }}
        >
          Delete everything
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
