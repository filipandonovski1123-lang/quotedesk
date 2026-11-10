// Shows QuoteDesk alerts (sent through Firebase Cloud Messaging) even when the app is closed.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { notification: { title: 'QuoteDesk', body: event.data ? event.data.text() : '' } };
  }
  const n = payload.notification || {};
  const d = payload.data || {};
  const link = d.link || (payload.fcmOptions && payload.fcmOptions.link) || self.registration.scope + '#/app';
  event.waitUntil(
    self.registration.showNotification(n.title || d.title || 'QuoteDesk', {
      body: n.body || d.body || '',
      tag: n.tag || d.tag || undefined,
      data: { link },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || self.registration.scope + '#/app';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => c.url.startsWith(self.registration.scope));
      if (open) return open.focus().then(() => open.navigate(link)).catch(() => self.clients.openWindow(link));
      return self.clients.openWindow(link);
    }),
  );
});
