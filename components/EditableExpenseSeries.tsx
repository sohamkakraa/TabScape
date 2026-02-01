"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { type ExpensePoint } from "@/lib/storage";
import { normalizeSeries, sortSeries } from "@/lib/series";

export function EditableExpenseSeries({
  series,
  onChange,
}: {
  series: ExpensePoint[];
  onChange: (next: ExpensePoint[]) => void;
}) {
  const sorted = useMemo(() => sortSeries(series), [series]);
  const [newMonth, setNewMonth] = useState("");
  const [newAmount, setNewAmount] = useState<number>(0);

  function updateAt(i: number, amount: number) {
    const next = sorted.map((p, idx) => (idx === i ? { ...p, amount } : p));
    onChange(normalizeSeries(next));
  }

  function removeAt(i: number) {
    const next = sorted.filter((_, idx) => idx !== i);
    onChange(normalizeSeries(next));
  }

  function addPoint() {
    if (!newMonth.trim()) return;
    const point: ExpensePoint = { month: newMonth.trim(), amount: Number(newAmount || 0) };
    onChange(normalizeSeries([...sorted, point]));
    setNewMonth("");
    setNewAmount(0);
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/80">
            <tr>
              <th className="px-3 py-3 font-medium text-slate-700">Month (YYYY-MM)</th>
              <th className="px-3 py-3 font-medium text-slate-700">Amount (€)</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => (
              <tr key={p.month} className="border-t border-slate-200/70">
                <td className="px-3 py-3 font-medium text-slate-800">{p.month}</td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step={0.01}
                    value={p.amount}
                    onChange={(e) => updateAt(i, parseFloat(e.target.value || "0"))}
                    className="w-32 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => removeAt(i)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-sm text-slate-600" colSpan={3}>
                  No data yet. Add a month below.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-3xl border border-slate-200/70 bg-slate-50/70 p-4 shadow-[0_8px_20px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="text-sm font-medium text-slate-800">Add a month</div>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <input
            value={newMonth}
            onChange={(e) => setNewMonth(e.target.value)}
            placeholder="YYYY-MM (e.g., 2026-02)"
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 sm:w-52"
          />
          <input
            type="number"
            step={0.01}
            value={newAmount}
            onChange={(e) => setNewAmount(parseFloat(e.target.value || "0"))}
            placeholder="Amount"
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 sm:w-40"
          />
          <button
            onClick={addPoint}
            type="button"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
        <div className="mt-2 text-xs text-slate-600">
          Tip: you can treat this as “total monthly obligations” or keep it to groceries only.
        </div>
      </div>
    </div>
  );
}
