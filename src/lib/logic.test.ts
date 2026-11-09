import { describe, expect, it } from 'vitest';
import { bizMonth, customersFor, tradieValue } from './economics';
import { defaultAnswers, estimate, fitScore, TRADES } from './pricing';
import { initialState } from './store';

const profile = initialState('decking').profile;

describe('pricing', () => {
  it('gives a sensible range for a default deck', () => {
    const job = TRADES.decking.jobs[0]!;
    const r = estimate(profile, job.id, defaultAnswers(job));
    expect(r.low).toBeGreaterThan(8000);
    expect(r.high).toBeGreaterThan(r.low);
  });

  it('scores a serious local customer above a far-away browser', () => {
    const est = { low: 10000, high: 14000 };
    const good = fitScore(profile, est, { km: 4, photos: 3, timing: 'asap', budget: 15000, otherQuotes: 'none', notes: 'Before Christmas please, side access.' });
    const poor = fitScore(profile, est, { km: 52, photos: 0, timing: 'browsing', budget: 4000, otherQuotes: 'several', notes: '' });
    expect(good.score).toBeGreaterThanOrEqual(70);
    expect(poor.score).toBeLessThan(35);
  });
});

describe('economics', () => {
  const base = { price: 65, customers: 150, churn: 0.04, textsPerCustomer: 250, textCost: 0.06, aiCost: 2, paymentFee: 0.02, fixedCosts: 400 };

  it('works out monthly profit', () => {
    const m = bizMonth(base);
    expect(m.revenue).toBe(9750);
    expect(m.profit).toBeCloseTo(9750 - 150 * (15 + 2 + 1.3) - 400);
  });

  it('finds customers needed to cover costs', () => {
    expect(customersFor(0, base)).toBe(Math.ceil(400 / (65 - 18.3)));
  });

  it('values a tradie’s month', () => {
    const v = tradieValue({ enquiries: 20, screenedShare: 0.5, visitHours: 2, hourValue: 100, extraJobs: 1, avgJob: 5000, margin: 0.2, planPrice: 50 });
    expect(v.total).toBe(2000 + 1000);
    expect(v.multiple).toBe(60);
  });
});
