import type { Answers, EnquiryInput, FitReason, OtherQuotes, Profile, Timing, TradeId } from './types';

/**
 * Example rates so the prototype has something to show. They are rough illustrations, not real
 * market prices: in the product each tradie sets their own (here, via the rate multiplier).
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

export interface JobType {
  id: string;
  label: string;
  questions: Question[];
  /** Middle-of-the-range price in AUD, before the tradie's rate multiplier. */
  mid: (a: Answers) => number;
  /** How wide the ballpark is either side of the middle (0.15 = ±15%). */
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

const num = (a: Answers, k: string) => Number(a[k] ?? 0) || 0;
const str = (a: Answers, k: string) => String(a[k] ?? '');

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
        mid: (a) => {
          const rate = { pine: 380, merbau: 560, composite: 660 }[str(a, 'material')] ?? 500;
          let p = num(a, 'area') * rate;
          if (str(a, 'height') === 'raised') p *= 1.22;
          if (a.stairs) p += 1400;
          if (a.removal) p += num(a, 'area') * 45;
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
        mid: (a) => {
          const rate = { good: 42, weathered: 58, damaged: 80 }[str(a, 'condition')] ?? 55;
          return Math.max(650, num(a, 'area') * rate);
        },
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
        mid: (a) => {
          let p = num(a, 'rooms') * 680;
          if (a.ceilings) p *= 1.3;
          p *= { good: 1, some: 1.1, lots: 1.3 }[str(a, 'prep')] ?? 1.1;
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
        mid: (a) => {
          let p = { small: 6500, medium: 10500, large: 15500 }[str(a, 'size')] ?? 10500;
          if (a.storeys) p *= 1.28;
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
            default: '0.6',
            options: [
              { value: '0.6', label: 'Up to 0.6 m' },
              { value: '1.0', label: 'Up to 1 m' },
              { value: '1.5', label: 'Up to 1.5 m' },
            ],
          },
        ],
        mid: (a) => num(a, 'length') * ({ '0.6': 480, '1.0': 740, '1.5': 1150 }[str(a, 'height')] ?? 600),
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
        mid: (a) => Math.max(900, num(a, 'area') * (a.levelling ? 48 : 30)),
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
        mid: (a) => 180 + num(a, 'count') * 135 + (a.dimmers ? 240 : 0),
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
        mid: (a) => (str(a, 'age') === 'old' ? 2400 : 1800) + (a.ev ? 1650 : 0),
      },
    ],
  },
};

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

export function jobOf(trade: TradeId, jobId: string): JobType {
  const t = TRADES[trade];
  return t.jobs.find((j) => j.id === jobId) ?? t.jobs[0]!;
}

export function defaultAnswers(job: JobType): Answers {
  return Object.fromEntries(job.questions.map((q) => [q.id, q.default]));
}

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

export function estimate(profile: Profile, jobId: string, answers: Answers, materialIndex = 100): { low: number; high: number } {
  const job = jobOf(profile.trade, jobId);
  const mid = job.mid(answers) * profile.rateMultiplier * (materialIndex / 100);
  const step = mid > 5000 ? 500 : 100;
  return { low: roundTo(mid * (1 - job.spread), step), high: roundTo(mid * (1 + job.spread), step) };
}

export interface FitInput {
  km: number;
  photos: number;
  timing: Timing;
  budget: number | null;
  otherQuotes: OtherQuotes;
  notes: string;
}

/** A 0–100 score for how likely this enquiry is to become a worthwhile job, with plain reasons. */
export function fitScore(profile: Profile, est: { low: number; high: number }, e: FitInput): { score: number; reasons: FitReason[] } {
  const reasons: FitReason[] = [];
  let score = 50;
  const add = (pts: number, text: string) => {
    score += pts;
    reasons.push({ good: pts >= 0, text });
  };

  if (e.photos >= 2) add(10, `Sent ${e.photos} photos`);
  else if (e.photos === 1) add(3, 'Sent 1 photo');
  else add(-10, 'No photos');

  if (e.timing === 'asap') add(12, 'Wants it done soon');
  else if (e.timing === 'month') add(8, 'Wants it within a month or two');
  else if (e.timing === 'browsing') add(-22, 'Just getting prices for now');

  if (e.budget === null) add(-5, 'No budget given');
  else if (e.budget >= est.low) add(15, 'Budget covers the estimate');
  else if (e.budget >= est.low * 0.75) add(-4, 'Budget a little under the estimate');
  else add(-22, 'Budget well under the estimate');

  if (e.km <= profile.radiusKm) add(6, `In your area (${e.km} km)`);
  else add(-16, `Outside your area (${e.km} km)`);

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

export function inputFit(profile: Profile, input: EnquiryInput, materialIndex: number) {
  const est = estimate(profile, input.jobType, input.answers, materialIndex);
  const km = SUBURBS.find((s) => s.name === input.suburb)?.km ?? 20;
  return { est, km, fit: fitScore(profile, est, { ...input, km }) };
}

export const aud = (n: number) => '$' + Math.round(n).toLocaleString('en-AU');
export const range = (r: { low: number; high: number }) => `${aud(r.low)}–${aud(r.high)}`;
