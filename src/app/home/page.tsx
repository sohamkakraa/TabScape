"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Wallet, CalendarDays, TrendingUp, User } from "lucide-react";

import {
  getSession,
  ensureSeedData,
  getTabs,
  getExpenseSeries,
  saveExpenseSeries,
  type Tab,
  type ExpensePoint,
} from "@/lib/storage";
import { ExpensesChart } from "@/components/ExpensesChart";
import { TabsGallery } from "@/components/TabsGallery";
import { EditableExpenseSeries } from "@/components/EditableExpenseSeries";
import { Shell } from "@/components/Shell";

export default function HomePage() {
  const router = useRouter();
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [series, setSeries] = useState<ExpensePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      await ensureSeedData();
      const session = await getSession();
      if (!session) {
        router.replace("/auth/login");
        return;
      }
      const [tabsData, seriesData] = await Promise.all([getTabs(), getExpenseSeries()]);
      if (!mounted) return;
      setTabs(tabsData);
      setSeries(seriesData);
      setLoading(false);
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [router]);

  const totals = useMemo(() => {
    const openTabs = tabs.filter((t) => t.status === "open");
    const count = openTabs.length;
    const amount = openTabs.reduce((sum, t) => sum + t.currentAmount, 0);
    return { count, amount };
  }, [tabs]);

  const closedCount = useMemo(
    () => tabs.filter((t) => t.status === "closed").length,
    [tabs]
  );

  async function onUpdateSeries(next: ExpensePoint[]) {
    setSeries(next);
    await saveExpenseSeries(next);
  }

  if (loading) {
    return (
      <div className="p-10">
        <div className="animate-pulse rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur">
          Loading…
        </div>
      </div>
    );
  }

  return (
    <Shell>
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 font-display">
            Home overview
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Track open tabs, forecast obligations, and keep payday stress-free.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/tabs/new"
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Add New Tab
          </Link>

          <Link
            href="/profile"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
          >
            <User className="h-4 w-4" />
            Profile
          </Link>
        </div>
      </header>

      {/* Overview cards */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Open tabs"
          value={`${totals.count}`}
          icon={<Wallet className="h-5 w-5" />}
          hint="Currently active"
        />
        <StatCard
          title="Outstanding amount"
          value={`€${totals.amount.toFixed(2)}`}
          icon={<CalendarDays className="h-5 w-5" />}
          hint="Across open tabs"
        />
        <StatCard
          title="Trend focus"
          value="Monthly"
          icon={<TrendingUp className="h-5 w-5" />}
          hint="Editable expense series"
        />
        <StatCard
          title="Closed tabs"
          value={`${closedCount}`}
          icon={<Wallet className="h-5 w-5" />}
          hint="Settled this cycle"
        />
      </section>

      {/* Tabs gallery */}
      <section className="mt-10">
        <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 font-display">
              Your open tabs
            </h2>
            <p className="text-sm text-slate-600">
              A quick “gallery view” of what you owe and where.
            </p>
          </div>
          <Link
            href="/tabs/new"
            className="text-sm font-medium text-slate-900 underline decoration-2 underline-offset-4 hover:text-slate-700"
          >
            Add tab
          </Link>
        </div>

        <TabsGallery tabs={tabs.filter((t) => t.status === "open")} />
      </section>

      {/* Chart + editor */}
      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur">
          <h3 className="text-lg font-semibold text-slate-900 font-display">
            Monthly expenses (with forecast)
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Edit the data points on the right to see your trend and a simple prediction.
          </p>
          <div className="mt-4">
            <ExpensesChart series={series} />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur">
          <h3 className="text-lg font-semibold text-slate-900 font-display">
            Edit your monthly series
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Use this for groceries + deliveries + rent/utilities totals (or just one category).
          </p>
          <div className="mt-4">
            <EditableExpenseSeries series={series} onChange={onUpdateSeries} />
          </div>
        </div>
      </section>

    </Shell>
  );
}

function StatCard({
  title,
  value,
  hint,
  icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.1)] backdrop-blur">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">{title}</p>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 text-slate-900">
          {icon}
        </div>
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
        {value}
      </div>
      <div className="mt-1 text-sm text-slate-500">{hint}</div>
    </div>
  );
}
