import { aud, fitScore, inArea, jobOf, range, ratesFor, rangeFor, type Suggestion } from '../lib/pricing';
import type { RealEnquiry, RealFollowUp, TradieProfile } from './model';

export const DAY = 86_400_000;

export function estimateOf(p: TradieProfile, e: RealEnquiry) {
  const job = jobOf(p.trade, e.jobType, p.customJobs);
  return rangeFor(job, e.answers, ratesFor(job, p.rates));
}

export function fitOf(p: TradieProfile, e: RealEnquiry) {
  return fitScore(estimateOf(p, e), { area: inArea(e.postcode, p.areas), photos: e.photoCount, timing: e.timing, budget: e.budget, otherQuotes: e.otherQuotes, notes: e.notes });
}

export function quoteHoursOf(p: TradieProfile, e: RealEnquiry) {
  return jobOf(p.trade, e.jobType, p.customJobs).quoteHours;
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] || 'there';

export function quoteUrl(token: string) {
  return `${location.origin}${location.pathname}#/quote/${token}`;
}

/** Opens the phone's own Messages app with the text ready to send. Works on iPhone and Android. */
export function smsHref(phone: string, body: string) {
  const to = phone.replace(/[^\d+]/g, '');
  return `sms:${to}?&body=${encodeURIComponent(body)}`;
}

// ---------- message drafts in the tradie's voice ----------

const hello = (p: TradieProfile, e: RealEnquiry) => (p.tone === 'casual' ? `Hi ${firstName(e.name)}, ${p.owner} here from ${p.business}.` : `Hello ${firstName(e.name)}, this is ${p.owner} from ${p.business}.`);
const signoff = (p: TradieProfile) => (p.tone === 'casual' ? `Cheers, ${p.owner}` : `Kind regards, ${p.owner}`);
/** "your new deck", but just "your job" for a generic job name. */
const job = (e: RealEnquiry) => (/^(general|other|new) job$/i.test(e.jobLabel.trim()) ? 'job' : e.jobLabel.toLowerCase());

function payLine(p: TradieProfile) {
  if (!p.visitFee) return 'Just reply with a day and time that suits and I’ll lock it in.';
  return p.paymentLink.trim()
    ? `The site visit is ${aud(p.visitFee)}, and it comes off the job if you go ahead. To book, pay here and reply with a time that suits: ${p.paymentLink.trim()}`
    : `The site visit is ${aud(p.visitFee)}, and it comes off the job if you go ahead. Reply with a time that suits and I’ll send payment details.`;
}

export function draft(p: TradieProfile, e: RealEnquiry, kind: Suggestion): string {
  const est = estimateOf(p, e);
  if (kind === 'ballpark')
    return `${hello(p, e)} Thanks for sending everything through. ${
      est ? `Going by your photos and details, a ${job(e)} like yours usually comes in around ${range(est)}. That's a guide, not a fixed quote.` : `To give you a price I’ll need a quick look in person.`
    }

If that suits your budget, I can come out and measure up for an exact price. ${payLine(p)}

${signoff(p)}`;
  if (kind === 'visit')
    return `${hello(p, e)} Thanks, this looks like a great job for us.${est ? ` As a rough guide it should land around ${range(est)}.` : ''}

To give you an exact price I'll need to see it in person. ${payLine(p)}

${signoff(p)}`;
  const area = inArea(e.postcode, p.areas);
  const far = !!area && !area.ok;
  const fit = fitOf(p, e);
  const why = far
    ? "it's outside the area we cover, so we couldn't give it the attention it deserves"
    : fit.reasons.some((r) => r.text.startsWith('Budget well under'))
      ? "we wouldn't be able to do it properly within that budget, and I'd rather be upfront than waste your time"
      : "we're booked up and can't take it on at the moment";
  return `${hello(p, e)} Thanks for thinking of us for your ${job(e)}. Unfortunately ${why}.

${far ? "I'd suggest asking a tradie closer to you." : 'Sorry we can’t help this time.'} All the best with it.

${signoff(p)}`;
}

export function quoteDraft(p: TradieProfile, e: RealEnquiry, amount: number, token: string) {
  return `${hello(p, e)} Great to meet you. Your quote for the ${job(e)} is ${aud(amount)} including GST${e.depositPaid && p.visitFee ? `, with the ${aud(p.visitFee)} visit fee already taken off` : ''}. It's valid for ${p.quoteValidDays} days.

See the details and accept it here: ${quoteUrl(token)}

Any questions, just reply.
${signoff(p)}`;
}

export function followUpDraft(p: TradieProfile, e: RealEnquiry, n: 1 | 2 | 3) {
  const name = firstName(e.name);
  const link = e.quote ? ` ${quoteUrl(e.quote.token)}` : '';
  if (n === 1) return `Hi ${name}, just checking the quote came through OK and whether you had any questions?${link} ${p.owner}`;
  if (n === 2) return `Hi ${name}, ${p.owner} again. Happy to talk through the quote, or change options to suit your budget. Let me know if you'd like to lock in a start date.${link}`;
  return `Hi ${name}, last check-in from me about the ${job(e)}. I'll close off the quote at the end of the week so I can plan our schedule. If you've gone another way, no worries at all, and thanks for considering us. ${p.owner}`;
}

// ---------- follow-ups ----------

export function scheduleFollowUps(p: TradieProfile, sentAt: number): RealFollowUp[] {
  return ([1, 2, 3] as const).map((n) => ({ n, dueAt: sentAt + p.followUpDays[n - 1] * DAY, status: 'scheduled' }));
}

export function dueFollowUps(list: RealEnquiry[], now = Date.now()) {
  return list.flatMap((e) => (e.status === 'quoted' ? e.followUps.filter((f) => f.status === 'scheduled' && f.dueAt <= now).map((f) => ({ e, f })) : []));
}

export function needsAction(e: RealEnquiry, now = Date.now()) {
  return e.status === 'new' || e.status === 'visit_booked' || (e.status === 'quoted' && e.followUps.some((f) => f.status === 'scheduled' && f.dueAt <= now));
}

export function when(ms: number, now = Date.now()) {
  const d = Math.round((ms - now) / DAY);
  const day = new Date(ms).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
  if (Math.abs(ms - now) < DAY && new Date(ms).getDate() === new Date(now).getDate()) return `today`;
  if (d === 1) return `tomorrow (${day})`;
  if (d === -1) return `yesterday`;
  return day;
}

export function ago(ms: number, now = Date.now()) {
  const m = Math.round((now - ms) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}

// ---------- results ----------

export function realResults(p: TradieProfile, list: RealEnquiry[]) {
  const quoted = list.filter((e) => e.quote);
  const won = list.filter((e) => e.status === 'won');
  const decided = quoted.filter((e) => e.status === 'won' || e.status === 'lost');
  const avoided = list.filter((e) => !e.quote && !e.depositPaid && (e.status === 'declined' || e.status === 'ballpark' || e.status === 'lost'));
  const sent = list.reduce((n, e) => n + e.followUps.filter((f) => f.status === 'sent').length, 0);
  const wonBack = won.filter((e) => e.wonAfterFollowUp);
  return {
    enquiries: list.length,
    avoided: avoided.length,
    hoursSaved: avoided.reduce((h, e) => h + quoteHoursOf(p, e), 0) + sent * (5 / 60),
    deposits: list.filter((e) => e.depositPaid).length * p.visitFee,
    quotes: quoted.length,
    won: won.length,
    winRate: decided.length ? won.length / decided.length : null,
    wonValue: won.reduce((v, e) => v + (e.wonValue ?? 0), 0),
    wonBack: wonBack.length,
    wonBackValue: wonBack.reduce((v, e) => v + (e.wonValue ?? 0), 0),
    followUpsSent: sent,
  };
}
