import type { User } from 'firebase/auth';
import { Ctx, type AppData } from './app/ctx';
import type { PublicQuote, RealEnquiry, TradieProfile } from './model';
import QuotePage from './QuotePage';
import { TradieMain } from './TradieApp';

/**
 * Development only (#/dev-app, #/dev-quote): the signed-in screens with made-up data,
 * so layouts can be checked at every screen size without an account. Never shipped.
 */
const now = Date.now();
const H = 3_600_000;
const D = 24 * H;

const profile: TradieProfile = {
  owner: 'Sam',
  business: 'Example Decks & Pergolas',
  phone: '0400 000 000',
  trade: 'decking',
  slug: 'example-decks',
  rates: {},
  customJobs: [],
  hiddenJobs: [],
  areas: '2000-2200',
  visitFee: 99,
  paymentLink: '',
  abn: '12 345 678 901',
  licence: '123456C',
  tone: 'casual',
  followUpDays: [2, 7, 14],
  quoteValidDays: 30,
  createdAt: now - 30 * D,
};

const base = { answers: {}, photoCount: 0, budget: null, otherQuotes: 'one' as const, log: [], followUps: [], depositPaid: false, jobType: 'new_deck' };
const enquiries: RealEnquiry[] = [
  { ...base, id: 'a', name: 'Alex Taylor', phone: '0400 111 111', postcode: '2155', jobLabel: 'New deck', timing: 'asap', notes: 'Back deck about 5 x 4 m, off the kitchen. Would like hardwood.', status: 'new', createdMs: now - 2 * H, budget: 15000 },
  { ...base, id: 'b', name: 'Jordan Lee', phone: '0400 222 222', postcode: '2120', jobLabel: 'Deck repair', timing: 'month', notes: 'A few boards are soft near the stairs.', status: 'new', createdMs: now - 5 * H },
  { ...base, id: 'c', name: 'Casey Ng', phone: '0400 333 333', postcode: '2770', jobLabel: 'Pergola', timing: 'browsing', notes: '', status: 'new', createdMs: now - 26 * H, otherQuotes: 'several' },
  { ...base, id: 'd', name: 'Morgan Smith', phone: '0400 444 444', postcode: '2153', jobLabel: 'New deck', timing: 'flexible', notes: 'Visit done Tuesday.', status: 'visit_booked', createdMs: now - 4 * D, depositPaid: true },
  {
    ...base,
    id: 'e',
    name: 'Riley Brown',
    phone: '0400 555 555',
    postcode: '2118',
    jobLabel: 'Deck sand and re-oil',
    timing: 'month',
    notes: '',
    status: 'quoted',
    createdMs: now - 9 * D,
    quote: { amount: 2400, sentAt: now - 3 * D, token: 'abcde12345', validUntil: now + 27 * D },
    followUps: [
      { n: 1, dueAt: now - D, status: 'scheduled' },
      { n: 2, dueAt: now + 4 * D, status: 'scheduled' },
      { n: 3, dueAt: now + 11 * D, status: 'scheduled' },
    ],
  },
  { ...base, id: 'f', name: 'Jamie Wood', phone: '0400 666 666', postcode: '2154', jobLabel: 'New deck', timing: 'asap', notes: '', status: 'won', createdMs: now - 20 * D, wonValue: 14200, wonAfterFollowUp: true, closedAt: now - 5 * D },
];

const data: AppData = { user: { uid: 'dev-preview' } as User, profile, enquiries, quotes: [], now };

const quote: PublicQuote = {
  uid: 'dev-preview',
  enquiryId: 'e',
  business: profile.business,
  owner: profile.owner,
  phone: profile.phone,
  customerFirst: 'Riley',
  jobLabel: 'Deck sand and re-oil',
  amount: 2400,
  validUntil: now + 27 * D,
  paymentLink: '',
  notes: 'Sand back the full deck\nTwo coats of decking oil\nReplace 3 damaged boards\nAll materials and clean-up',
  abn: profile.abn,
  licence: profile.licence,
  status: 'open',
  createdAt: now - 3 * D,
};

export default function DevPreview({ page, arg }: { page: 'app' | 'quote'; arg?: string }) {
  if (page === 'quote') return <QuotePage token="abcde12345" preview={quote} />;
  return (
    <Ctx.Provider value={data}>
      <TradieMain start={arg && arg.length > 1 ? { tab: arg as 'results' } : { open: arg }} />
    </Ctx.Provider>
  );
}
