"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addRule,
  ensureSeedData,
  getPaydaySettings,
  getRules,
  getSession,
  removeRule,
  savePaydaySettings,
  type PaydaySettings,
  type Rule,
  type TabCategory,
} from "@/lib/storage";
import { Shell } from "@/components/Shell";
import { PlusCircle, Trash2, Wand2 } from "lucide-react";
import { CATEGORY_OPTIONS, formatCategory } from "@/lib/categories";

export default function RulesPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [rules, setRules] = useState<Rule[]>([]);
  const [settings, setSettings] = useState<PaydaySettings | null>(null);

  const [merchant, setMerchant] = useState("");
  const [merchantCategory, setMerchantCategory] = useState<TabCategory>("Utilities");

  const [recurringTitle, setRecurringTitle] = useState("Rent due on the 1st");
  const [recurringCategory, setRecurringCategory] = useState<TabCategory>("Rent");
  const [recurringDueDay, setRecurringDueDay] = useState(1);
  const [recurringAmount, setRecurringAmount] = useState(980);
  const [recurringMustPay, setRecurringMustPay] = useState(true);
  const [recurringRangeLow, setRecurringRangeLow] = useState("");
  const [recurringRangeHigh, setRecurringRangeHigh] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      const session = await getSession();
      if (!session) {
        router.replace("/auth/login");
        return;
      }
      await ensureSeedData();
      const [rulesData, payday] = await Promise.all([getRules(), getPaydaySettings()]);
      if (!mounted) return;
      setRules(rulesData);
      setSettings(payday);
      setReady(true);
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [router]);

  async function refresh() {
    const [rulesData, payday] = await Promise.all([getRules(), getPaydaySettings()]);
    setRules(rulesData);
    if (payday) setSettings(payday);
  }

  async function addMerchantRule(e: React.FormEvent) {
    e.preventDefault();
    if (!merchant.trim()) return;
    await addRule({ type: "merchant", merchant: merchant.trim(), category: merchantCategory });
    setMerchant("");
    await refresh();
  }

  async function addRecurringRule(e: React.FormEvent) {
    e.preventDefault();
    if (!recurringTitle.trim() || recurringAmount <= 0) return;
    await addRule({
      type: "recurring",
      title: recurringTitle.trim(),
      category: recurringCategory,
      dueDay: recurringDueDay,
      amount: recurringAmount,
      mustPay: recurringMustPay,
      rangeLow: recurringRangeLow ? parseFloat(recurringRangeLow) : null,
      rangeHigh: recurringRangeHigh ? parseFloat(recurringRangeHigh) : null,
    });
    setRecurringRangeLow("");
    setRecurringRangeHigh("");
    await refresh();
  }

  async function onRemove(id: string) {
    await removeRule(id);
    await refresh();
  }

  async function toggleMustPayCategory(category: TabCategory) {
    if (!settings) return;
    const next = settings.mustPayCategories.includes(category)
      ? settings.mustPayCategories.filter((c) => c !== category)
      : [...settings.mustPayCategories, category];
    const updated = { ...settings, mustPayCategories: next };
    setSettings(updated);
    await savePaydaySettings(updated);
  }

  if (!ready) return null;

  const merchantRules = rules.filter(
    (r): r is Rule & { type: "merchant" } => r.type === "merchant"
  );
  const recurringRules = rules.filter(
    (r): r is Rule & { type: "recurring" } => r.type === "recurring"
  );

  return (
    <Shell>
      <header className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Rules &amp; categorization
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900 font-display">
              Automate your tabs
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Keep categories consistent and forecast recurring obligations.
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

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900 font-display">
              Merchant auto-categorization
            </h2>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Example: “This merchant is always Utilities.”
          </p>

          <form onSubmit={addMerchantRule} className="mt-4 space-y-3">
            <label className="block">
              <div className="mb-1 text-sm font-medium text-slate-700">Merchant name</div>
              <input
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                placeholder="Energy Provider"
              />
            </label>
            <label className="block">
              <div className="mb-1 text-sm font-medium text-slate-700">Category</div>
              <select
                value={merchantCategory}
                onChange={(e) => setMerchantCategory(e.target.value as TabCategory)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <PlusCircle className="h-4 w-4" />
              Add merchant rule
            </button>
          </form>

          <div className="mt-5 space-y-2">
            {merchantRules.length === 0 && (
              <p className="text-sm text-slate-600">No merchant rules yet.</p>
            )}
            {merchantRules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
              >
                <span>
                  <b>{rule.merchant}</b> → {formatCategory(rule.category)}
                </span>
                <button
                  onClick={() => onRemove(rule.id)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900 font-display">
              Recurring obligations
            </h2>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Example: “Rent due on the 1st; forecast it if missing.”
          </p>

          <form onSubmit={addRecurringRule} className="mt-4 space-y-3">
            <label className="block">
              <div className="mb-1 text-sm font-medium text-slate-700">Title</div>
              <input
                value={recurringTitle}
                onChange={(e) => setRecurringTitle(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <div className="mb-1 text-sm font-medium text-slate-700">Category</div>
                <select
                  value={recurringCategory}
                  onChange={(e) => setRecurringCategory(e.target.value as TabCategory)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <div className="mb-1 text-sm font-medium text-slate-700">Due day</div>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={recurringDueDay}
                  onChange={(e) => setRecurringDueDay(parseInt(e.target.value || "1", 10))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
              </label>
              <label className="block">
                <div className="mb-1 text-sm font-medium text-slate-700">Amount (€)</div>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={recurringAmount}
                  onChange={(e) => setRecurringAmount(parseFloat(e.target.value || "0"))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
              </label>
              <label className="block">
                <div className="mb-1 text-sm font-medium text-slate-700">Forecast range low (€)</div>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={recurringRangeLow}
                  onChange={(e) => setRecurringRangeLow(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
              </label>
              <label className="block">
                <div className="mb-1 text-sm font-medium text-slate-700">Forecast range high (€)</div>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={recurringRangeHigh}
                  onChange={(e) => setRecurringRangeHigh(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={recurringMustPay}
                  onChange={(e) => setRecurringMustPay(e.target.checked)}
                  className="h-4 w-4"
                />
                Must-pay item
              </label>
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <PlusCircle className="h-4 w-4" />
              Add recurring rule
            </button>
          </form>

          <div className="mt-5 space-y-2">
            {recurringRules.length === 0 && (
              <p className="text-sm text-slate-600">No recurring rules yet.</p>
            )}
            {recurringRules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
              >
                <span>
                  <b>{rule.title}</b> • {formatCategory(rule.category)} • Day {rule.dueDay} • €
                  {rule.amount.toFixed(0)}
                  {rule.mustPay ? " • Must-pay" : ""}
                  {rule.rangeLow != null && rule.rangeHigh != null
                    ? ` • Range €${rule.rangeLow.toFixed(0)}–€${rule.rangeHigh.toFixed(0)}`
                    : ""}
                </span>
                <button
                  onClick={() => onRemove(rule.id)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur">
        <h2 className="text-lg font-semibold text-slate-900 font-display">
          Must-pay defaults
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Categories here are treated as must-pay when no explicit rule exists.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {CATEGORY_OPTIONS.map((c) => (
            <label
              key={c.value}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            >
              <input
                type="checkbox"
                checked={settings?.mustPayCategories?.includes(c.value) ?? false}
                onChange={() => toggleMustPayCategory(c.value)}
                className="h-4 w-4"
              />
              {c.label}
            </label>
          ))}
        </div>
      </section>
    </Shell>
  );
}
