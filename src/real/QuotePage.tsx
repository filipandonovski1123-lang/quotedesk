import { CheckCircle2, Loader2, MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button, Card } from '../components/ui';
import { aud } from '../lib/pricing';
import { loadQuote, respondToQuote } from './api';
import type { PublicQuote } from './model';
import { smsHref } from './logic';

/** The page a customer opens from the quote text: see the quote and accept it in one tap. */
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

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-10">
      {q === 'loading' ? (
        <p className="flex items-center gap-2 text-ink-2">
          <Loader2 className="size-4 animate-spin" /> Loading your quote…
        </p>
      ) : !q ? (
        <>
          <h1 className="text-[20px] font-semibold">Quote not found</h1>
          <p className="mt-2 text-ink-2">It may have been withdrawn. Reply to the text you received to check with the business.</p>
        </>
      ) : (
        <>
          <p className="text-[13px] font-medium text-accent">{q.business}</p>
          <h1 className="mt-1 text-[24px] leading-tight font-semibold">Your quote, {q.customerFirst}</h1>
          <Card className="mt-5 p-5">
            <p className="text-[13px] text-ink-3">{q.jobLabel}</p>
            <p className="mt-1 text-[34px] font-semibold tabular-nums">{aud(q.amount)}</p>
            <p className="text-[13px] text-ink-2">Including GST · valid until {new Date(q.validUntil).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            {q.notes && (
              <div className="mt-4 border-t border-line pt-3">
                <p className="text-[12px] font-semibold tracking-wide text-ink-3 uppercase">What’s included</p>
                <p className="mt-1 text-[14px] leading-relaxed whitespace-pre-line text-ink">{q.notes}</p>
              </div>
            )}
          </Card>

          {q.status === 'open' && Date.now() <= q.validUntil && (
            <div className="mt-5 space-y-2">
              <Button variant="accent" className="h-12 w-full text-[15px]" disabled={busy} onClick={() => void respond('accepted')}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : null} Accept this quote
              </Button>
              <Button variant="ghost" className="w-full" disabled={busy} onClick={() => void respond('declined')}>
                We’re not going ahead
              </Button>
            </div>
          )}
          {q.status === 'open' && Date.now() > q.validUntil && <p className="mt-5 rounded-lg bg-mid-soft p-3 text-[14px] text-mid">This quote has expired. Text {q.owner} for an updated price.</p>}
          {q.status === 'accepted' && (
            <div className="mt-5 rounded-lg bg-good-soft p-4 text-good">
              <p className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="size-5" /> Accepted. Thank you!
              </p>
              <p className="mt-1 text-[14px] text-ink-2">{q.owner} has been told and will be in touch to lock in a start date.</p>
              {q.paymentLink && <p className="mt-2 text-[14px] text-ink-2">If a deposit is needed: {linkify(q.paymentLink)}</p>}
            </div>
          )}
          {q.status === 'declined' && <p className="mt-5 rounded-lg bg-surface-2 p-3 text-[14px] text-ink-2">Thanks for letting {q.owner} know. No further follow-ups will be sent.</p>}
          {error && (
            <p role="alert" className="mt-3 text-[13px] text-bad">
              {error}
            </p>
          )}

          {q.phone && (
            <a href={smsHref(q.phone, `Hi ${q.owner}, a question about my quote: `)} className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-navy hover:underline">
              <MessageSquare className="size-4" /> Text {q.owner} a question
            </a>
          )}
        </>
      )}
      <p className="mt-12 text-center text-[12px] text-ink-3">
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
  );
}

function linkify(text: string) {
  const t = text.trim();
  return /^https:\/\//.test(t) ? (
    <a href={t} target="_blank" rel="noopener noreferrer" className="font-medium text-navy underline">
      pay here
    </a>
  ) : (
    t
  );
}
