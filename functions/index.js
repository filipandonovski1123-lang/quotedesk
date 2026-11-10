// Server-side alerts for QuoteDesk. These run on Firebase Cloud Functions and send push
// notifications to the tradie's phones and computers, even when the app is closed.
// Nothing here texts or emails customers.

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';

initializeApp();
const db = getFirestore();

// The database lives in nam5 (US), so the triggers run next to it. Keep the bill tiny.
setGlobalOptions({ region: 'us-central1', maxInstances: 3, memory: '256MiB' });

const APP_URL = 'https://filipandonovski1123-lang.github.io/quotedesk/#/app';
const aud = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('en-AU');

/** Sends one alert to every device the tradie turned alerts on for, and forgets dead devices. */
async function alertTradie(uid, title, body, tag) {
  const devices = await db.collection('tradies').doc(uid).collection('devices').get();
  if (devices.empty) return 0;
  const tokens = devices.docs.map((d) => d.get('token')).filter(Boolean);
  if (!tokens.length) return 0;
  const res = await getMessaging().sendEachForMulticast({
    tokens,
    webpush: {
      notification: { title, body, tag },
      fcmOptions: { link: APP_URL },
    },
    data: { title, body, link: APP_URL, tag },
  });
  const dead = [];
  res.responses.forEach((r, i) => {
    const code = r.error?.code ?? '';
    if (code.includes('registration-token-not-registered') || code.includes('invalid-argument') || code.includes('invalid-registration-token')) dead.push(tokens[i]);
  });
  await Promise.all(devices.docs.filter((d) => dead.includes(d.get('token'))).map((d) => d.ref.delete()));
  return res.successCount;
}

/** A customer sent an enquiry through the tradie's link. */
export const onEnquiry = onDocumentCreated('tradies/{uid}/enquiries/{id}', async (event) => {
  const e = event.data?.data();
  if (!e) return;
  const photos = e.photoCount ? ` · ${e.photoCount} photo${e.photoCount === 1 ? '' : 's'}` : '';
  await alertTradie(event.params.uid, `New enquiry from ${e.name}`, `${e.jobLabel} · ${e.postcode}${photos}`, `enq-${event.params.id}`);
});

/** A customer accepted or declined a quote on its page. */
export const onQuoteAnswer = onDocumentUpdated('publicQuotes/{token}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after || before.status === after.status || before.status !== 'open') return;
  if (after.status === 'accepted') await alertTradie(after.uid, `Quote accepted: ${aud(after.amount)}`, `${after.customerFirst} said yes to the ${after.jobLabel.toLowerCase()}. Time to lock in a start date.`, `quote-${event.params.token}`);
  else if (after.status === 'declined') await alertTradie(after.uid, `Quote declined`, `${after.customerFirst} isn't going ahead with the ${after.jobLabel.toLowerCase()}.`, `quote-${event.params.token}`);
});

/** Every morning: what needs doing today. Silent when there's nothing to do. */
export const morningSummary = onSchedule({ schedule: 'every day 07:00', timeZone: 'Australia/Sydney' }, async () => {
  const devices = await db.collectionGroup('devices').get();
  const uids = [...new Set(devices.docs.map((d) => d.ref.parent.parent?.id).filter(Boolean))];
  const now = Date.now();
  for (const uid of uids) {
    const open = await db.collection('tradies').doc(uid).collection('enquiries').where('status', 'in', ['new', 'visit_booked', 'quoted']).get();
    let fresh = 0;
    let toQuote = 0;
    let due = 0;
    for (const d of open.docs) {
      const e = d.data();
      if (e.status === 'new') fresh++;
      else if (e.status === 'visit_booked') toQuote++;
      else due += (e.followUps ?? []).filter((f) => f.status === 'scheduled' && f.dueAt <= now).length;
    }
    const parts = [
      due && `${due} follow-up${due === 1 ? '' : 's'} to send`,
      fresh && `${fresh} enquir${fresh === 1 ? 'y' : 'ies'} to answer`,
      toQuote && `${toQuote} quote${toQuote === 1 ? '' : 's'} to write`,
    ].filter(Boolean);
    if (parts.length) await alertTradie(uid, 'Today in QuoteDesk', parts.join(' · '), 'morning');
  }
});
