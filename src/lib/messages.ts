import { aud, jobOf, range } from './pricing';
import type { Enquiry, Profile } from './types';

/**
 * Message drafts in the tradie's voice. In the real product an AI model would write these from the
 * enquiry and the tradie's past messages; the prototype uses templates so it runs without a server.
 */

const first = (name: string) => name.trim().split(/\s+/)[0] || 'there';
const jobName = (p: Profile, e: Enquiry) => jobOf(p.trade, e.jobType).label.toLowerCase();

function hello(p: Profile, e: Enquiry) {
  return p.tone === 'casual' ? `Hi ${first(e.name)}, ${p.owner} here from ${p.business}.` : `Hello ${first(e.name)}, this is ${p.owner} from ${p.business}.`;
}
const signoff = (p: Profile) => (p.tone === 'casual' ? `Cheers, ${p.owner}` : `Kind regards, ${p.owner}`);

export function ackMsg(p: Profile, e: Enquiry) {
  return `${hello(p, e)} Thanks for the details${e.photos ? ' and photos' : ''} for your ${jobName(p, e)}. I'll take a look and get back to you today.`;
}

export function ballparkMsg(p: Profile, e: Enquiry) {
  return `${hello(p, e)} Thanks for sending everything through. Going by your photos and details, a ${jobName(p, e)} like yours usually comes in around ${range(e.estimate)}.

That's a guide, not a fixed quote. If it suits your budget, I can come out and measure up for an exact price. The site visit is ${aud(p.siteVisitFee)}, and it comes off the job if you go ahead.

${signoff(p)}`;
}

export function visitMsg(p: Profile, e: Enquiry) {
  return `${hello(p, e)} Thanks, this looks like a great job for us. As a rough guide, it should land around ${range(e.estimate)}.

To give you an exact price I'll need to see it in person. The site visit is ${aud(p.siteVisitFee)}, taken off the final bill if you go ahead. Pick a time that suits you with the link below.

${signoff(p)}`;
}

export function declineMsg(p: Profile, e: Enquiry) {
  const far = e.km > p.radiusKm;
  const budget = e.fit.reasons.some((r) => r.text.startsWith('Budget well under'));
  const why = far
    ? "it's a bit outside the area we cover, so we couldn't give it the attention it deserves"
    : budget
      ? "we wouldn't be able to do it properly within that budget, and I'd rather be upfront than waste your time"
      : "we're not the right fit for it at the moment";
  return `${hello(p, e)} Thanks for thinking of us for your ${jobName(p, e)}. Unfortunately ${why}.

I'd suggest asking a local ${far ? 'business closer to you' : 'tradie'} for a quote. All the best with it.

${signoff(p)}`;
}

export function quoteMsg(p: Profile, e: Enquiry, amount: number) {
  return `${hello(p, e)} Great to meet you. Your quote for the ${jobName(p, e)} is ${aud(amount)} including GST, with the ${aud(p.siteVisitFee)} visit fee already taken off. It's valid for 30 days.

Any questions, just reply here. To lock in a start date, tap Accept on the quote.

${signoff(p)}`;
}

export function followUpMsg(p: Profile, e: Enquiry, n: 1 | 2 | 3) {
  const name = first(e.name);
  if (n === 1) return `Hi ${name}, just checking the quote came through OK and whether you had any questions? ${p.owner}`;
  if (n === 2)
    return `Hi ${name}, ${p.owner} again. Happy to talk through the quote, or change options to suit your budget. We have a spot opening up in a few weeks if you'd like to lock it in.`;
  return `Hi ${name}, last check-in from me about the ${jobName(p, e)}. I'll close off the quote at the end of the week so I can plan our schedule. If you've gone another way, no worries at all, and thanks for considering us. ${p.owner}`;
}

export function repriceMsg(p: Profile, e: Enquiry, amount: number) {
  return `Hi ${first(e.name)}, a heads-up: our supplier prices have gone up since I quoted. To keep things fair I've updated your quote to ${aud(amount)}, valid for another 30 days. Happy to talk it through. ${p.owner}`;
}

export const FOLLOW_UP_DAYS: Record<1 | 2 | 3, number> = { 1: 2, 2: 7, 3: 14 };
