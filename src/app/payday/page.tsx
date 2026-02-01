"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ensureSeedData,
  getPaydaySettings,
  getRules,
  getSession,
  getTabs,
  getIncomeSchedules,
  addIncomeSchedule,
  removeIncomeSchedule,
  savePaydaySettings,
  type PaydaySettings,
  type Rule,
  type TabCategory,
  type IncomeSchedule,
} from "@/lib/storage";
import { Shell } from "@/components/Shell";
import {
  CalendarClock,
  CircleDollarSign,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { formatCategory } from "@/lib/categories";

type PlanItem = {
  id: string;
  name: string;
  amount: number;
  rangeLow?: number | null;
  rangeHigh?: number | null;
  dueDay: number;
  dueDate: Date;
  mustPay: boolean;
  source: "tab" | "rule";
  category: TabCategory;
};

function nextPaydayDate(salaryDay: number, now: Date) {
  const candidate = new Date(now.getFullYear(), now.getMonth(), salaryDay);
  if (candidate >= new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    return candidate;
  }
  return new Date(now.getFullYear(), now.getMonth() + 1, salaryDay);
}

function nextDueDate(dueDay: number, now: Date) {
  const candidate = new Date(now.getFullYear(), now.getMonth(), dueDay);
  if (candidate >= new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    return candidate;
  }
  return new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
}

function nextIncomeDate(dayOfMonth: number, now: Date) {
  const candidate = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
  if (candidate >= new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    return candidate;
  }
  return new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth);
}

export default function PaydayPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<PaydaySettings | null>(null);
  const [dataSeeded, setDataSeeded] = useState(false);
  const [tabs, setTabs] = useState<Awaited<ReturnType<typeof getTabs>>>([]);
  const [rules, setRules] = useState<Awaited<ReturnType<typeof getRules>>>([]);
  const [income, setIncome] = useState<IncomeSchedule[]>([]);
  const [incomeLabel, setIncomeLabel] = useState("Main salary");
  const [incomeDay, setIncomeDay] = useState(25);
  const [incomeAmount, setIncomeAmount] = useState(3200);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const session = await getSession();
      if (!session) {
        router.replace("/auth/login");
        return;
      }
      await ensureSeedData();
      const [payday, tabsData, rulesData] = await Promise.all([
        getPaydaySettings(),
        getTabs(),
        getRules(),
      ]);
      const incomeData = await getIncomeSchedules();
      if (!mounted) return;
      setSettings(payday);
      setTabs(tabsData);
      setRules(rulesData);
      setIncome(incomeData);
      setDataSeeded(true);
      setReady(true);
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [router]);

  const planItems = useMemo(() => {
    const openTabs = tabs.filter((t) => t.status === "open");
    const recurringRules = rules.filter(
      (r): r is Rule & { type: "recurring" } => r.type === "recurring"
    );
    const now = new Date();
    const items: PlanItem[] = [];

    for (const tab of openTabs) {
      const rule = recurringRules.find((r) => r.category === tab.category);
      const dueDate = nextDueDate(tab.dueDay, now);
      const rangeLow = rule?.rangeLow ?? null;
      const rangeHigh = rule?.rangeHigh ?? null;
      items.push({
        id: `tab_${tab.id}`,
        name: tab.name,
        amount: tab.currentAmount || tab.limit,
        rangeLow,
        rangeHigh,
        dueDay: tab.dueDay,
        dueDate,
        mustPay:
          (rule?.mustPay ?? false) ||
          settings?.mustPayCategories?.includes(tab.category) ||
          false,
        source: "tab",
        category: tab.category,
      });
    }

    for (const rule of recurringRules) {
      const exists = openTabs.some(
        (t) => t.category === rule.category && t.dueDay === rule.dueDay
      );
      if (!exists) {
        items.push({
          id: `rule_${rule.id}`,
          name: rule.title,
          amount: rule.amount,
          rangeLow: rule.rangeLow ?? null,
          rangeHigh: rule.rangeHigh ?? null,
          dueDay: rule.dueDay,
          dueDate: nextDueDate(rule.dueDay, now),
          mustPay: rule.mustPay,
          source: "rule",
          category: rule.category,
        });
      }
    }

    return items.sort((a, b) => {
      if (a.mustPay !== b.mustPay) return a.mustPay ? -1 : 1;
      return a.dueDate.getTime() - b.dueDate.getTime();
    });
  }, [dataSeeded, settings]);

  const summary = useMemo(() => {
    if (!settings) return null;
    const now = new Date();
    const payday = nextPaydayDate(settings.salaryDay, now);
    const mustPayTotal = planItems
      .filter((item) => item.mustPay && item.dueDate <= payday)
      .reduce((sum, item) => sum + (item.rangeHigh ?? item.amount), 0);
    const incomeBeforePayday = income.reduce((sum, i) => {
      const next = nextIncomeDate(i.dayOfMonth, now);
      if (next <= payday) return sum + i.amount;
      return sum;
    }, 0);
    const safeToSpend = Math.max(
      0,
      settings.currentBalance + incomeBeforePayday - settings.buffer - mustPayTotal
    );
    const days = Math.max(
      0,
      Math.ceil((payday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    const nextIncome = income.length
      ? income
          .map((i) => ({ ...i, next: nextIncomeDate(i.dayOfMonth, now) }))
          .sort((a, b) => a.next.getTime() - b.next.getTime())[0]
      : null;
    const upcomingIncomeTotal = income.reduce((sum, i) => sum + i.amount, 0);
    return {
      payday,
      days,
      mustPayTotal,
      safeToSpend,
      nextIncome,
      upcomingIncomeTotal,
      incomeBeforePayday,
    };
  }, [planItems, settings, income]);

  const envelopes = useMemo(() => {
    const bucket = new Map<TabCategory, number>();
    for (const item of planItems) {
      const key = item.category;
      const amount = item.rangeHigh ?? item.amount;
      bucket.set(key, (bucket.get(key) ?? 0) + amount);
    }
    return Array.from(bucket.entries()).map(([category, amount]) => ({
      category,
      amount,
    }));
  }, [planItems]);

  async function updateSettings(next: PaydaySettings) {
    setSettings(next);
    await savePaydaySettings(next);
  }

  async function addIncome(e: React.FormEvent) {
    e.preventDefault();
    if (!incomeLabel.trim() || incomeAmount <= 0) return;
    await addIncomeSchedule({
      label: incomeLabel.trim(),
      dayOfMonth: incomeDay,
      amount: incomeAmount,
    });
    const next = await getIncomeSchedules();
    setIncome(next);
  }

  async function removeIncome(id: string) {
    await removeIncomeSchedule(id);
    const next = await getIncomeSchedules();
    setIncome(next);
  }

  if (!ready || !settings || !summary) return null;

  return (
    <Shell>
      <header className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Payday plan
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900 font-display">
              Stay ahead of your pay cycle
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Auto-prioritize must-pay items and see what’s safe to spend.
            </p>
          </div>
          <Link
            href="/home"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Back to Home
          </Link>
        </div>
      </header>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-emerald-200/70 bg-emerald-50/80 p-5 shadow-[0_12px_30px_rgba(16,185,129,0.15)] backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Safe to spend
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-emerald-900">
                €{summary.safeToSpend.toFixed(0)}
              </h2>
            </div>
            <CircleDollarSign className="h-6 w-6 text-emerald-700" />
          </div>
          <p className="mt-2 text-xs text-emerald-700">
            After must-pay items + buffer.
          </p>
          <p className="mt-1 text-[11px] text-emerald-700">
            Includes €{summary.incomeBeforePayday.toFixed(0)} income before payday.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Next payday
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                {summary.payday.toLocaleDateString()}
              </h2>
            </div>
            <CalendarClock className="h-6 w-6 text-slate-700" />
          </div>
          <p className="mt-2 text-xs text-slate-600">{summary.days} days to go.</p>
          {summary.nextIncome && (
            <p className="mt-2 text-xs text-slate-600">
              Next income: {summary.nextIncome.label} on{" "}
              {summary.nextIncome.next.toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-amber-200/70 bg-amber-50/80 p-5 shadow-[0_12px_30px_rgba(251,146,60,0.18)] backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                Must-pay total
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-amber-900">
                €{summary.mustPayTotal.toFixed(0)}
              </h2>
            </div>
            <ShieldCheck className="h-6 w-6 text-amber-700" />
          </div>
          <p className="mt-2 text-xs text-amber-700">
            Obligations due before payday.
          </p>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_minmax(0,1fr)]">
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900 font-display">
              Auto-prioritized plan
            </h2>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Must-pay items appear first; recurring rules fill gaps when tabs are missing.
          </p>

          <div className="mt-4 space-y-2">
            {planItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
              >
                <div>
                  <span className="font-semibold text-slate-900">{item.name}</span>{" "}
                  <span className="text-xs text-slate-500">
                    {item.source === "rule" ? "Forecasted" : "Open tab"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <span>{formatCategory(item.category)}</span>
                  <span>Due day {item.dueDay}</span>
                  <span className={item.mustPay ? "text-amber-700" : "text-slate-600"}>
                    {item.mustPay ? "Must-pay" : "Flexible"}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {item.rangeLow != null && item.rangeHigh != null
                      ? `€${item.rangeLow.toFixed(0)}–€${item.rangeHigh.toFixed(0)}`
                      : `€${item.amount.toFixed(0)}`}
                  </span>
                </div>
              </div>
            ))}
            {planItems.length === 0 && (
              <p className="text-sm text-slate-600">No upcoming items yet.</p>
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Envelope targets</h3>
            <p className="mt-1 text-xs text-slate-600">
              Based on forecast highs per category.
            </p>
            <div className="mt-3 space-y-2">
              {envelopes.map((env) => (
                <div
                  key={env.category}
                  className="flex items-center justify-between text-sm text-slate-700"
                >
                  <span>{formatCategory(env.category)}</span>
                  <span className="font-semibold text-slate-900">
                    €{env.amount.toFixed(0)}
                  </span>
                </div>
              ))}
              {envelopes.length === 0 && (
                <p className="text-sm text-slate-600">No envelope data yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur">
          <h2 className="text-lg font-semibold text-slate-900 font-display">
            Payday settings
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Update your salary date and balance to keep projections accurate.
          </p>

          <div className="mt-4 space-y-3">
            <label className="block">
              <div className="mb-1 text-sm font-medium text-slate-700">Salary day</div>
              <input
                type="number"
                min={1}
                max={31}
                value={settings.salaryDay}
                onChange={(e) =>
                  updateSettings({
                    ...settings,
                    salaryDay: parseInt(e.target.value || "1", 10),
                  })
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
            </label>
            <label className="block">
              <div className="mb-1 text-sm font-medium text-slate-700">Current balance (€)</div>
              <input
                type="number"
                min={0}
                step={1}
                value={settings.currentBalance}
                onChange={(e) =>
                  updateSettings({
                    ...settings,
                    currentBalance: parseFloat(e.target.value || "0"),
                  })
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
            </label>
            <label className="block">
              <div className="mb-1 text-sm font-medium text-slate-700">Safety buffer (€)</div>
              <input
                type="number"
                min={0}
                step={1}
                value={settings.buffer}
                onChange={(e) =>
                  updateSettings({
                    ...settings,
                    buffer: parseFloat(e.target.value || "0"),
                  })
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
            </label>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Income schedules</h3>
            <p className="mt-1 text-xs text-slate-600">
              Add multiple pay dates for irregular income.
            </p>

            <form onSubmit={addIncome} className="mt-3 space-y-2">
              <input
                value={incomeLabel}
                onChange={(e) => setIncomeLabel(e.target.value)}
                placeholder="Label"
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={incomeDay}
                  onChange={(e) => setIncomeDay(parseInt(e.target.value || "1", 10))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(parseFloat(e.target.value || "0"))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
              </div>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
              >
                Add income schedule
              </button>
            </form>

            <div className="mt-3 space-y-2">
              {income.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                >
                  <span>
                    {item.label} • Day {item.dayOfMonth}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">€{item.amount.toFixed(0)}</span>
                    <button
                      onClick={() => removeIncome(item.id)}
                      type="button"
                      className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              {income.length === 0 && (
                <p className="text-xs text-slate-500">No income schedules yet.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
}
