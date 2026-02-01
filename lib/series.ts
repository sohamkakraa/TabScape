import { type ExpensePoint } from "./storage";

export function sortSeries(series: ExpensePoint[]) {
  return [...series].sort((a, b) => a.month.localeCompare(b.month));
}

export function normalizeSeries(series: ExpensePoint[]) {
  // De-duplicate by month (latest wins), keep valid month strings
  const map = new Map<string, ExpensePoint>();
  for (const p of series) {
    const m = p.month.trim();
    if (!/^\d{4}-\d{2}$/.test(m)) continue;
    map.set(m, { month: m, amount: Number(p.amount || 0) });
  }
  return sortSeries(Array.from(map.values()));
}
