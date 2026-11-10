import type { CustomJob, Question, Rates } from '../lib/pricing';
import type { Answers, OtherQuotes, Timing, TradeId } from '../lib/types';

/** The tradie's private settings: tradies/{uid}. */
export interface TradieProfile {
  owner: string;
  business: string;
  phone: string;
  trade: TradeId;
  slug: string;
  rates: Record<string, Rates>;
  customJobs: CustomJob[];
  hiddenJobs: string[];
  /** Postcodes they cover, e.g. "2070-2125, 2150". */
  areas: string;
  visitFee: number;
  /** Where customers pay deposits: a Stripe/Square payment link, or PayID/bank details as text. */
  paymentLink: string;
  /** Shown on quotes so customers can check the business is real. Optional. */
  abn?: string;
  licence?: string;
  tone: 'casual' | 'professional';
  followUpDays: [number, number, number];
  quoteValidDays: number;
  createdAt: number;
}

/** What the public enquiry form needs, and nothing more: pages/{slug}. No rates, no phone. */
export interface PublicPage {
  uid: string;
  business: string;
  owner: string;
  /** The tradie's mobile, so customers can tap to text "I've sent my details". */
  phone?: string;
  jobs: { id: string; label: string; questions: Question[] }[];
}

export type RealStatus = 'new' | 'ballpark' | 'visit_offered' | 'visit_booked' | 'quoted' | 'won' | 'lost' | 'declined';

export interface LogEntry {
  at: number;
  text: string;
  kind: 'ballpark' | 'visit' | 'decline' | 'quote' | 'followup' | 'note' | 'status';
}

export interface RealFollowUp {
  n: 1 | 2 | 3;
  dueAt: number;
  status: 'scheduled' | 'sent' | 'skipped' | 'cancelled';
  sentAt?: number;
}

/** What a customer submits. Kept small and checked by the database rules. */
export interface EnquiryForm {
  name: string;
  phone: string;
  postcode: string;
  jobType: string;
  jobLabel: string;
  answers: Answers;
  photoCount: number;
  timing: Timing;
  budget: number | null;
  otherQuotes: OtherQuotes;
  notes: string;
}

/** tradies/{uid}/enquiries/{id} */
export interface RealEnquiry extends EnquiryForm {
  id: string;
  status: RealStatus;
  /** Milliseconds; set from the server time when the customer submits. */
  createdMs: number;
  log: LogEntry[];
  quote?: { amount: number; sentAt: number; token: string; validUntil: number };
  followUps: RealFollowUp[];
  depositPaid: boolean;
  wonValue?: number;
  wonAfterFollowUp?: boolean;
  closedAt?: number;
  /** Set once the tradie has opened it. */
  seenAt?: number;
}

/** publicQuotes/{token}: the page a customer opens to see and accept a quote. */
export interface PublicQuote {
  uid: string;
  enquiryId: string;
  business: string;
  owner: string;
  phone: string;
  customerFirst: string;
  jobLabel: string;
  amount: number;
  validUntil: number;
  paymentLink: string;
  /** What's included, exclusions, timing: shown under the price. */
  notes?: string;
  abn?: string;
  licence?: string;
  status: 'open' | 'accepted' | 'declined';
  createdAt: number;
}
