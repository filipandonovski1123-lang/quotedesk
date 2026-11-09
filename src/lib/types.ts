export type TradeId = 'decking' | 'painting' | 'landscaping' | 'electrical';
export type Answers = Record<string, string | number | boolean>;

export type Timing = 'asap' | 'month' | 'flexible' | 'browsing';
export type OtherQuotes = 'none' | 'one' | 'several' | 'unsure';

export type Status =
  | 'new' // waiting for the tradie to pick an action
  | 'ballpark' // rough range sent, customer can book a paid visit
  | 'visit_offered' // paid site visit offered
  | 'visit_booked' // deposit paid, tradie needs to visit and send a quote
  | 'quoted' // exact quote sent, follow-ups running
  | 'won'
  | 'lost'
  | 'declined';

export interface Msg {
  id: string;
  from: 'tradie' | 'customer' | 'system';
  text: string;
  day: number;
  /** Who wrote it: drafted by the assistant and sent automatically, or approved by the tradie. */
  auto?: boolean;
}

export interface FollowUp {
  n: 1 | 2 | 3;
  dueDay: number;
  status: 'scheduled' | 'awaiting' | 'sent' | 'cancelled';
  text: string;
}

export interface FitReason {
  good: boolean;
  text: string;
}

export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  suburb: string;
  km: number;
  jobType: string;
  answers: Answers;
  photos: number;
  timing: Timing;
  budget: number | null;
  otherQuotes: OtherQuotes;
  notes: string;
  createdDay: number;
  status: Status;
  estimate: { low: number; high: number };
  fit: { score: number; reasons: FitReason[] };
  messages: Msg[];
  quote?: { amount: number; sentDay: number; materialIndex: number };
  followUps: FollowUp[];
  depositPaid: boolean;
  wonValue?: number;
  wonAfterFollowUp?: boolean;
  closedDay?: number;
  /** Hidden, simulation only: how likely this customer is to go ahead (0–1). */
  intent: number;
}

export interface Profile {
  owner: string;
  business: string;
  trade: TradeId;
  suburb: string;
  radiusKm: number;
  siteVisitFee: number;
  tone: 'casual' | 'professional';
  autoSend: boolean;
  /** Scales the built-in example rates to the tradie's own prices. */
  rateMultiplier: number;
}

export interface State {
  version: 1;
  profile: Profile;
  day: number;
  materialIndex: number;
  enquiries: Enquiry[];
  /** The enquiry the "customer phone" in the demo is looking at. */
  customerEnquiryId: string | null;
}

export interface EnquiryInput {
  name: string;
  phone: string;
  suburb: string;
  jobType: string;
  answers: Answers;
  photos: number;
  timing: Timing;
  budget: number | null;
  otherQuotes: OtherQuotes;
  notes: string;
}
