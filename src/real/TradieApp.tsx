import clsx from 'clsx';
import type { User } from 'firebase/auth';
import { BarChart3, CalendarClock, CalendarDays, FileText, HardHat, Inbox, Loader2, Plus, Settings as Cog, Wrench } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Badge, Card, Stat } from '../components/ui';
import { AppHeader, ListCard, ListRow, SectionTitle, StatusLine, TabBar, Thumb } from '../components/worksite';
import { aud, fitLabel, range } from '../lib/pricing';
import { loadFirstPhoto, saveProfile, updateEnquiry, watchAuth, watchEnquiries, watchMyQuotes, watchProfile } from './api';
import { AuthScreen } from './app/Auth';
import { refreshPush } from './push';
import { Ctx, useApp, type AppData } from './app/ctx';
import { Detail, FollowUpCard } from './app/Detail';
import { Onboarding } from './app/Onboarding';
import { LinkCard, Settings } from './app/Settings';
import { ago, dueFollowUps, estimateOf, fitOf, realResults, when } from './logic';
import type { PublicQuote, RealEnquiry, TradieProfile } from './model';

/** The signed-in tradie app at #/app. */
export default function TradieApp() {
  const [user, setUser] = useState<User | null | 'loading'>('loading');
  useEffect(() => watchAuth(setUser), []);
  if (user === 'loading') return <Spinner />;
  if (!user) return <AuthScreen />;
  return <Signed user={user} />;
}

function Spinner() {
  return (
    <div className="grid min-h-dvh place-items-center text-ink-3">
      <Loader2 className="size-6 animate-spin" />
    </div>
  );
}

function Signed({ user }: { user: User }) {
  const [profile, setProfile] = useState<TradieProfile | null | 'loading'>('loading');
  const [enquiries, setEnquiries] = useState<RealEnquiry[] | null>(null);
  const [quotes, setQuotes] = useState<(PublicQuote & { token: string })[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => watchProfile(user.uid, setProfile), [user.uid]);
  const hasProfile = !!profile && profile !== 'loading';
  useEffect(() => {
    if (!hasProfile) return;
    const a = watchEnquiries(user.uid, setEnquiries, () => setError('Can’t load your enquiries. Check your connection.'));
    const b = watchMyQuotes(user.uid, setQuotes);
    return () => (a(), b());
  }, [user.uid, hasProfile]);
  // Once per session, rewrite the public enquiry page from the profile so it picks up newer fields.
  const refreshed = useRef(false);
  useEffect(() => {
    if (!profile || profile === 'loading' || refreshed.current) return;
    refreshed.current = true;
    void saveProfile(user.uid, profile).catch(() => undefined);
    void refreshPush(user.uid).catch(() => undefined);
  }, [profile, user.uid]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  // When a customer accepts or declines on their quote page, close the enquiry to match.
  useEffect(() => {
    if (!enquiries) return;
    for (const q of quotes) {
      const e = enquiries.find((x) => x.id === q.enquiryId);
      if (!e || e.status !== 'quoted' || e.quote?.token !== q.token || q.status === 'open') continue;
      const won = q.status === 'accepted';
      void updateEnquiry(user.uid, e.id, {
        status: won ? 'won' : 'lost',
        closedAt: Date.now(),
        ...(won ? { wonValue: q.amount, wonAfterFollowUp: e.followUps.some((f) => f.status === 'sent') } : {}),
        followUps: e.followUps.map((f) => (f.status === 'scheduled' ? { ...f, status: 'cancelled' as const } : f)),
        log: [...(e.log ?? []), { at: Date.now(), kind: 'status', text: won ? `Accepted the ${aud(q.amount)} quote online` : 'Declined the quote online' }],
      }).catch(() => undefined);
    }
  }, [quotes, enquiries, user.uid]);

  useAlerts(enquiries, quotes);

  if (profile === 'loading') return <Spinner />;
  if (!profile) return <Onboarding user={user} />;
  if (!enquiries)
    return error ? (
      <div className="grid min-h-dvh place-items-center p-6 text-center text-ink-2">{error}</div>
    ) : (
      <Spinner />
    );
  const data: AppData = { user, profile, enquiries, quotes, now };
  return (
    <Ctx.Provider value={data}>
      <Main />
    </Ctx.Provider>
  );
}

/** Pop-up alerts and a tab-title count for new enquiries and accepted quotes. */
function useAlerts(enquiries: RealEnquiry[] | null, quotes: PublicQuote[]) {
  const seen = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!enquiries) return;
    const keys = [...enquiries.map((e) => `e:${e.id}`), ...quotes.filter((q) => q.status === 'accepted').map((q) => `q:${q.enquiryId}`)];
    if (seen.current) {
      const fresh = keys.filter((k) => !seen.current!.has(k));
      // Devices with phone alerts on get these from the server instead, so don't show them twice.
      const pushOn = (() => {
        try {
          return !!localStorage.getItem('qd-push');
        } catch {
          return false;
        }
      })();
      if (fresh.length && !pushOn && typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
        const e = enquiries.find((x) => fresh.includes(`e:${x.id}`));
        const q = quotes.find((x) => fresh.includes(`q:${x.enquiryId}`));
        try {
          new Notification(e ? `New enquiry from ${e.name}` : `Quote accepted${q ? ` by ${q.customerFirst}` : ''}`, { body: e ? `${e.jobLabel} · ${e.postcode}` : q ? `${q.jobLabel} · ${aud(q.amount)}` : '' });
        } catch {
          /* some browsers only allow alerts from a service worker */
        }
      }
    }
    seen.current = new Set(keys);
    const unseen = enquiries.filter((e) => e.status === 'new' && !e.seenAt).length;
    document.title = unseen ? `(${unseen}) QuoteDesk` : 'QuoteDesk';
  }, [enquiries, quotes]);
}

type Tab = 'today' | 'enquiries' | 'quotes' | 'results' | 'settings';

function Main() {
  const { enquiries, now, profile } = useApp();
  const [tab, setTab] = useState<Tab>('today');
  const [openId, setOpenId] = useState<string | null>(null);
  const open = enquiries.find((e) => e.id === openId);
  const todo = enquiries.filter((e) => e.status === 'new' || e.status === 'visit_booked').length + dueFollowUps(enquiries, now).length;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [openId, tab]);

  if (open)
    return (
      <div className="mx-auto max-w-lg bg-surface">
        <Detail e={open} onBack={() => setOpenId(null)} />
      </div>
    );

  const titles: Record<Tab, string> = { today: 'Today', enquiries: 'Enquiries', quotes: 'Quotes out', results: 'Results', settings: 'Settings' };
  const subtitle: Record<Tab, string> = {
    today: todo ? 'What to do next' : 'Nothing waiting on you',
    enquiries: 'Everyone who’s asked for a price',
    quotes: 'Waiting on an answer',
    results: 'What QuoteDesk has done for you',
    settings: profile.business,
  };
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-bg">
      <AppHeader title={titles[tab]} subtitle={subtitle[tab]} compact={tab !== 'today'} right={tab === 'today' ? undefined : <span />} />
      <div className="flex-1 pb-28">
        {tab === 'today' && <Today onOpen={setOpenId} />}
        {tab === 'enquiries' && <AllEnquiries onOpen={setOpenId} />}
        {tab === 'quotes' && <Quotes onOpen={setOpenId} />}
        {tab === 'results' && <Results />}
        {tab === 'settings' && <Settings />}
      </div>
      <TabBar
        active={tab}
        onChange={setTab}
        items={[
          { id: 'today', icon: <CalendarDays className="size-6" />, label: 'Today', count: todo },
          { id: 'enquiries', icon: <Inbox className="size-6" />, label: 'Enquiries' },
          { id: 'quotes', icon: <FileText className="size-6" />, label: 'Quotes' },
          { id: 'results', icon: <BarChart3 className="size-6" />, label: 'Results' },
          { id: 'settings', icon: <Cog className="size-6" />, label: 'Settings' },
        ]}
      />
    </div>
  );
}

/** What each status reads as in a list, and its colour. */
const LINE: Record<RealEnquiry['status'], { text: string; tone: 'accent' | 'navy' | 'good' | 'muted' }> = {
  new: { text: 'New', tone: 'accent' },
  visit_booked: { text: 'Quote due', tone: 'accent' },
  ballpark: { text: 'Ballpark sent', tone: 'muted' },
  visit_offered: { text: 'Visit offered', tone: 'muted' },
  quoted: { text: 'Quoted', tone: 'navy' },
  won: { text: 'Won', tone: 'good' },
  lost: { text: 'Lost', tone: 'muted' },
  declined: { text: 'Declined', tone: 'muted' },
};

function EnquiryThumb({ e }: { e: RealEnquiry }) {
  const { user } = useApp();
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (e.photoCount) void loadFirstPhoto(user.uid, e.id).then(setSrc);
  }, [e.id, e.photoCount, user.uid]);
  return <Thumb src={src} count={e.photoCount} icon={<Wrench />} />;
}

function Row({ e, onOpen, extra }: { e: RealEnquiry; onOpen: (id: string) => void; extra?: ReactNode }) {
  const { profile } = useApp();
  const fit = fitOf(profile, e);
  const label = fitLabel(fit.score);
  const est = estimateOf(profile, e);
  const money = e.quote ? aud(e.quote.amount) : est ? range(est) : null;
  return (
    <ListRow
      onClick={() => onOpen(e.id)}
      thumb={<EnquiryThumb e={e} />}
      title={
        <>
          {e.jobLabel} <span className="font-medium text-ink-2">– {e.name}</span>
        </>
      }
      sub={<StatusLine status={LINE[e.status].text} tone={LINE[e.status].tone} rest={[e.postcode, money, ago(e.createdMs)].filter(Boolean).join(' · ')} />}
      extra={
        e.status === 'new' || extra ? (
          <>
            {e.status === 'new' && (
              <Badge tone={label.tone}>
                {label.label} · {fit.score}%
              </Badge>
            )}
            {extra}
          </>
        ) : undefined
      }
    />
  );
}

function Today({ onOpen }: { onOpen: (id: string) => void }) {
  const { enquiries, profile, now } = useApp();
  const fresh = enquiries.filter((e) => e.status === 'new');
  const toQuote = enquiries.filter((e) => e.status === 'visit_booked');
  const due = dueFollowUps(enquiries, now);
  const nothing = !fresh.length && !toQuote.length && !due.length;
  const [openFollow, setOpenFollow] = useState<string | null>(null);
  return (
    <>
      {enquiries.length === 0 ? (
        <div className="space-y-3 p-4">
          <LinkCard profile={profile} />
          <Card className="rounded-2xl p-4">
            <p className="font-display text-[22px] font-bold">Get your first enquiry</p>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[14px] text-ink-2">
              <li>Check your prices in Settings, so the price guides are right.</li>
              <li>Open your link and send yourself a test enquiry to see how it works.</li>
              <li>Add the link to your website, Google profile, and your “sorry I missed your call” text.</li>
            </ol>
          </Card>
        </div>
      ) : nothing ? (
        <div className="p-4">
          <Card className="rounded-2xl p-4">
            <p className="font-display text-[22px] font-bold">All caught up</p>
            <p className="mt-1 text-[14px] text-ink-2">No new enquiries, quotes to write or follow-ups due. Next follow-up: {nextDue(enquiries, now)}.</p>
          </Card>
        </div>
      ) : null}
      {fresh.length > 0 && (
        <>
          <SectionTitle icon={<HardHat />}>
            {fresh.length} new enquir{fresh.length === 1 ? 'y' : 'ies'}
          </SectionTitle>
          <ListCard>
            {fresh.map((e) => (
              <Row key={e.id} e={e} onOpen={onOpen} />
            ))}
          </ListCard>
        </>
      )}
      {toQuote.length > 0 && (
        <>
          <SectionTitle icon={<FileText />} count={toQuote.length}>
            Quotes to send
          </SectionTitle>
          <ListCard>
            {toQuote.map((e) => (
              <Row key={e.id} e={e} onOpen={onOpen} />
            ))}
          </ListCard>
        </>
      )}
      {due.length > 0 && (
        <>
          <SectionTitle icon={<CalendarClock />} count={due.length}>
            Follow-ups due
          </SectionTitle>
          <ListCard>
            {due.map(({ e, f }) => {
              const key = `${e.id}-${f.n}`;
              return openFollow === key ? (
                <div key={key} className="p-2">
                  <FollowUpCard e={e} n={f.n} compact />
                  <button className="mt-1 px-1 py-2 text-[13px] text-ink-3 hover:underline" onClick={() => setOpenFollow(null)}>
                    Close
                  </button>
                </div>
              ) : (
                <ListRow
                  key={key}
                  onClick={() => setOpenFollow(key)}
                  thumb={<Thumb icon={<CalendarClock />} />}
                  title={`Day ${profile.followUpDays[f.n - 1]} follow-up`}
                  sub={`${e.name} – ${e.jobLabel} · ${aud(e.quote?.amount ?? 0)}`}
                />
              );
            })}
          </ListCard>
        </>
      )}
    </>
  );
}

function nextDue(list: RealEnquiry[], now: number) {
  const next = list
    .filter((e) => e.status === 'quoted')
    .flatMap((e) => e.followUps.filter((f) => f.status === 'scheduled').map((f) => f.dueAt))
    .sort((a, b) => a - b)[0];
  return next ? when(next, now) : 'none scheduled';
}

function AllEnquiries({ onOpen }: { onOpen: (id: string) => void }) {
  const { enquiries, profile } = useApp();
  const [show, setShow] = useState<'open' | 'closed'>('open');
  const closed = (e: RealEnquiry) => e.status === 'won' || e.status === 'lost' || e.status === 'declined';
  const list = enquiries.filter((e) => (show === 'closed' ? closed(e) : !closed(e)));
  return (
    <>
      <a
        href={`#/q/${profile.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mx-4 mt-3 flex h-10 items-center justify-center gap-1.5 rounded-lg border border-dashed border-line bg-surface text-[13.5px] font-medium text-navy hover:bg-surface-2"
      >
        <Plus className="size-4" /> Add an enquiry from a phone call
      </a>
      <div className="mx-4 mt-3 grid grid-cols-2 rounded-lg border border-line bg-surface p-0.5">
        {(['open', 'closed'] as const).map((x) => (
          <button key={x} onClick={() => setShow(x)} className={clsx('h-8 rounded-md text-[13px] font-medium', show === x ? 'bg-navy text-white' : 'text-ink-2')}>
            {x === 'open' ? `Open (${enquiries.filter((e) => !closed(e)).length})` : `Closed (${enquiries.filter(closed).length})`}
          </button>
        ))}
      </div>
      <div className="mt-3">
        {list.length ? (
          <ListCard>
            {list.map((e) => (
              <Row key={e.id} e={e} onOpen={onOpen} />
            ))}
          </ListCard>
        ) : (
          <p className="px-4 py-6 text-center text-[13.5px] text-ink-3">Nothing here yet.</p>
        )}
      </div>
    </>
  );
}

function Quotes({ onOpen }: { onOpen: (id: string) => void }) {
  const { enquiries, now } = useApp();
  const out = enquiries.filter((e) => e.status === 'quoted');
  const total = out.reduce((v, e) => v + (e.quote?.amount ?? 0), 0);
  return (
    <>
      <div className="p-4">
        <Card className="p-3">
          <p className="text-[12px] text-ink-3">Open quotes</p>
          <p className="text-[24px] font-semibold tabular-nums">{aud(total)}</p>
          <p className="text-[12.5px] text-ink-2">
            {out.length} quote{out.length === 1 ? '' : 's'} waiting on an answer. Follow-ups show up on Today when they’re due.
          </p>
        </Card>
      </div>
      {out.length ? (
        <ListCard>
        {out.map((e) => {
          const next = e.followUps.find((f) => f.status === 'scheduled');
          return (
            <Row
              key={e.id}
              e={e}
              onOpen={onOpen}
              extra={
                <>
                  <span className="inline-flex gap-1" aria-label="Follow-ups">
                    {e.followUps.map((f) => (
                      <span key={f.n} className={clsx('size-2 rounded-full', f.status === 'sent' ? 'bg-good' : f.status === 'scheduled' ? (f.dueAt <= now ? 'bg-accent' : 'border border-ink-3') : 'bg-line')} />
                    ))}
                  </span>
                  <span className="text-[11.5px] text-ink-3">{next ? (next.dueAt <= now ? 'Follow-up due' : `Next ${when(next.dueAt, now)}`) : 'All follow-ups done'}</span>
                </>
              }
            />
          );
        })}
        </ListCard>
      ) : (
        <p className="px-4 py-6 text-center text-[13.5px] text-ink-3">No quotes out. Send one from an enquiry after the site visit.</p>
      )}
    </>
  );
}

function Results() {
  const { profile, enquiries } = useApp();
  const r = realResults(profile, enquiries);
  return (
    <div className="space-y-3 p-4">
      <Card className="border-navy bg-navy p-4 text-white">
        <p className="text-[12.5px] text-white/70">Won after a follow-up</p>
        <p className="text-[30px] font-semibold tabular-nums">{aud(r.wonBackValue)}</p>
        <p className="text-[13px] text-white/80">
          {r.wonBack} job{r.wonBack === 1 ? '' : 's'} said yes after a follow-up. Without one, many of these quotes would have gone quiet.
        </p>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Enquiries" value={r.enquiries} />
        <Stat label="Site visits avoided" value={r.avoided} sub="Answered without driving out" />
        <Stat label="Hours saved" value={r.hoursSaved.toFixed(1)} sub="Estimate" />
        <Stat label="Visit fees" value={aud(r.deposits)} sub="Booked visits" />
        <Stat label="Win rate" value={r.winRate === null ? '–' : `${Math.round(r.winRate * 100)}%`} sub={`${r.won} won of ${r.quotes} quoted`} />
        <Stat label="Work won" value={aud(r.wonValue)} />
      </div>
      <p className="text-[12px] leading-relaxed text-ink-3">Hours saved counts each enquiry you answered without a site visit (using the usual time for that job) plus 5 minutes per follow-up text.</p>
    </div>
  );
}
