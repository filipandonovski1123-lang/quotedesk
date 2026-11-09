import type { User } from 'firebase/auth';
import { createContext, useContext } from 'react';
import type { PublicQuote, RealEnquiry, TradieProfile } from '../model';

export interface AppData {
  user: User;
  profile: TradieProfile;
  enquiries: RealEnquiry[];
  quotes: (PublicQuote & { token: string })[];
  now: number;
}

export const Ctx = createContext<AppData | null>(null);

export function useApp(): AppData {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside the tradie app');
  return v;
}

export const enquiryLink = (slug: string) => `${location.origin}${location.pathname}#/q/${slug}`;
