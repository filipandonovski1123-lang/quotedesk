import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { jobsFor } from '../lib/pricing';
import { auth, db } from './firebase';
import type { EnquiryForm, PublicPage, PublicQuote, RealEnquiry, TradieProfile } from './model';

// ---------- auth ----------

export const watchAuth = (cb: (u: User | null) => void) => onAuthStateChanged(auth, cb);
export const signIn = (email: string, password: string) => signInWithEmailAndPassword(auth, email.trim(), password);
export const signUp = (email: string, password: string) => createUserWithEmailAndPassword(auth, email.trim(), password);
export const signOut = () => fbSignOut(auth);
export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email.trim());

export function authMessage(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) return 'Email or password is incorrect.';
  if (code.includes('email-already-in-use')) return 'There’s already an account with that email. Try signing in.';
  if (code.includes('weak-password')) return 'Use a password of at least 8 characters.';
  if (code.includes('invalid-email')) return 'That email address doesn’t look right.';
  if (code.includes('too-many-requests')) return 'Too many tries. Wait a minute and try again.';
  if (code.includes('network')) return 'No connection. Check your internet and try again.';
  if (code.includes('requires-recent-login')) return 'For safety, enter your password again first.';
  return 'Something went wrong. Please try again.';
}

// ---------- tradie profile and public page ----------

const profileRef = (uid: string) => doc(db, 'tradies', uid);
const pageRef = (slug: string) => doc(db, 'pages', slug);

export function watchProfile(uid: string, cb: (p: TradieProfile | null) => void) {
  return onSnapshot(profileRef(uid), (s) => cb(s.exists() ? (s.data() as TradieProfile) : null));
}

export function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'tradie'
  );
}

export function pageFor(uid: string, p: TradieProfile): PublicPage {
  return {
    uid,
    business: p.business,
    owner: p.owner,
    jobs: jobsFor(p.trade, p.customJobs, p.hiddenJobs).map((j) => ({ id: j.id, label: j.label, questions: j.questions })),
  };
}

/** Creates the profile and claims a unique enquiry-link name (northside-decks, northside-decks-2, …). */
export async function createProfile(uid: string, p: Omit<TradieProfile, 'slug' | 'createdAt'>): Promise<string> {
  const base = slugify(p.business);
  for (let i = 1; i <= 30; i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    const ok = await runTransaction(db, async (tx) => {
      const existing = await tx.get(pageRef(slug));
      if (existing.exists()) return false;
      const full: TradieProfile = { ...p, slug, createdAt: Date.now() };
      tx.set(pageRef(slug), pageFor(uid, full));
      tx.set(profileRef(uid), full);
      return true;
    });
    if (ok) return slug;
  }
  throw new Error('Couldn’t find a free link name. Try a slightly different business name.');
}

export async function saveProfile(uid: string, p: TradieProfile) {
  const batch = writeBatch(db);
  batch.set(profileRef(uid), p);
  batch.set(pageRef(p.slug), pageFor(uid, p));
  await batch.commit();
}

export async function loadPage(slug: string): Promise<PublicPage | null> {
  const s = await getDoc(pageRef(slug));
  return s.exists() ? (s.data() as PublicPage) : null;
}

// ---------- enquiries ----------

const enquiries = (uid: string) => collection(db, 'tradies', uid, 'enquiries');

/** Customer side: sends an enquiry (and up to 4 compressed photos) to a tradie. No account needed. */
export async function submitEnquiry(uid: string, form: EnquiryForm, photos: string[]): Promise<void> {
  const ref = doc(enquiries(uid));
  await setDoc(ref, { ...form, photoCount: photos.length, status: 'new', createdAt: serverTimestamp(), log: [], followUps: [], depositPaid: false });
  await Promise.all(photos.slice(0, 4).map((data, i) => setDoc(doc(ref, 'photos', String(i)), { data })));
}

function toEnquiry(id: string, d: Record<string, unknown>): RealEnquiry {
  const created = d.createdAt instanceof Timestamp ? d.createdAt.toMillis() : Date.now();
  return { ...(d as unknown as RealEnquiry), id, createdMs: created };
}

export function watchEnquiries(uid: string, cb: (list: RealEnquiry[]) => void, onError: (e: unknown) => void) {
  return onSnapshot(
    query(enquiries(uid), orderBy('createdAt', 'desc')),
    (s) => cb(s.docs.map((d) => toEnquiry(d.id, d.data()))),
    onError,
  );
}

export async function loadPhotos(uid: string, id: string): Promise<string[]> {
  const s = await getDocs(collection(db, 'tradies', uid, 'enquiries', id, 'photos'));
  return s.docs.sort((a, b) => Number(a.id) - Number(b.id)).map((d) => String(d.data().data ?? ''));
}

export function updateEnquiry(uid: string, id: string, patch: Partial<RealEnquiry>) {
  const { id: _id, createdMs: _c, ...rest } = patch;
  void _id;
  void _c;
  return updateDoc(doc(enquiries(uid), id), rest as Record<string, unknown>);
}

// ---------- quotes customers can open and accept ----------

const quoteRef = (token: string) => doc(db, 'publicQuotes', token);

export function newToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(15));
  return Array.from(bytes, (b) => 'abcdefghijkmnopqrstuvwxyz23456789'[b % 33]).join('');
}

export async function publishQuote(token: string, q: PublicQuote) {
  await setDoc(quoteRef(token), q);
}

export function watchMyQuotes(uid: string, cb: (q: (PublicQuote & { token: string })[]) => void) {
  return onSnapshot(query(collection(db, 'publicQuotes'), where('uid', '==', uid)), (s) => cb(s.docs.map((d) => ({ ...(d.data() as PublicQuote), token: d.id }))));
}

export async function loadQuote(token: string): Promise<PublicQuote | null> {
  const s = await getDoc(quoteRef(token));
  return s.exists() ? (s.data() as PublicQuote) : null;
}

export function respondToQuote(token: string, status: 'accepted' | 'declined') {
  return updateDoc(quoteRef(token), { status });
}

// ---------- your data ----------

export async function exportEverything(uid: string) {
  const profile = (await getDoc(profileRef(uid))).data();
  const list = await getDocs(enquiries(uid));
  const quotes = await getDocs(query(collection(db, 'publicQuotes'), where('uid', '==', uid)));
  return {
    exportedAt: new Date().toISOString(),
    profile,
    enquiries: list.docs.map((d) => toEnquiry(d.id, d.data())),
    quotes: quotes.docs.map((d) => ({ token: d.id, ...d.data() })),
  };
}

/** Deletes every record of the tradie, then their login. Needs the password again for safety. */
export async function deleteEverything(user: User, password: string, slug: string) {
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email ?? '', password));
  const uid = user.uid;
  const list = await getDocs(enquiries(uid));
  for (const e of list.docs) {
    const photos = await getDocs(collection(e.ref, 'photos'));
    await Promise.all(photos.docs.map((p) => deleteDoc(p.ref)));
    await deleteDoc(e.ref);
  }
  const quotes = await getDocs(query(collection(db, 'publicQuotes'), where('uid', '==', uid)));
  await Promise.all(quotes.docs.map((q) => deleteDoc(q.ref)));
  if (slug) await deleteDoc(pageRef(slug)).catch(() => undefined);
  await deleteDoc(profileRef(uid));
  await deleteUser(user);
}
