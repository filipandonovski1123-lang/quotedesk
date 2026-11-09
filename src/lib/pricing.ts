import type { Answers, EnquiryInput, FitReason, OtherQuotes, Profile, Timing, TradeId } from './types';

/**
 * Price ranges. Every number here is a *starting* rate so a new tradie sees something sensible;
 * each tradie edits their own in Settings, and can add jobs of their own for any trade.
 */

export interface Question {
  id: string;
  label: string;
  type: 'number' | 'select' | 'boolean';
  unit?: string;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
  default: string | number | boolean;
}

export interface Rate {
  id: string;
  label: string;
  unit: '$' | '$/m²' | '$/m' | '%' | '$ each';
  default: number;
}

export type Rates = Record<string, number>;

export interface JobType {
  id: string;
  label: string;
  questions: Question[];
  rates: Rate[];
  /** Middle-of-the-range price in AUD, from the answers and this tradie's rates. */
  mid: (a: Answers, r: Rates) => number;
  /** How wide the range is either side of the middle (0.15 = ±15%). */
  spread: number;
  /** Hours a site visit plus writing the quote usually takes, travel included. */
  quoteHours: number;
}

export interface Trade {
  id: TradeId;
  label: string;
  business: string;
  owner: string;
  jobs: JobType[];
}

/** A job the tradie defines themselves: a base fee plus a price per unit. Works for any trade. */
export interface CustomJob {
  id: string;
  label: string;
  /** e.g. "m²", "rooms", "lights". Empty means a fixed-price job with no quantity question. */
  unit: string;
  base: number;
  perUnit: number;
  spread: number;
}

const num = (a: Answers, k: string) => Number(a[k] ?? 0) || 0;
const str = (a: Answers, k: string) => String(a[k] ?? '');
const pctOf = (r: Rates, k: string) => 1 + (r[k] ?? 0) / 100;

export const TRADES: Record<TradeId, Trade> = {
  decking: {
    id: 'decking',
    label: 'Decks and pergolas',
    business: 'Northside Decks',
    owner: 'Dave',
    jobs: [
      {
        id: 'new-deck',
        label: 'New deck',
        spread: 0.15,
        quoteHours: 2.5,
        questions: [
          { id: 'area', label: 'Rough size', type: 'number', unit: 'm²', min: 4, max: 200, default: 24 },
          {
            id: 'material',
            label: 'Timber or board',
            type: 'select',
            default: 'merbau',
            options: [
              { value: 'pine', label: 'Treated pine' },
              { value: 'merbau', label: 'Merbau / hardwood' },
              { value: 'composite', label: 'Composite' },
            ],
          },
          {
            id: 'height',
            label: 'Height off the ground',
            type: 'select',
            default: 'low',
            options: [
              { value: 'low', label: 'Low (under 1 m)' },
              { value: 'raised', label: 'Raised (over 1 m)' },
            ],
          },
          { id: 'stairs', label: 'Needs stairs', type: 'boolean', default: false },
          { id: 'removal', label: 'Old deck to remove', type: 'boolean', default: false },
        ],
        rates: [
          { id: 'pine', label: 'Treated pine', unit: '$/m²', default: 380 },
          { id: 'merbau', label: 'Merbau / hardwood', unit: '$/m²', default: 560 },
          { id: 'composite', label: 'Composite', unit: '$/m²', default: 660 },
          { id: 'raised', label: 'Extra for raised decks', unit: '%', default: 22 },
          { id: 'stairs', label: 'Stairs', unit: '$', default: 1400 },
          { id: 'removal', label: 'Removing an old deck', unit: '$/m²', default: 45 },
        ],
        mid: (a, r) => {
          let p = num(a, 'area') * (r[str(a, 'material')] ?? 500);
          if (str(a, 'height') === 'raised') p *= pctOf(r, 'raised');
          if (a.stairs) p += r.stairs ?? 0;
          if (a.removal) p += num(a, 'area') * (r.removal ?? 0);
          return p;
        },
      },
      {
        id: 'restore',
        label: 'Deck sand and re-oil',
        spread: 0.2,
        quoteHours: 1.5,
        questions: [
          { id: 'area', label: 'Rough size', type: 'number', unit: 'm²', min: 4, max: 200, default: 30 },
          {
            id: 'condition',
            label: 'Condition',
            type: 'select',
            default: 'weathered',
            options: [
              { value: 'good', label: 'Good, just tired' },
              { value: 'weathered', label: 'Grey and weathered' },
              { value: 'damaged', label: 'Some boards damaged' },
            ],
          },
        ],
        rates: [
          { id: 'good', label: 'Good condition', unit: '$/m²', default: 42 },
          { id: 'weathered', label: 'Weathered', unit: '$/m²', default: 58 },
          { id: 'damaged', label: 'Damaged boards', unit: '$/m²', default: 80 },
          { id: 'minimum', label: 'Minimum job', unit: '$', default: 650 },
        ],
        mid: (a, r) => Math.max(r.minimum ?? 0, num(a, 'area') * (r[str(a, 'condition')] ?? 55)),
      },
    ],
  },
  painting: {
    id: 'painting',
    label: 'Painting',
    business: 'Brightline Painting',
    owner: 'Maria',
    jobs: [
      {
        id: 'interior',
        label: 'Interior painting',
        spread: 0.18,
        quoteHours: 1.5,
        questions: [
          { id: 'rooms', label: 'Rooms', type: 'number', min: 1, max: 20, default: 4 },
          { id: 'ceilings', label: 'Ceilings too', type: 'boolean', default: true },
          {
            id: 'prep',
            label: 'Wall condition',
            type: 'select',
            default: 'some',
            options: [
              { value: 'good', label: 'Good' },
              { value: 'some', label: 'A few marks and holes' },
              { value: 'lots', label: 'Lots of patching' },
            ],
          },
        ],
        rates: [
          { id: 'room', label: 'Per room (walls)', unit: '$ each', default: 680 },
          { id: 'ceilings', label: 'Extra for ceilings', unit: '%', default: 30 },
          { id: 'some', label: 'Extra for some patching', unit: '%', default: 10 },
          { id: 'lots', label: 'Extra for lots of patching', unit: '%', default: 30 },
        ],
        mid: (a, r) => {
          let p = num(a, 'rooms') * (r.room ?? 0);
          if (a.ceilings) p *= pctOf(r, 'ceilings');
          const prep = str(a, 'prep');
          if (prep === 'some' || prep === 'lots') p *= pctOf(r, prep);
          return p;
        },
      },
      {
        id: 'exterior',
        label: 'Exterior house paint',
        spread: 0.2,
        quoteHours: 2,
        questions: [
          {
            id: 'size',
            label: 'House size',
            type: 'select',
            default: 'medium',
            options: [
              { value: 'small', label: 'Small (2 bed)' },
              { value: 'medium', label: 'Medium (3–4 bed)' },
              { value: 'large', label: 'Large (5+ bed)' },
            ],
          },
          { id: 'storeys', label: 'Two storeys', type: 'boolean', default: false },
        ],
        rates: [
          { id: 'small', label: 'Small house', unit: '$', default: 6500 },
          { id: 'medium', label: 'Medium house', unit: '$', default: 10500 },
          { id: 'large', label: 'Large house', unit: '$', default: 15500 },
          { id: 'storeys', label: 'Extra for two storeys', unit: '%', default: 28 },
        ],
        mid: (a, r) => {
          let p = r[str(a, 'size')] ?? 10500;
          if (a.storeys) p *= pctOf(r, 'storeys');
          return p;
        },
      },
    ],
  },
  landscaping: {
    id: 'landscaping',
    label: 'Landscaping',
    business: 'GreenEdge Landscapes',
    owner: 'Sam',
    jobs: [
      {
        id: 'retaining',
        label: 'Retaining wall',
        spread: 0.2,
        quoteHours: 2.5,
        questions: [
          { id: 'length', label: 'Length', type: 'number', unit: 'm', min: 2, max: 100, default: 12 },
          {
            id: 'height',
            label: 'Height',
            type: 'select',
            default: 'h06',
            options: [
              { value: 'h06', label: 'Up to 0.6 m' },
              { value: 'h10', label: 'Up to 1 m' },
              { value: 'h15', label: 'Up to 1.5 m' },
            ],
          },
        ],
        rates: [
          { id: 'h06', label: 'Up to 0.6 m high', unit: '$/m', default: 480 },
          { id: 'h10', label: 'Up to 1 m high', unit: '$/m', default: 740 },
          { id: 'h15', label: 'Up to 1.5 m high', unit: '$/m', default: 1150 },
        ],
        mid: (a, r) => num(a, 'length') * (r[str(a, 'height')] ?? 600),
      },
      {
        id: 'turf',
        label: 'New turf',
        spread: 0.15,
        quoteHours: 1.5,
        questions: [
          { id: 'area', label: 'Area', type: 'number', unit: 'm²', min: 10, max: 1000, default: 80 },
          { id: 'levelling', label: 'Needs levelling and soil', type: 'boolean', default: true },
        ],
        rates: [
          { id: 'laid', label: 'Turf laid', unit: '$/m²', default: 30 },
          { id: 'levelled', label: 'Turf with levelling and soil', unit: '$/m²', default: 48 },
          { id: 'minimum', label: 'Minimum job', unit: '$', default: 900 },
        ],
        mid: (a, r) => Math.max(r.minimum ?? 0, num(a, 'area') * ((a.levelling ? r.levelled : r.laid) ?? 40)),
      },
    ],
  },
  electrical: {
    id: 'electrical',
    label: 'Electrical',
    business: 'Spark Point Electrical',
    owner: 'Chris',
    jobs: [
      {
        id: 'lights',
        label: 'LED downlights',
        spread: 0.15,
        quoteHours: 1.5,
        questions: [
          { id: 'count', label: 'How many lights', type: 'number', min: 1, max: 80, default: 12 },
          { id: 'dimmers', label: 'Dimmers', type: 'boolean', default: false },
        ],
        rates: [
          { id: 'callout', label: 'Call-out', unit: '$', default: 180 },
          { id: 'light', label: 'Per light', unit: '$ each', default: 135 },
          { id: 'dimmers', label: 'Dimmers', unit: '$', default: 240 },
        ],
        mid: (a, r) => (r.callout ?? 0) + num(a, 'count') * (r.light ?? 0) + (a.dimmers ? (r.dimmers ?? 0) : 0),
      },
      {
        id: 'switchboard',
        label: 'Switchboard upgrade',
        spread: 0.18,
        quoteHours: 2,
        questions: [
          {
            id: 'age',
            label: 'Current board',
            type: 'select',
            default: 'old',
            options: [
              { value: 'old', label: 'Old fuses' },
              { value: 'partial', label: 'Some safety switches' },
            ],
          },
          { id: 'ev', label: 'Add an EV charger too', type: 'boolean', default: false },
        ],
        rates: [
          { id: 'old', label: 'Replacing old fuses', unit: '$', default: 2400 },
          { id: 'partial', label: 'Upgrading a partial board', unit: '$', default: 1800 },
          { id: 'ev', label: 'EV charger install', unit: '$', default: 1650 },
        ],
        mid: (a, r) => (r[str(a, 'age')] ?? 2000) + (a.ev ? (r.ev ?? 0) : 0),
      },
    ],
  },
  other: {
    id: 'other',
    label: 'Another trade (set up your own jobs)',
    business: 'Your Business',
    owner: 'You',
    jobs: [],
  },
};

/** Turns a tradie-defined job into the same shape as the built-in ones. */
export function customToJob(c: CustomJob): JobType {
  return {
    id: c.id,
    label: c.label,
    spread: c.spread,
    quoteHours: 1.5,
    questions: c.unit ? [{ id: 'qty', label: `How many ${c.unit}`, type: 'number', min: 1, max: 100000, default: 1 }] : [],
    rates: [
      { id: 'base', label: 'Base / call-out', unit: '$', default: c.base },
      { id: 'perUnit', label: c.unit ? `Per ${c.unit}` : 'Per unit', unit: '$ each', default: c.perUnit },
    ],
    mid: (a) => c.base + (c.unit ? num(a, 'qty') * c.perUnit : 0),
  };
}

/** All jobs a tradie offers: their trade's built-in ones (minus any they switched off) plus their own. */
export function jobsFor(trade: TradeId, custom: CustomJob[] = [], hidden: string[] = []): JobType[] {
  return [...TRADES[trade].jobs.filter((j) => !hidden.includes(j.id)), ...custom.map(customToJob)];
}

export function ratesFor(job: JobType, overrides: Record<string, Rates> = {}): Rates {
  return { ...Object.fromEntries(job.rates.map((r) => [r.id, r.default])), ...(overrides[job.id] ?? {}) };
}

export function jobOf(trade: TradeId, jobId: string, custom: CustomJob[] = []): JobType {
  const all = jobsFor(trade, custom);
  return all.find((j) => j.id === jobId) ?? all[0] ?? customToJob({ id: 'general', label: 'General job', unit: '', base: 0, perUnit: 0, spread: 0.3 });
}

export function defaultAnswers(job: JobType): Answers {
  return Object.fromEntries(job.questions.map((q) => [q.id, q.default]));
}

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

/** A price range for one job, or null when the tradie hasn't priced it (e.g. a custom job at $0). */
export function rangeFor(job: JobType, answers: Answers, rates: Rates, multiplier = 1): { low: number; high: number } | null {
  const mid = job.mid(answers, rates) * multiplier;
  if (!(mid > 0)) return null;
  const step = mid > 5000 ? 500 : mid > 1000 ? 100 : 10;
  return { low: Math.max(step, roundTo(mid * (1 - job.spread), step)), high: roundTo(mid * (1 + job.spread), step) };
}

/** Demo helper: the demo tradie uses default rates scaled by one multiplier. */
export function estimate(profile: Profile, jobId: string, answers: Answers, materialIndex = 100): { low: number; high: number } {
  const job = jobOf(profile.trade, jobId);
  return rangeFor(job, answers, ratesFor(job), profile.rateMultiplier * (materialIndex / 100)) ?? { low: 0, high: 0 };
}

export interface FitInput {
  /** null when we can't tell (no service area set). */
  area: { ok: boolean; label: string } | null;
  photos: number;
  timing: Timing;
  budget: number | null;
  otherQuotes: OtherQuotes;
  notes: string;
}

/** A 0–100 score for how likely this enquiry is to become a worthwhile job, with plain reasons. */
export function fitScore(est: { low: number; high: number } | null, e: FitInput): { score: number; reasons: FitReason[] } {
  const reasons: FitReason[] = [];
  let score = 50;
  const add = (pts: number, text: string) => {
    score += pts;
    reasons.push({ good: pts >= 0, text, ...(pts === 0 ? { neutral: true } : {}) });
  };

  if (e.photos >= 2) add(10, `Sent ${e.photos} photos`);
  else if (e.photos === 1) add(3, 'Sent 1 photo');
  else add(-10, 'No photos');

  if (e.timing === 'asap') add(12, 'Wants it done soon');
  else if (e.timing === 'month') add(8, 'Wants it within a month or two');
  else if (e.timing === 'browsing') add(-22, 'Just getting prices for now');

  if (e.budget === null) add(-5, 'No budget given');
  else if (!est) add(0, `Budget about $${Math.round(e.budget).toLocaleString('en-AU')}`);
  else if (e.budget >= est.low) add(15, 'Budget covers the estimate');
  else if (e.budget >= est.low * 0.75) add(-4, 'Budget a little under the estimate');
  else add(-22, 'Budget well under the estimate');

  if (e.area) add(e.area.ok ? 6 : -16, e.area.label);

  if (e.otherQuotes === 'none') add(10, 'Not getting other quotes');
  else if (e.otherQuotes === 'several') add(-10, 'Getting several quotes');

  if (e.notes.trim().length >= 20) add(4, 'Gave useful detail');

  return { score: Math.max(0, Math.min(100, Math.round(score))), reasons };
}

export function fitLabel(score: number): { label: string; tone: 'good' | 'mid' | 'bad' } {
  if (score >= 70) return { label: 'Strong fit', tone: 'good' };
  if (score >= 40) return { label: 'Maybe', tone: 'mid' };
  return { label: 'Unlikely', tone: 'bad' };
}

export type Suggestion = 'visit' | 'ballpark' | 'decline';

export function suggestAction(score: number): Suggestion {
  if (score >= 70) return 'visit';
  if (score >= 35) return 'ballpark';
  return 'decline';
}

// ---------- service area ----------

/** Parses "2070-2125, 2150, 2000" into ranges. */
export function parsePostcodes(text: string): [number, number][] {
  return text
    .split(/[,\s]+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const [a, b] = p.split('-').map((x) => Number(x));
      return [a ?? NaN, b ?? a ?? NaN] as [number, number];
    })
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
}

export function inArea(postcode: string, areas: string): { ok: boolean; label: string } | null {
  const ranges = parsePostcodes(areas);
  const pc = Number(postcode);
  if (!ranges.length || !Number.isFinite(pc) || !postcode.trim()) return null;
  const ok = ranges.some(([a, b]) => pc >= Math.min(a, b) && pc <= Math.max(a, b));
  return { ok, label: ok ? `In your area (${postcode})` : `Outside your area (${postcode})` };
}

// ---------- demo-only service area ----------

/** Demo service area: suburb names with a made-up distance from the tradie's base. */
export const SUBURBS: { name: string; km: number }[] = [
  { name: 'Hornsby', km: 4 },
  { name: 'Epping', km: 9 },
  { name: 'Castle Hill', km: 14 },
  { name: 'Chatswood', km: 16 },
  { name: 'Ryde', km: 18 },
  { name: 'Parramatta', km: 22 },
  { name: 'Manly', km: 31 },
  { name: 'Penrith', km: 52 },
];

export function inputFit(profile: Profile, input: EnquiryInput, materialIndex: number) {
  const est = estimate(profile, input.jobType, input.answers, materialIndex);
  const km = SUBURBS.find((s) => s.name === input.suburb)?.km ?? 20;
  const area = { ok: km <= profile.radiusKm, label: km <= profile.radiusKm ? `In your area (${km} km)` : `Outside your area (${km} km)` };
  return { est, km, fit: fitScore(est, { ...input, area }) };
}

export const aud = (n: number) => '$' + Math.round(n).toLocaleString('en-AU');
export const range = (r: { low: number; high: number } | null) => (r ? `${aud(r.low)}–${aud(r.high)}` : 'Price after a look');
