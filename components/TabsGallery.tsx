"use client";

import Link from "next/link";
import { type Tab } from "@/lib/storage";
import { formatCategory } from "@/lib/categories";
import { Store, CalendarClock, Tag, ArrowUpRight } from "lucide-react";

export function TabsGallery({ tabs }: { tabs: Tab[] }) {
  if (tabs.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 text-sm text-slate-600 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur">
        No open tabs yet. Add one to see it here.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={`/tabs/${t.id}`}
          className="group relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.16)]"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-sky-400 to-amber-300 opacity-70" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-base font-semibold tracking-tight text-slate-900">
                {t.name}
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                <Store className="h-4 w-4" />
                {t.merchant}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
              €{t.currentAmount.toFixed(2)}
            </div>
          </div>

          <div className="mt-4 grid gap-2 text-sm text-slate-700">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-slate-500" />
              {formatCategory(t.category)}
            </div>
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-slate-500" />
              Due day: {t.dueDay} • Limit: €{t.limit.toFixed(0)}
            </div>
          </div>

          <div className="mt-4 h-2 w-full rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-slate-900"
              style={{
                width: `${Math.min(100, (t.currentAmount / Math.max(1, t.limit)) * 100)}%`,
              }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>
              {Math.min(100, (t.currentAmount / Math.max(1, t.limit)) * 100).toFixed(0)}%
              of limit used
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-slate-700">
              View details
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
