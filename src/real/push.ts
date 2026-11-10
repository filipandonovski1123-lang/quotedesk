import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { deleteToken, getMessaging, getToken, isSupported } from 'firebase/messaging';
import { app, db } from './firebase';

/** Public Web Push key from Firebase (Project settings → Cloud Messaging). Empty until it's set up. */
export const VAPID_KEY = '';

export type PushState = 'unsupported' | 'needs-install' | 'off' | 'on' | 'blocked' | 'not-ready';

const isIos = () => /iPhone|iPad|iPod/.test(navigator.userAgent);
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;

export async function pushState(): Promise<PushState> {
  if (!VAPID_KEY) return 'not-ready';
  if (isIos() && !isStandalone()) return 'needs-install';
  if (!(await isSupported().catch(() => false)) || typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission === 'denied') return 'blocked';
  return Notification.permission === 'granted' && localStorage.getItem('qd-push') ? 'on' : 'off';
}

async function registration() {
  return navigator.serviceWorker.register('./sw.js', { scope: './' });
}

const deviceId = async (token: string) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(buf).slice(0, 12), (b) => b.toString(16).padStart(2, '0')).join('');
};

/** Asks for permission, then saves this device so the server can send it alerts. */
export async function enablePush(uid: string): Promise<PushState> {
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return perm === 'denied' ? 'blocked' : 'off';
  const token = await getToken(getMessaging(app), { vapidKey: VAPID_KEY, serviceWorkerRegistration: await registration() });
  await setDoc(doc(db, 'tradies', uid, 'devices', await deviceId(token)), { token, createdAt: Date.now(), device: navigator.userAgent.slice(0, 200) });
  try {
    localStorage.setItem('qd-push', '1');
  } catch {
    /* only used to show the switch as on */
  }
  return 'on';
}

export async function disablePush(uid: string): Promise<PushState> {
  try {
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: await registration() });
    await deleteDoc(doc(db, 'tradies', uid, 'devices', await deviceId(token)));
    await deleteToken(messaging);
  } finally {
    try {
      localStorage.removeItem('qd-push');
    } catch {
      /* ignore */
    }
  }
  return 'off';
}

/** Keeps this device's token fresh (tokens can rotate). Safe to call on every app start. */
export async function refreshPush(uid: string) {
  if ((await pushState()) !== 'on') return;
  const token = await getToken(getMessaging(app), { vapidKey: VAPID_KEY, serviceWorkerRegistration: await registration() }).catch(() => null);
  if (token) await setDoc(doc(db, 'tradies', uid, 'devices', await deviceId(token)), { token, createdAt: Date.now(), device: navigator.userAgent.slice(0, 200) });
}
