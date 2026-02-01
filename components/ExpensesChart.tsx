"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { type ExpensePoint } from "@/lib/storage";
import { buildForecastSeries } from "@/lib/forecast";

export function ExpensesChart({ series }: { series: ExpensePoint[] }) {
  const data = buildForecastSeries(series, 3);

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="#E2E8F0" />
          <XAxis dataKey="month" tickMargin={8} tick={{ fill: "#64748B", fontSize: 12 }} />
          <YAxis tickMargin={8} tick={{ fill: "#64748B", fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="actual" dot={false} stroke="#0F172A" strokeWidth={2} />
          <Line
            type="monotone"
            dataKey="forecast"
            dot={false}
            strokeDasharray="6 6"
            stroke="#F97316"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
