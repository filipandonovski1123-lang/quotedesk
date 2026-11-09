import clsx from 'clsx';
import { useState, type ReactNode } from 'react';
import { Badge, Card } from '../components/ui';
import { bizMonth, customersFor, project, tradieValue } from '../lib/economics';
import { PLANS } from '../lib/metrics';
import { aud } from '../lib/pricing';

function Slider({ label, value, onChange, min, max, step, fmt }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; fmt: (v: number) => string }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-2 text-[13px]">
        <span className="text-ink-2">{label}</span>
        <span className="font-semibold tabular-nums">{fmt(value)}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full accent-navy" />
    </label>
  );
}

const pct = (v: number) => `${Math.round(v * 100)}%`;
const n = (v: number) => Math.round(v).toLocaleString('en-AU');
const money = (v: number) => (Math.abs(v) >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : aud(v));

function H2({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-4">
      <p className="text-[12px] font-semibold tracking-wide text-accent uppercase">{eyebrow}</p>
      <h2 className="mt-1 text-[22px] leading-tight font-semibold">{title}</h2>
      {children && <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-ink-2">{children}</p>}
    </div>
  );
}

export function Business() {
  return (
    <div className="mx-auto max-w-5xl space-y-14 px-4 py-8">
      <div>
        <Badge tone="accent">How the business works</Badge>
        <h1 className="mt-3 max-w-3xl text-[30px] leading-tight font-semibold md:text-[38px]">Tradies pay a flat monthly fee. In return, they stop quoting for free and stop forgetting to follow up.</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-2">
          QuoteDesk sits between an enquiry and the site visit. It gets the details up front, gives the tradie a price range and a fit score, takes a deposit for site visits, and chases every quote on days 2, 7
          and 14. Everything below is an estimate to help you think, not a forecast.
        </p>
      </div>

      <Flow />
      <Plans />
      <TradieRoi />
      <OurNumbers />
      <Growth />
      <GoToMarket />
      <Honest />
    </div>
  );
}

function Flow() {
  const steps = [
    { t: 'Customer taps the enquiry link', d: 'From the tradie’s website, Google profile or a missed-call text. They answer a few questions and add photos.', who: 'Free for customers' },
    { t: 'QuoteDesk sizes it up', d: 'A price range from the tradie’s own rates, plus a fit score: budget, timing, distance, photos, how many quotes they’re getting.', who: 'AI does the work' },
    { t: 'The tradie taps once', d: 'Offer a paid site visit, send a ballpark, or decline politely. The text is already written in their voice.', who: '30 seconds instead of a drive' },
    { t: 'Serious customers pay to book a visit', d: 'A deposit (say $150) comes off the job if they go ahead. Tyre-kickers drop out on their own.', who: 'Money goes to the tradie' },
    { t: 'Every quote gets followed up', d: 'Days 2, 7 and 14, in the tradie’s voice. If supplier prices rise, it flags the quote for an update before it’s accepted.', who: 'Where the extra jobs come from' },
  ];
  return (
    <section>
      <H2 eyebrow="The flow" title="Five steps from enquiry to booked job" />
      <ol className="grid gap-3 md:grid-cols-5">
        {steps.map((s, i) => (
          <li key={s.t}>
            <Card className="h-full p-4">
              <p className="grid size-7 place-items-center rounded-full bg-navy text-[13px] font-semibold text-white">{i + 1}</p>
              <p className="mt-3 text-[14px] font-semibold">{s.t}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{s.d}</p>
              <p className="mt-2 text-[12px] font-medium text-accent">{s.who}</p>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Plans() {
  return (
    <section>
      <H2 eyebrow="Pricing" title="Flat price per business, never per user">
        Per-user pricing is one of the top complaints about existing tradie software, so QuoteDesk charges per business. The first 20 customers get 30% off for life in return for feedback and a case study.
      </H2>
      <div className="grid gap-3 md:grid-cols-2">
        {PLANS.map((p) => (
          <Card key={p.name} className={clsx('p-5', p.name === 'Crew' && 'border-navy')}>
            <div className="flex items-baseline justify-between">
              <p className="text-[16px] font-semibold">{p.name}</p>
              <p>
                <span className="text-[26px] font-semibold">{aud(p.price)}</span>
                <span className="text-[13px] text-ink-3"> / month + GST</span>
              </p>
            </div>
            <p className="text-[13px] text-ink-2">{p.who}</p>
            <ul className="mt-3 space-y-1 text-[13.5px]">
              {p.includes.map((x) => (
                <li key={x}>· {x}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <p className="mt-3 text-[13px] text-ink-2">
        Extra income later: a small fee on deposits taken through QuoteDesk (about 1%), and paid add-ons such as the materials margin checker or getting paid on site, which were gaps 2 and 3 in the research.
      </p>
    </section>
  );
}

function TradieRoi() {
  const [enquiries, setEnquiries] = useState(25);
  const [screened, setScreened] = useState(0.3);
  const [hours, setHours] = useState(2.5);
  const [hourValue, setHourValue] = useState(90);
  const [extraJobs, setExtraJobs] = useState(1);
  const [avgJob, setAvgJob] = useState(8000);
  const [margin, setMargin] = useState(0.2);
  const plan = 49;
  const v = tradieValue({ enquiries, screenedShare: screened, visitHours: hours, hourValue, extraJobs, avgJob, margin, planPrice: plan });
  return (
    <section>
      <H2 eyebrow="Why a tradie pays" title="It has to be worth far more than $49 a month">
        This is the pitch to each tradie. Move the sliders to match a real business from your interviews. A tool like this sells easily when it's worth 10× its price or more.
      </H2>
      <div className="grid gap-4 md:grid-cols-[1fr_320px]">
        <Card className="grid gap-4 p-5 sm:grid-cols-2">
          <Slider label="Enquiries a month" value={enquiries} onChange={setEnquiries} min={5} max={100} step={1} fmt={n} />
          <Slider label="Answered without a site visit" value={screened} onChange={setScreened} min={0} max={0.7} step={0.05} fmt={pct} />
          <Slider label="Hours per site visit and quote" value={hours} onChange={setHours} min={0.5} max={5} step={0.5} fmt={(x) => `${x} h`} />
          <Slider label="What an hour of your time is worth" value={hourValue} onChange={setHourValue} min={40} max={200} step={5} fmt={aud} />
          <Slider label="Extra jobs won from follow-ups a month" value={extraJobs} onChange={setExtraJobs} min={0} max={5} step={0.5} fmt={(x) => String(x)} />
          <Slider label="Average job" value={avgJob} onChange={setAvgJob} min={500} max={40000} step={500} fmt={aud} />
          <Slider label="Profit on a job" value={margin} onChange={setMargin} min={0.05} max={0.5} step={0.05} fmt={pct} />
        </Card>
        <Card className="border-navy bg-navy p-5 text-white">
          <p className="text-[13px] text-white/70">Value to the tradie each month</p>
          <p className="text-[34px] font-semibold tabular-nums">{aud(v.total)}</p>
          <dl className="mt-3 space-y-1.5 text-[13.5px]">
            <div className="flex justify-between">
              <dt className="text-white/75">Hours saved</dt>
              <dd className="tabular-nums">{v.hoursSaved.toFixed(1)} h</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/75">Value of that time</dt>
              <dd className="tabular-nums">{aud(v.timeValue)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/75">Profit from extra jobs</dt>
              <dd className="tabular-nums">{aud(v.extraProfit)}</dd>
            </div>
            <div className="flex justify-between border-t border-white/20 pt-1.5 font-semibold">
              <dt>Return on {aud(plan)}</dt>
              <dd className="tabular-nums">{Math.round(v.multiple)}×</dd>
            </div>
          </dl>
          <p className="mt-3 text-[12px] text-white/70">Test these numbers in the interviews. If real tradies land under about 5×, the pitch is weak.</p>
        </Card>
      </div>
    </section>
  );
}

function OurNumbers() {
  const [price, setPrice] = useState(65);
  const [customers, setCustomers] = useState(150);
  const [churn, setChurn] = useState(0.04);
  const [texts, setTexts] = useState(250);
  const i = { price, customers, churn, textsPerCustomer: texts, textCost: 0.06, aiCost: 2, paymentFee: 0.02, fixedCosts: 400 };
  const m = bizMonth(i);
  const milestones = [
    { label: 'Covers costs', target: 0 },
    { label: '$5k a month profit (a part-time wage)', target: 5000 },
    { label: '$10k a month profit (a full-time wage)', target: 10000 },
    { label: '$100k a month profit', target: 100000 },
  ];
  return (
    <section>
      <H2 eyebrow="Our numbers" title="What QuoteDesk itself earns">
        Each customer pays the monthly fee. Our main costs are text messages, AI usage, card fees and a few fixed bills. Text and AI prices here are rough assumptions (about 6c a text, $2 of AI per customer); check them
        before relying on this.
      </H2>
      <div className="grid gap-4 md:grid-cols-[1fr_320px]">
        <Card className="grid gap-4 p-5 sm:grid-cols-2">
          <Slider label="Average price per customer" value={price} onChange={setPrice} min={29} max={149} step={1} fmt={aud} />
          <Slider label="Paying customers" value={customers} onChange={setCustomers} min={0} max={3000} step={10} fmt={n} />
          <Slider label="Customers who leave each month" value={churn} onChange={setChurn} min={0.01} max={0.1} step={0.005} fmt={(x) => `${(x * 100).toFixed(1)}%`} />
          <Slider label="Texts per customer a month" value={texts} onChange={setTexts} min={50} max={800} step={25} fmt={n} />
          <div className="sm:col-span-2">
            <p className="text-[13px] font-semibold">Milestones at these prices</p>
            <ul className="mt-1.5 grid gap-1 text-[13px] sm:grid-cols-2">
              {milestones.map((x) => (
                <li key={x.label} className="flex justify-between gap-2 rounded-lg bg-surface-2 px-3 py-1.5">
                  <span className="text-ink-2">{x.label}</span>
                  <span className="font-semibold tabular-nums">{n(customersFor(x.target, i))} customers</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-[13px] text-ink-3">Each month</p>
          <dl className="mt-2 space-y-1.5 text-[13.5px]">
            <Line k="Revenue" v={money(m.revenue)} />
            <Line k="Costs" v={money(m.costs)} />
            <Line k="Profit" v={money(m.profit)} strong tone={m.profit >= 0 ? 'good' : 'bad'} />
          </dl>
          <dl className="mt-4 space-y-1.5 border-t border-line pt-3 text-[13.5px]">
            <Line k="Yearly revenue" v={money(m.arr)} />
            <Line k="Kept from each $1 (gross margin)" v={pct(m.grossMargin)} />
            <Line k="Average customer stays" v={`${Math.round(m.lifetimeMonths)} months`} />
            <Line k="Profit from one customer, lifetime" v={aud(m.ltv)} />
            <Line k="Most you can spend to win one" v={aud(m.maxCac)} />
          </dl>
          <p className="mt-3 text-[12px] text-ink-3">“Most you can spend” is a third of lifetime profit, a common rule of thumb for staying healthy.</p>
        </Card>
      </div>
    </section>
  );
}

const Line = ({ k, v, strong, tone }: { k: string; v: string; strong?: boolean; tone?: 'good' | 'bad' }) => (
  <div className={clsx('flex justify-between gap-3', strong && 'font-semibold')}>
    <dt className="text-ink-2">{k}</dt>
    <dd className={clsx('tabular-nums', tone === 'good' && 'text-good', tone === 'bad' && 'text-bad')}>{v}</dd>
  </div>
);

function Growth() {
  const [startNew, setStartNew] = useState(5);
  const [growth, setGrowth] = useState(0.12);
  const [churn, setChurn] = useState(0.04);
  const price = 65;
  const rows = project(36, startNew, growth, churn);
  const max = Math.max(...rows.map((r) => r.customers * price), 1);
  const at = (m: number) => rows[m - 1]!;
  return (
    <section>
      <H2 eyebrow="Growth" title="How it could grow over three years">
        Start with a handful of sign-ups a month and grow that number a little each month, while some customers leave. Small changes in growth make a huge difference by year three, which is why talking to customers
        matters more than anything else.
      </H2>
      <Card className="p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <Slider label="New customers in month 1" value={startNew} onChange={setStartNew} min={1} max={30} step={1} fmt={n} />
          <Slider label="Growth in sign-ups each month" value={growth} onChange={setGrowth} min={0} max={0.25} step={0.01} fmt={pct} />
          <Slider label="Customers who leave each month" value={churn} onChange={setChurn} min={0.01} max={0.1} step={0.005} fmt={(x) => `${(x * 100).toFixed(1)}%`} />
        </div>
        <div className="mt-5 flex h-48 items-end gap-[3px]" role="img" aria-label={`Monthly revenue grows to ${money(at(36).customers * price)} by month 36`}>
          {rows.map((r) => (
            <div key={r.month} className={clsx('flex-1 rounded-t-sm', r.month % 12 === 0 ? 'bg-accent' : 'bg-navy/80')} style={{ height: `${Math.max(1, ((r.customers * price) / max) * 100)}%` }} title={`Month ${r.month}: ${n(r.customers)} customers, ${money(r.customers * price)} a month`} />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-ink-3">
          <span>Month 1</span>
          <span>Month 36</span>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {[12, 24, 36].map((mo) => (
            <div key={mo} className="rounded-lg bg-surface-2 p-3">
              <p className="text-[12px] text-ink-3">End of year {mo / 12}</p>
              <p className="text-[18px] font-semibold tabular-nums">{money(at(mo).customers * price)} / month</p>
              <p className="text-[12px] text-ink-2">
                {n(at(mo).customers)} customers · {money(at(mo).customers * price * 12)} a year
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[12px] text-ink-3">Uses an average price of {aud(price)} a month. Software companies are often valued at several times yearly revenue, so a billion-dollar outcome needs roughly $100M+ a year, which means many countries and more products.</p>
      </Card>
    </section>
  );
}

function GoToMarket() {
  const channels = [
    { c: 'Your interview tradies', cost: 'Free', why: 'They already know the problem and the first 20 get the founding discount.' },
    { c: 'Bookkeepers who serve tradies', cost: 'Free, or 20% referral fee', why: 'One bookkeeper knows dozens of tradies and sees who is struggling.' },
    { c: 'Local trade Facebook groups', cost: 'Free', why: 'Post real results (with permission), not ads. “Dave won back $8,400 in a month.”' },
    { c: 'ServiceM8, Tradify and Jobber add-on marketplaces', cost: 'Free to list', why: 'Tradies already looking for extras find you there. Needs the sync built.' },
    { c: 'Supplier counters and trade nights', cost: 'Your time', why: 'Reece, Tradelink and Bunnings Trade events are where tradies gather.' },
    { c: 'Paid ads (later)', cost: 'Must stay under the “most you can spend” number', why: 'Only once you know a customer’s lifetime profit.' },
  ];
  return (
    <section>
      <H2 eyebrow="Getting customers" title="Where the first 150 tradies come from" />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-[13.5px]">
          <thead className="border-b border-line text-[12px] text-ink-3">
            <tr>
              <th className="px-4 py-2 font-medium">Channel</th>
              <th className="px-4 py-2 font-medium">Cost</th>
              <th className="px-4 py-2 font-medium">Why it works</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((x) => (
              <tr key={x.c} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5 font-medium">{x.c}</td>
                <td className="px-4 py-2.5 text-ink-2">{x.cost}</td>
                <td className="px-4 py-2.5 text-ink-2">{x.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </section>
  );
}

function Honest() {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <Card className="p-5">
        <p className="text-[15px] font-semibold">What's simulated in this prototype</p>
        <ul className="mt-2 space-y-1.5 text-[13.5px] text-ink-2">
          <li>· Messages are templates. The real product would have an AI model write them.</li>
          <li>· Prices use example rates, not real market data. Each tradie would set their own.</li>
          <li>· No texts are sent and no cards are charged. The real product would use an SMS service and Stripe.</li>
          <li>· “Customers” in the demo respond with made-up odds based on their fit score.</li>
          <li>· Everything is stored only in this browser.</li>
        </ul>
      </Card>
      <Card className="p-5">
        <p className="text-[15px] font-semibold">The biggest risks</p>
        <ul className="mt-2 space-y-1.5 text-[13.5px] text-ink-2">
          <li>· Tradies may not want to screen customers, fearing they'll lose jobs to rivals who quote for free.</li>
          <li>· Bigger players (Jobber, ServiceTitan, AI receptionist startups) could add the same features.</li>
          <li>· Price ranges must be trusted. If they're often wrong, tradies stop using it.</li>
          <li>· Texts must follow spam rules: only to people who enquired, with an easy opt-out.</li>
          <li>· None of this is proven until real tradies pay. The interviews come first.</li>
        </ul>
      </Card>
    </section>
  );
}
