/** The maths behind the business page. Kept separate so it can be tested. */

export interface TradieInputs {
  enquiries: number; // per month
  screenedShare: number; // 0–1, enquiries answered without a site visit
  visitHours: number;
  hourValue: number;
  extraJobs: number; // extra jobs a month won because of follow-ups
  avgJob: number;
  margin: number; // 0–1 profit on a job
  planPrice: number;
}

export function tradieValue(i: TradieInputs) {
  const hoursSaved = i.enquiries * i.screenedShare * i.visitHours;
  const timeValue = hoursSaved * i.hourValue;
  const extraProfit = i.extraJobs * i.avgJob * i.margin;
  const total = timeValue + extraProfit;
  return { hoursSaved, timeValue, extraProfit, total, multiple: i.planPrice > 0 ? total / i.planPrice : 0 };
}

export interface BizInputs {
  price: number; // average revenue per customer per month
  customers: number;
  churn: number; // 0–1 monthly share of customers who leave
  textsPerCustomer: number;
  textCost: number;
  aiCost: number; // per customer per month
  paymentFee: number; // share of revenue
  fixedCosts: number; // per month: hosting, tools, insurance, accountant
}

export function bizMonth(i: BizInputs) {
  const revenue = i.price * i.customers;
  const variablePerCustomer = i.textsPerCustomer * i.textCost + i.aiCost + i.price * i.paymentFee;
  const costs = variablePerCustomer * i.customers + i.fixedCosts;
  const profit = revenue - costs;
  const grossMargin = i.price > 0 ? (i.price - variablePerCustomer) / i.price : 0;
  const lifetimeMonths = i.churn > 0 ? 1 / i.churn : Infinity;
  const ltv = (i.price - variablePerCustomer) * Math.min(lifetimeMonths, 120);
  return { revenue, costs, profit, grossMargin, variablePerCustomer, lifetimeMonths, ltv, maxCac: ltv / 3, arr: revenue * 12 };
}

/** Customers needed for a given monthly profit, after fixed costs. */
export function customersFor(target: number, i: BizInputs) {
  const perCustomer = i.price - (i.textsPerCustomer * i.textCost + i.aiCost + i.price * i.paymentFee);
  return perCustomer > 0 ? Math.ceil((target + i.fixedCosts) / perCustomer) : Infinity;
}

/** Month-by-month customers: new sign-ups grow each month, and a share leave. */
export function project(months: number, startNew: number, growth: number, churn: number) {
  const out: { month: number; customers: number; added: number }[] = [];
  let customers = 0;
  let added = startNew;
  for (let m = 1; m <= months; m++) {
    customers = customers * (1 - churn) + added;
    out.push({ month: m, customers: Math.round(customers), added: Math.round(added) });
    added *= 1 + growth;
  }
  return out;
}
