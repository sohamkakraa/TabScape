import { type ExpensePoint } from "./storage";
import { sortSeries } from "./series";

/**
 * Builds a combined dataset for the chart:
 * - actual: original values
 * - forecast: predicted values for next N months (simple linear regression)
 */
export function buildForecastSeries(series: ExpensePoint[], monthsAhead: number) {
  const s = sortSeries(series);
  const points = s.map((p, i) => ({ x: i, y: p.amount, month: p.month }));

  // If not enough points, skip regression
  if (points.length < 2) {
    return s.map((p) => ({ month: p.month, actual: p.amount, forecast: null as any }));
  }

  // Linear regression y = a + b*x
  const n = points.length;
  const sumX = points.reduce((acc, p) => acc + p.x, 0);
  const sumY = points.reduce((acc, p) => acc + p.y, 0);
  const sumXY = points.reduce((acc, p) => acc + p.x * p.y, 0);
  const sumXX = points.reduce((acc, p) => acc + p.x * p.x, 0);

  const denom = n * sumXX - sumX * sumX;
  const b = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const a = (sumY - b * sumX) / n;

  const actualData = s.map((p) => ({ month: p.month, actual: p.amount, forecast: null as any }));

  const lastMonth = s[s.length - 1]?.month;
  const forecastData: { month: string; actual: any; forecast: number }[] = [];

  if (lastMonth) {
    const [yy, mm] = lastMonth.split("-").map((v) => parseInt(v, 10));
    for (let i = 1; i <= monthsAhead; i++) {
      const x = points.length - 1 + i;
      const yHat = Math.max(0, Math.round((a + b * x) * 100) / 100);

      const d = new Date(yy, (mm - 1) + i, 1);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      forecastData.push({ month, actual: null, forecast: yHat });
    }
  }

  // Also show forecast overlay for the existing months (optional: can help visualize)
  // Here we keep it simple: forecast only future months.
  return [...actualData, ...forecastData];
}
