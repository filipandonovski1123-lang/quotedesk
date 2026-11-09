import { useSyncExternalStore } from 'react';
import { ackMsg, ballparkMsg, declineMsg, FOLLOW_UP_DAYS, followUpMsg, quoteMsg, repriceMsg, visitMsg } from './messages';
import { defaultAnswers, inputFit, TRADES } from './pricing';
import type { Enquiry, EnquiryInput, Msg, Profile, State, TradeId } from './types';
import { aud } from './pricing';

const KEY = 'quotedesk-prototype-v1';
const START_DAY = 14;

// ---------- deterministic randomness, so the simulation is repeatable ----------

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
export function rand(seed: string): number {
  let t = hash(seed) + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

let counter = 0;
const uid = (p: string) => `${p}_${Date.now().toString(36)}${(counter++).toString(36)}`;

// ---------- building enquiries ----------

export function makeEnquiry(profile: Profile, input: EnquiryInput, day: number, materialIndex: number, id = uid('enq')): Enquiry {
  const { est, km, fit } = inputFit(profile, input, materialIndex);
  const intent = Math.max(0.05, Math.min(0.95, (fit.score / 100) * 0.85 + rand(id + 'intent') * 0.2 - 0.05));
  const e: Enquiry = {
    id,
    ...input,
    km,
    createdDay: day,
    status: 'new',
    estimate: est,
    fit,
    messages: [],
    followUps: [],
    depositPaid: false,
    intent,
  };
  e.messages.push(msg('customer', `New enquiry: ${input.notes || 'details in the form'}`, day));
  e.messages.push(msg('tradie', ackMsg(profile, e), day, true));
  return e;
}

function msg(from: Msg['from'], text: string, day: number, auto = false): Msg {
  return { id: uid('m'), from, text, day, auto };
}

function seedEnquiries(profile: Profile): Enquiry[] {
  const t = TRADES[profile.trade];
  const [jobA, jobB] = [t.jobs[0]!, t.jobs[1] ?? t.jobs[0]!];
  const base = (over: Partial<EnquiryInput>, jobId = jobA.id): EnquiryInput => ({
    name: 'Customer',
    phone: '0400 000 000',
    suburb: 'Epping',
    jobType: jobId,
    answers: defaultAnswers(jobId === jobA.id ? jobA : jobB),
    photos: 3,
    timing: 'month',
    budget: null,
    otherQuotes: 'one',
    notes: '',
    ...over,
  });
  const make = (id: string, input: EnquiryInput, day: number) => makeEnquiry(profile, input, day, 100, id);

  // A strong lead that just came in.
  const sarah = make('seed-sarah', base({ name: 'Sarah Mitchell', phone: '0412 555 019', suburb: 'Hornsby', timing: 'asap', otherQuotes: 'none', notes: 'Want it done before the kids’ party in about 6 weeks. Access is via the side gate.' }), START_DAY);
  sarah.budget = sarah.estimate.high;
  Object.assign(sarah, { fit: inputFit(profile, { ...base({}), ...sarah }, 100).fit });

  // A tyre-kicker: far away, just browsing, low budget, several quotes.
  const jake = make('seed-jake', base({ name: 'Jake Turner', phone: '0433 555 284', suburb: 'Penrith', timing: 'browsing', otherQuotes: 'several', photos: 0, notes: 'how much' }), START_DAY);
  jake.budget = Math.round(jake.estimate.low * 0.45);
  Object.assign(jake, { fit: inputFit(profile, { ...base({}), ...jake }, 100).fit });

  // A quote sent 5 days ago, first follow-up already gone out.
  const priya = make('seed-priya', base({ name: 'Priya Kumar', phone: '0421 555 760', suburb: 'Castle Hill', otherQuotes: 'one', notes: 'Looking for a quality finish, happy to pay for it.' }, jobB.id), START_DAY - 8);
  priya.budget = priya.estimate.high;
  priya.fit = inputFit(profile, { ...base({}, jobB.id), ...priya }, 100).fit;
  priya.messages.push(msg('tradie', visitMsg(profile, priya), START_DAY - 8));
  priya.messages.push(msg('system', `Site visit booked. ${aud(profile.siteVisitFee)} deposit paid by card.`, START_DAY - 7));
  priya.depositPaid = true;
  const priyaAmount = Math.round((priya.estimate.low + priya.estimate.high) / 2 / 10) * 10;
  priya.quote = { amount: priyaAmount, sentDay: START_DAY - 5, materialIndex: 100 };
  priya.messages.push(msg('tradie', quoteMsg(profile, priya, priyaAmount), START_DAY - 5));
  priya.status = 'quoted';
  priya.followUps = ([1, 2, 3] as const).map((n) => ({ n, dueDay: START_DAY - 5 + FOLLOW_UP_DAYS[n], status: 'scheduled', text: followUpMsg(profile, priya, n) }));
  priya.followUps[0]!.status = 'sent';
  priya.messages.push(msg('tradie', priya.followUps[0]!.text, START_DAY - 3, true));
  priya.intent = 0.7;

  // A job won after the second follow-up.
  const tom = make('seed-tom', base({ name: 'Tom Reyes', phone: '0409 555 431', suburb: 'Epping', timing: 'month' }), 1);
  tom.budget = tom.estimate.high;
  tom.depositPaid = true;
  const tomAmount = Math.round(tom.estimate.high / 10) * 10;
  tom.quote = { amount: tomAmount, sentDay: 3, materialIndex: 100 };
  tom.messages.push(msg('tradie', quoteMsg(profile, tom, tomAmount), 3));
  tom.followUps = ([1, 2, 3] as const).map((n) => ({ n, dueDay: 3 + FOLLOW_UP_DAYS[n], status: n < 3 ? 'sent' : 'cancelled', text: followUpMsg(profile, tom, n) }));
  tom.messages.push(msg('tradie', tom.followUps[0]!.text, 5, true), msg('tradie', tom.followUps[1]!.text, 10, true));
  tom.messages.push(msg('customer', 'Sorry for the slow reply, been flat out. Let’s go ahead!', 11));
  Object.assign(tom, { status: 'won', wonValue: tomAmount, wonAfterFollowUp: true, closedDay: 11 });

  // An out-of-area enquiry that was politely declined in one tap.
  const lena = make('seed-lena', base({ name: 'Lena Walsh', suburb: 'Manly', timing: 'flexible', otherQuotes: 'several', photos: 1 }), START_DAY - 4);
  lena.messages.push(msg('tradie', declineMsg(profile, lena), START_DAY - 4));
  lena.status = 'declined';
  lena.closedDay = START_DAY - 4;

  return [sarah, jake, priya, tom, lena];
}

export function initialState(trade: TradeId = 'decking'): State {
  const t = TRADES[trade];
  const profile: Profile = {
    owner: t.owner,
    business: t.business,
    trade,
    suburb: 'Hornsby',
    radiusKm: 25,
    siteVisitFee: 150,
    tone: 'casual',
    autoSend: true,
    rateMultiplier: 1,
  };
  return { version: 1, profile, day: START_DAY, materialIndex: 100, enquiries: seedEnquiries(profile), customerEnquiryId: null };
}

// ---------- store ----------

function load(): State | null {
  try {
    const raw = localStorage.getItem(KEY);
    const s = raw ? (JSON.parse(raw) as State) : null;
    return s?.version === 1 ? s : null;
  } catch {
    return null;
  }
}

let state: State = load() ?? initialState();
const listeners = new Set<() => void>();

function commit(next: State) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage can be unavailable; the demo still works in memory */
  }
  listeners.forEach((l) => l());
}

function update(fn: (d: State) => void) {
  const d = structuredClone(state);
  fn(d);
  commit(d);
}

function withEnquiry(id: string, fn: (e: Enquiry, d: State) => void) {
  update((d) => {
    const e = d.enquiries.find((x) => x.id === id);
    if (e) fn(e, d);
  });
}

export function useAppState(): State {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => state,
  );
}
export const getState = () => state;

// ---------- actions: customer side ----------

export function submitEnquiry(input: EnquiryInput): string {
  const e = makeEnquiry(state.profile, input, state.day, state.materialIndex);
  update((d) => {
    d.enquiries.unshift(e);
    d.customerEnquiryId = e.id;
  });
  return e.id;
}

export function setCustomerEnquiry(id: string | null) {
  update((d) => void (d.customerEnquiryId = id));
}

export function payDeposit(id: string) {
  withEnquiry(id, (e, d) => {
    if (e.depositPaid) return;
    e.depositPaid = true;
    e.status = 'visit_booked';
    e.messages.push(msg('system', `Site visit booked. ${aud(d.profile.siteVisitFee)} deposit paid by card.`, d.day));
    e.messages.push(msg('tradie', `Thanks ${e.name.split(' ')[0]}, you're booked in. See you then! ${d.profile.owner}`, d.day, true));
  });
}

export function acceptQuote(id: string, byCustomerText = 'Happy with that, let’s go ahead!') {
  withEnquiry(id, (e, d) => close(e, d, 'won', byCustomerText));
}

export function customerSays(id: string, text: string, outcome?: 'lost') {
  withEnquiry(id, (e, d) => {
    if (outcome) close(e, d, 'lost', text);
    else e.messages.push(msg('customer', text, d.day));
  });
}

function close(e: Enquiry, d: State, outcome: 'won' | 'lost', text: string) {
  if (e.status === 'won' || e.status === 'lost' || e.status === 'declined') return;
  e.messages.push(msg('customer', text, d.day));
  e.status = outcome;
  e.closedDay = d.day;
  e.followUps.forEach((f) => {
    if (f.status === 'scheduled' || f.status === 'awaiting') f.status = 'cancelled';
  });
  if (outcome === 'won') {
    e.wonValue = e.quote?.amount ?? Math.round((e.estimate.low + e.estimate.high) / 2);
    e.wonAfterFollowUp = e.followUps.some((f) => f.status === 'sent');
    e.messages.push(msg('system', `Job won: ${aud(e.wonValue)}. Added to your job app.`, d.day));
  }
}

// ---------- actions: tradie side ----------

export function draftFor(e: Enquiry, action: 'ballpark' | 'visit' | 'decline'): string {
  const p = state.profile;
  return action === 'ballpark' ? ballparkMsg(p, e) : action === 'visit' ? visitMsg(p, e) : declineMsg(p, e);
}

export function respond(id: string, action: 'ballpark' | 'visit' | 'decline', text: string) {
  withEnquiry(id, (e, d) => {
    e.messages.push(msg('tradie', text, d.day));
    if (action === 'decline') {
      e.status = 'declined';
      e.closedDay = d.day;
    } else e.status = action === 'visit' ? 'visit_offered' : 'ballpark';
  });
}

export function draftQuote(e: Enquiry, amount: number) {
  return quoteMsg(state.profile, e, amount);
}

export function sendQuote(id: string, amount: number, text: string) {
  withEnquiry(id, (e, d) => {
    e.quote = { amount, sentDay: d.day, materialIndex: d.materialIndex };
    e.status = 'quoted';
    e.messages.push(msg('tradie', text, d.day));
    e.followUps = ([1, 2, 3] as const).map((n) => ({ n, dueDay: d.day + FOLLOW_UP_DAYS[n], status: 'scheduled', text: followUpMsg(d.profile, e, n) }));
  });
}

export function approveFollowUp(id: string, n: 1 | 2 | 3, text: string) {
  withEnquiry(id, (e, d) => {
    const f = e.followUps.find((x) => x.n === n);
    if (!f || f.status === 'sent' || f.status === 'cancelled') return;
    f.status = 'sent';
    f.text = text;
    e.messages.push(msg('tradie', text, d.day));
  });
}

export function skipFollowUp(id: string, n: 1 | 2 | 3) {
  withEnquiry(id, (e) => {
    const f = e.followUps.find((x) => x.n === n);
    if (f && f.status !== 'sent') f.status = 'cancelled';
  });
}

export function priceRise(e: Enquiry, materialIndex: number): number {
  if (!e.quote || e.status !== 'quoted') return 0;
  return materialIndex / e.quote.materialIndex - 1;
}

export function reprice(id: string) {
  withEnquiry(id, (e, d) => {
    if (!e.quote) return;
    const amount = Math.round((e.quote.amount * (d.materialIndex / e.quote.materialIndex)) / 10) * 10;
    e.quote = { amount, sentDay: d.day, materialIndex: d.materialIndex };
    e.messages.push(msg('tradie', repriceMsg(d.profile, e, amount), d.day));
  });
}

export function markOutcome(id: string, outcome: 'won' | 'lost') {
  withEnquiry(id, (e, d) => close(e, d, outcome, outcome === 'won' ? 'Customer said yes (marked by you).' : 'Customer went elsewhere (marked by you).'));
}

export function updateProfile(patch: Partial<Profile>) {
  if (patch.trade && patch.trade !== state.profile.trade) {
    const fresh = initialState(patch.trade);
    commit({ ...fresh, profile: { ...fresh.profile, ...patch, owner: TRADES[patch.trade].owner, business: TRADES[patch.trade].business } });
    return;
  }
  update((d) => void Object.assign(d.profile, patch));
}

export function resetDemo() {
  commit(initialState(state.profile.trade));
}

// ---------- simulated time ----------

/** Moves the clock forward. Follow-ups fall due, supplier prices creep up, and simulated customers act. */
export function advance(days: number) {
  update((d) => {
    for (let i = 0; i < days; i++) {
      d.day += 1;
      d.materialIndex = Math.round(d.materialIndex * 1.004 * 100) / 100;
      for (const e of d.enquiries) {
        const human = e.id === d.customerEnquiryId;
        let nudged = false;
        if (e.status === 'quoted') {
          for (const f of e.followUps) {
            if (f.status === 'scheduled' && f.dueDay <= d.day) {
              if (d.profile.autoSend) {
                f.status = 'sent';
                e.messages.push(msg('tradie', f.text, d.day, true));
                nudged = true;
              } else f.status = 'awaiting';
            }
          }
        }
        if (human) continue; // the person driving the customer phone decides for themselves
        const r = rand(`${e.id}:${d.day}`);
        if (e.status === 'quoted') {
          const p = e.intent * (nudged ? 0.32 : 0.035);
          if (r < p) close(e, d, 'won', nudged ? 'Thanks for the reminder! Yes, let’s book it in.' : 'We’d like to go ahead please.');
          else if (r > 1 - (1 - e.intent) * 0.05) close(e, d, 'lost', 'Thanks, but we’ve gone with someone else.');
          else if (e.followUps.every((f) => f.status !== 'scheduled' && f.status !== 'awaiting') && d.day - (e.quote?.sentDay ?? d.day) > 20)
            close(e, d, 'lost', '(No reply. Quote closed after the last follow-up.)');
        } else if (e.status === 'ballpark' || e.status === 'visit_offered') {
          if (r < e.intent * 0.25) {
            e.depositPaid = true;
            e.status = 'visit_booked';
            e.messages.push(msg('system', `Site visit booked. ${aud(d.profile.siteVisitFee)} deposit paid by card.`, d.day));
          } else if (r > 0.93) close(e, d, 'lost', 'Thanks for the guide, that’s more than we were hoping to spend.');
        }
      }
    }
  });
}
