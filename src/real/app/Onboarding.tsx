import type { User } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button, Field, inputCls } from '../../components/ui';
import { TRADES } from '../../lib/pricing';
import type { TradeId } from '../../lib/types';
import { createProfile, signOut } from '../api';

export function Onboarding({ user }: { user: User }) {
  const [owner, setOwner] = useState('');
  const [business, setBusiness] = useState('');
  const [phone, setPhone] = useState('');
  const [trade, setTrade] = useState<TradeId>('decking');
  const [areas, setAreas] = useState('');
  const [visitFee, setVisitFee] = useState('150');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createProfile(user.uid, {
        owner: owner.trim(),
        business: business.trim(),
        phone: phone.trim(),
        trade,
        rates: {},
        customJobs: trade === 'other' ? [{ id: 'job1', label: 'General job', unit: '', base: 0, perUnit: 0, spread: 0.2 }] : [],
        hiddenJobs: [],
        areas: areas.trim(),
        visitFee: Number(visitFee.replace(/\D/g, '')) || 0,
        paymentLink: '',
        tone: 'casual',
        followUpDays: [2, 7, 14],
        quoteValidDays: 30,
      });
    } catch (err) {
      setError(err instanceof Error && err.message.startsWith('Couldn’t') ? err.message : 'Couldn’t save that. Check your connection and try again.');
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <p className="text-[13px] font-medium text-accent">Step 1 of 2 · about 2 minutes</p>
      <h1 className="mt-1 text-[24px] font-semibold">Set up your business</h1>
      <p className="mt-1 text-[14px] text-ink-2">This makes your enquiry link and the texts you send. You can change any of it later.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Your first name">
            <input className={inputCls} required maxLength={40} value={owner} onChange={(e) => setOwner(e.target.value)} autoComplete="given-name" />
          </Field>
          <Field label="Your mobile">
            <input className={inputCls} required maxLength={20} inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
          </Field>
        </div>
        <Field label="Business name">
          <input className={inputCls} required maxLength={60} value={business} onChange={(e) => setBusiness(e.target.value)} autoComplete="organization" />
        </Field>
        <Field label="Your trade" hint="Sets up starting prices you can edit. Pick “Another trade” to set up your own jobs.">
          <select className={inputCls} value={trade} onChange={(e) => setTrade(e.target.value as TradeId)}>
            {Object.values(TRADES).map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Postcodes you cover" hint="Ranges and single postcodes, e.g. 2070-2125, 2150. Enquiries outside these get flagged.">
          <input className={inputCls} value={areas} onChange={(e) => setAreas(e.target.value)} placeholder="2070-2125, 2150" />
        </Field>
        <Field label="Site visit fee ($)" hint="Charged to book a measure-up, then taken off the job if they go ahead. Use 0 for free visits.">
          <input className={inputCls} inputMode="numeric" value={visitFee} onChange={(e) => setVisitFee(e.target.value)} />
        </Field>
        {error && (
          <p role="alert" className="text-[13px] text-bad">
            {error}
          </p>
        )}
        <Button type="submit" variant="primary" className="h-11 w-full" disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" />} Create my enquiry link
        </Button>
      </form>
      <button className="mt-6 text-[13px] text-ink-3 hover:underline" onClick={() => void signOut()}>
        Sign out ({user.email})
      </button>
    </main>
  );
}
