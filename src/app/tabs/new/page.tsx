"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, PlusCircle } from "lucide-react";

import {
  ensureSeedData,
  getSession,
  addTab,
  getRules,
  type TabCategory,
  type Rule,
} from "@/lib/storage";
import { Shell } from "@/components/Shell";
import { CATEGORY_OPTIONS } from "@/lib/categories";

export default function NewTabPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const [name, setName] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState<TabCategory>("Groceries");
  const [dueDay, setDueDay] = useState(30);
  const [limit, setLimit] = useState<number>(150);
  const [currentAmount, setCurrentAmount] = useState<number>(0);
  const [rules, setRules] = useState<Rule[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const session = await getSession();
      if (!session) {
        router.replace("/auth/login");
        return;
      }
      await ensureSeedData();
      const nextRules = await getRules();
      if (!mounted) return;
      setRules(nextRules);
      setReady(true);
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [router]);

  const merchantRules = useMemo(
    () => rules.filter((r): r is Rule & { type: "merchant" } => r.type === "merchant"),
    [rules]
  );

  useEffect(() => {
    if (!merchant.trim()) return;
    const match = merchantRules.find(
      (r) => r.merchant.toLowerCase() === merchant.trim().toLowerCase()
    );
    if (match) setCategory(match.category);
  }, [merchant, merchantRules]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !merchant.trim()) return;

    await addTab({
      name: name.trim(),
      merchant: merchant.trim(),
      category,
      dueDay,
      limit,
      currentAmount,
      status: "open",
    });

    router.push("/home");
  }

  if (!ready) return null;

  return (
    <Shell>
      <header className="flex flex-col gap-3 rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 font-display">
            Add a new tab
          </h1>
          <p className="text-sm text-slate-600">
            Create a tab for a store, delivery app, rent, or utilities.
          </p>
        </div>

        <Link
          href="/home"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </header>

      <form
        onSubmit={submit}
        className="mt-6 max-w-2xl rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tab name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Weekly groceries, Electricity, Rent"
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
          </Field>

          <Field label="Merchant / Provider">
            <input
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="e.g., Local Supermarket, Uber Eats, Landlord"
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
          </Field>

          <Field label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Due day of month (1–31)">
            <input
              type="number"
              min={1}
              max={31}
              value={dueDay}
              onChange={(e) => setDueDay(parseInt(e.target.value || "30", 10))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
          </Field>

          <Field label="Monthly limit (€)">
            <input
              type="number"
              min={0}
              step={1}
              value={limit}
              onChange={(e) => setLimit(parseFloat(e.target.value || "0"))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
          </Field>

          <Field label="Current amount (€)">
            <input
              type="number"
              min={0}
              step={0.01}
              value={currentAmount}
              onChange={(e) => setCurrentAmount(parseFloat(e.target.value || "0"))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
          </Field>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
          >
            <PlusCircle className="h-4 w-4" />
            Create tab
          </button>

          <Link
            href="/home"
            className="text-sm font-medium text-slate-900 underline decoration-2 underline-offset-4 hover:text-slate-700"
          >
            Cancel
          </Link>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Prototype note: this stores data locally in your browser.
        </p>
      </form>
    </Shell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-medium text-slate-700">{label}</div>
      {children}
    </label>
  );
}
