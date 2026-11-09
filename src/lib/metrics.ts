import { jobOf } from './pricing';
import type { State } from './types';

/** The Solo plan, which is what the demo tradie is on. */
export const PLAN_PRICE = 49;

export const PLANS = [
  { name: 'Solo', price: 49, who: 'One-person businesses', includes: ['1 user', '300 texts a month', 'Price ranges, fit scores and drafts', 'Paid site-visit deposits', 'Automatic follow-ups'] },
  { name: 'Crew', price: 99, who: 'Teams of 2–15', includes: ['Unlimited users', '800 texts a month', 'Everything in Solo', 'Sync with ServiceM8, Tradify and Jobber', 'Shared inbox and results'] },
] as const;

/** What the tradie gets out of the tool, worked out from the enquiries in the demo. */
export function results(s: State) {
  const es = s.enquiries;
  const quoted = es.filter((e) => e.quote);
  const won = es.filter((e) => e.status === 'won');
  const decided = quoted.filter((e) => e.status === 'won' || e.status === 'lost');
  // A site visit was avoided when the tradie answered without driving out and the customer didn't book.
  const avoided = es.filter((e) => (e.status === 'declined' || e.status === 'ballpark' || (e.status === 'lost' && !e.depositPaid)) && !e.quote);
  const hoursSaved =
    avoided.reduce((h, e) => h + jobOf(s.profile.trade, e.jobType).quoteHours, 0) +
    es.reduce((h, e) => h + e.followUps.filter((f) => f.status === 'sent').length * (5 / 60), 0);
  const wonBack = won.filter((e) => e.wonAfterFollowUp);
  const deposits = es.filter((e) => e.depositPaid).length * s.profile.siteVisitFee;
  return {
    enquiries: es.length,
    newCount: es.filter((e) => e.status === 'new').length,
    avoided: avoided.length,
    hoursSaved,
    deposits,
    quotes: quoted.length,
    won: won.length,
    winRate: decided.length ? won.length / decided.length : null,
    wonValue: won.reduce((v, e) => v + (e.wonValue ?? 0), 0),
    wonBack: wonBack.length,
    wonBackValue: wonBack.reduce((v, e) => v + (e.wonValue ?? 0), 0),
    followUpsSent: es.reduce((n, e) => n + e.followUps.filter((f) => f.status === 'sent').length, 0),
    awaiting: es.reduce((n, e) => n + e.followUps.filter((f) => f.status === 'awaiting').length, 0),
  };
}
