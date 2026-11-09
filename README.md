# QuoteDesk

Stop quoting for free. Follow up every quote.

Live: https://filipandonovski1123-lang.github.io/quotedesk/

## What's in it

| Address | What it is |
|---|---|
| `#/` | Landing page for tradies |
| `#/app` | The real tradie app: sign up, set up, inbox, quotes, follow-ups, results, settings |
| `#/q/<link-name>` | A tradie's public enquiry form. Customers add job details and photos; no account needed |
| `#/quote/<token>` | The page a customer opens from a quote text to accept or decline |
| `#/demo`, `#/business` | Clickable demo with simulated customers, and the business model |
| `#/privacy`, `#/terms` | Pilot privacy policy and terms |

## How the pilot works

- **Texts** go from the tradie's own phone. QuoteDesk writes the message and opens Messages with it ready, so there's no SMS service to pay for, and replies go straight to the tradie.
- **Payments** go directly to the tradie, through their own payment link (Stripe, Square, PayPal) or PayID, which QuoteDesk puts in the texts.
- **Follow-ups** are scheduled on days 2, 7 and 14 (adjustable) and appear on the Today screen when due.
- **Quote acceptance** happens online: the customer taps Accept and the job is marked won.
- **Data** is stored in Firebase (project `quotedesk-4506`, Firestore and Auth). `firestore.rules` limits each tradie to their own data and lets the public only send enquiries and answer quotes.
- **Photos** are shrunk in the browser and stored in Firestore (up to 4 per enquiry), so no paid storage plan is needed.

## Upgrades that need paid accounts

- **Automatic texts and follow-ups:** an SMS service (Twilio or MessageMedia) plus a server (Firebase Cloud Functions on the Blaze plan).
- **AI-written messages:** an AI API key, called from a server function.
- **Taking payments inside QuoteDesk:** Stripe Connect.

## Develop

```bash
npm install
npm run dev
```

```bash
npm test
```

```bash
npx firebase-tools deploy --only firestore:rules
```

Pushing to `master` deploys to GitHub Pages.
