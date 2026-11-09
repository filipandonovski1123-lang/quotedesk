import type { ReactNode } from 'react';

const UPDATED = '9 November 2026';

function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-[15px] leading-relaxed text-ink-2">
      <a href="#/" className="text-[16px] font-semibold text-ink">
        Quote<span className="text-accent">Desk</span>
      </a>
      <h1 className="mt-6 text-[26px] font-semibold text-ink">{title}</h1>
      <p className="mt-1 text-[13px] text-ink-3">Last updated {UPDATED}. QuoteDesk is in a free pilot.</p>
      <div className="mt-6 space-y-4 [&_h2]:mt-6 [&_h2]:text-[17px] [&_h2]:font-semibold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc">{children}</div>
    </main>
  );
}

export function Privacy() {
  return (
    <Page title="Privacy policy">
      <p>QuoteDesk helps trade businesses (“tradies”) receive job enquiries, reply to them and follow up quotes. This explains what we collect and what we do with it.</p>
      <h2>If you send an enquiry to a tradie</h2>
      <ul>
        <li>We store what you enter (name, mobile, postcode, job details, budget, notes and photos) so the tradie you chose can see it and reply.</li>
        <li>Only that tradie can see your enquiry. We don’t sell it, share it with other businesses, or use it for advertising.</li>
        <li>The tradie contacts you by text from their own phone, about your job only. To stop, reply to them or ask them to delete your details.</li>
        <li>If a tradie sends you a quote link, anyone with that link can see the quote (it has a long random address that can’t be guessed).</li>
      </ul>
      <h2>If you’re a tradie using QuoteDesk</h2>
      <ul>
        <li>We store your account email, business details, prices and settings, and the enquiries and quotes in your account.</li>
        <li>You can download all of it, or permanently delete your account and everything in it, from Settings.</li>
      </ul>
      <h2>Where it’s stored</h2>
      <p>Data is stored with Google Firebase (Google Cloud), which may hold it outside Australia. Access is restricted so each tradie can only reach their own records.</p>
      <h2>What we don’t do</h2>
      <ul>
        <li>No advertising or tracking cookies, and no selling of data.</li>
        <li>No texts or emails are sent to customers by QuoteDesk itself. Tradies send them from their own phones.</li>
      </ul>
      <h2>Questions or deletion requests</h2>
      <p>Customers: contact the tradie you sent your enquiry to. Tradies: use Settings, or contact QuoteDesk through the details provided when you joined the pilot.</p>
    </Page>
  );
}

export function Terms() {
  return (
    <Page title="Terms of use">
      <p>These terms apply to tradies using QuoteDesk during the pilot.</p>
      <h2>The pilot</h2>
      <ul>
        <li>QuoteDesk is free during the pilot. We’ll give you at least 30 days’ notice before any paid plan starts, and you can leave any time.</li>
        <li>It’s new software. It may have bugs or downtime, and features may change. Keep your own records of important jobs.</li>
      </ul>
      <h2>Your responsibilities</h2>
      <ul>
        <li>Price guides come from the rates you set. They’re guides, not quotes. You’re responsible for the prices you give customers.</li>
        <li>Only text people who have enquired with you, about their enquiry, and stop if they ask. Follow Australia’s spam and privacy laws.</li>
        <li>Handle customers’ details respectfully and delete them when they ask.</li>
        <li>Payments and visit fees go directly between you and your customer. QuoteDesk doesn’t handle money.</li>
      </ul>
      <h2>Your data</h2>
      <p>Your data belongs to you. You can export it or delete it from Settings at any time.</p>
      <h2>Liability</h2>
      <p>To the extent the law allows, QuoteDesk is provided “as is” during the pilot, and we aren’t liable for lost jobs, income or data. Nothing here limits your rights under the Australian Consumer Law.</p>
    </Page>
  );
}
