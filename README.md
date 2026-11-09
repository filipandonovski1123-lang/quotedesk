# QuoteDesk prototype

A clickable prototype of "gap #1" from the tradie research: stop quoting for free, and follow up every quote.

- **Live demo:** a customer phone and a tradie phone side by side. The customer fills in an enquiry. The tradie sees a price range and a fit score, and replies in one tap (paid site visit, ballpark or polite no). The customer pays a deposit, the tradie sends a quote, and follow-ups go out on days 2, 7 and 14. Skip days to watch it work.
- **How the business works:** the flow, pricing, the tradie's return on $49 a month, QuoteDesk's own numbers, a three-year growth model, where customers come from, and the risks.

## What's simulated

- Messages are templates. The real product would have an AI model write them.
- Prices use example rates.
- No texts are sent and no cards are charged.
- Demo customers act on made-up odds.
- Data lives only in the browser (`localStorage`).

## Run it

```bash
npm install
npm run dev
```

`npm test` checks the pricing, fit score and business maths.
