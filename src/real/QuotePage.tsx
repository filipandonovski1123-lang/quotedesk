import clsx from 'clsx';
import { Check, CheckCircle2, Loader2, MessageSquare, Phone, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button, Card } from '../components/ui';
import { aud } from '../lib/pricing';
import { loadQuote, respondToQuote } from './api';
import { smsHref } from './logic';
import type { PublicQuote } from './model';

const date = (ms: number) => new Date(ms).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
/** A short, readable reference for phone calls: "Q-7K2M9". */
const refOf = (token: string) => `Q-${token.slice(0, 5).toUpperCase()}`;
/** "Includes X\nY" or "• X • Y" → a list of separate items. */
const items = (notes: string) =>
  notes
    .split(/\n|•|;/)
    .map((s) => s.replace(/^[-*\s]+/, '').trim())
    .filter(Boolean);

/**
 * The page a customer opens from the quote text. It should feel like it comes from a reputable
 * local business: their name up top, the total and what's included, one obvious Accept button.
 */
export default function QuotePage({ token }: { token: string }) {
  const [q, setQ] = useState<PublicQuote | null | 'loading'>('loading');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    loadQuote(token)
      .then((x) => {
        setQ(x);
        if (x) document.title = `Your quote from ${x.business}`;
      })
      .catch(() => setQ(null));
  }, [token]);

  const respond = async (status: 'accepted' | 'declined') => {
    if (q === 'loading' || !q) return;
    if (status === 'declined' && !confirm(`Let ${q.owner} know you’re not going ahead?`)) return;
    setBusy(true);
    setError(null);
    try {
      await respondToQuote(token, status);
      setQ({ ...q, status });
    } catch {
      setError('That didn’t go through. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  if (q === 'loading')
    return (
      <main className="grid min-h-dvh place-items-center text-ink-3">
        <Loader2 className="size-6 animate-spin" />
      </main>
    );
  if (!q)
    return (
      <main className="mx-auto max-w-lg px-4 py-12">
        <h1 className="text-[22px] font-bold">Quote not found</h1>
        <p className="mt-2 text-ink-2">It may have been withdrawn. Reply to the text you received to check with the business.</p>
      </main>
    );

  const expired = q.status === 'open' && Date.now() > q.validUntil;
  const tel = q.phone.replace(/[^\d+]/g, '');
  const list = q.notes ? items(q.notes) : [];

  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto max-w-lg px-4 pt-6 pb-5 text-center">
          <p className="inline-flex items-center gap-2 font-display text-[28px] leading-none font-bold">
            <span className="grid size-9 place-items-center rounded-lg bg-navy text-[#f0a05c]">
              <Check className="size-6" strokeWidth={3.2} />
            </span>
            {q.business}
          </p>
          <p className="mt-2 text-[13.5px] text-ink-2">{[q.owner, q.abn && `ABN ${q.abn}`, q.licence && `Licence ${q.licence}`].filter(Boolean).join(' · ')}</p>
          {tel && (
            <a href={`tel:${tel}`} className="mt-3 inline-flex h-11 items-center gap-1.5 rounded-xl border border-line-strong px-4 text-[14.5px] font-semibold hover:bg-surface-2">
              <Phone className="size-4 text-accent" /> Call {q.phone}
            </a>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pt-6 pb-10">
        <h1 className="font-display text-[34px] leading-none font-bold">{q.status === 'accepted' ? 'Quote accepted' : 'Your quote'}</h1>
        <p className="mt-2 text-[15px] text-ink-2">
          Hi {q.customerFirst}, here’s your quote for the {q.jobLabel.toLowerCase()}.
        </p>

        <Card className="mt-4 overflow-hidden rounded-2xl shadow-[0_1px_3px_rgb(23_32_42/0.06)]">
          <div className="px-4 pt-4 pb-4">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[14px] font-bold">Your quote</p>
              <p className="text-[12.5px] font-semibold text-ink-3 tabular-nums">Ref {refOf(token)}</p>
            </div>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-[46px] leading-none font-bold tabular-nums">{aud(q.amount)}</span>
              <span className="text-[13.5px] text-ink-2">(incl. GST)</span>
            </p>
            {list.length > 0 && (
              <ul className="mt-4 space-y-2 border-t border-line pt-3.5">
                {list.map((it, i) => (
                  <li key={i} className="flex gap-2.5 text-[15px] leading-snug">
                    <Check className="mt-0.5 size-[18px] shrink-0 text-good" strokeWidth={3} /> {it}
                  </li>
                ))}
              </ul>
            )}
            <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-3 text-[13px]">
              <div>
                <dt className="text-ink-3">Issued</dt>
                <dd className="font-semibold">{date(q.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-ink-3">Valid until</dt>
                <dd className={clsx('font-semibold', expired && 'text-bad')}>{date(q.validUntil)}</dd>
              </div>
            </dl>
          </div>
        </Card>

        {q.status === 'open' && !expired && (
          <div className="mt-4 space-y-2.5">
            <Button variant="primary" className="h-14 w-full text-[17px]" disabled={busy} onClick={() => void respond('accepted')}>
              {busy ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" strokeWidth={3} />} Accept quote
            </Button>
            {tel && (
              <a href={smsHref(q.phone, `Hi ${q.owner}, a question about quote ${refOf(token)}: `)} className="flex h-13 min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface text-[15.5px] font-semibold hover:bg-surface-2">
                <MessageSquare className="size-[18px]" /> Ask a question
              </a>
            )}
            <p className="pt-1 text-center text-[13px] text-ink-2">Accepting tells {q.owner} straight away. They’ll then contact you to book a start date.</p>
            <button className="mx-auto block py-2 text-[13px] text-ink-3 underline-offset-2 hover:underline" disabled={busy} onClick={() => void respond('declined')}>
              We’re not going ahead
            </button>
          </div>
        )}

        {expired && (
          <p className="mt-4 rounded-xl bg-mid-soft p-4 text-[14px] text-mid">
            This quote has expired. Text {q.owner} for an updated price{tel ? ` on ${q.phone}` : ''}.
          </p>
        )}

        {q.status === 'accepted' && (
          <div className="mt-4 rounded-2xl border border-good/30 bg-good-soft p-4">
            <p className="flex items-center gap-2 text-[17px] font-bold text-good">
              <CheckCircle2 className="size-5" /> Thanks, it’s accepted
            </p>
            <p className="mt-1.5 text-[14px] text-ink">
              {q.owner} has been told and will contact you to book a start date. Your reference is <strong>{refOf(token)}</strong>, so screenshot this page for your records.
            </p>
            {q.paymentLink && <p className="mt-2 text-[14px] text-ink">If a deposit is needed: {linkify(q.paymentLink)}</p>}
          </div>
        )}
        {q.status === 'declined' && <p className="mt-4 rounded-xl bg-surface-2 p-4 text-[14px] text-ink-2">Thanks for letting {q.owner} know. You won’t get any more follow-ups about this quote.</p>}
        {error && (
          <p role="alert" className="mt-3 text-[13px] text-bad">
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-surface-2 p-3.5">
          <ShieldCheck className="size-7 shrink-0 text-ink-2" />
          <div>
            <p className="text-[14px] font-bold">Secure and simple</p>
            <p className="text-[12.5px] text-ink-2">This quote is from {q.business}. Your details are only shared with them.</p>
          </div>
        </div>
        <p className="mt-5 text-center text-[12.5px] text-ink-3">
          Sent with{' '}
          <a href="#/" className="font-medium text-ink-2 hover:underline">
            QuoteDesk
          </a>{' '}
          ·{' '}
          <a href="#/privacy" className="hover:underline">
            Privacy
          </a>
        </p>
      </main>
    </div>
  );
}

function linkify(text: string) {
  const t = text.trim();
  return /^https:\/\//.test(t) ? (
    <a href={t} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy underline">
      pay here
    </a>
  ) : (
    t
  );
}
