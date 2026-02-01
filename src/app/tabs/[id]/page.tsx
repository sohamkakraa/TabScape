"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  addTransaction,
  closeTab,
  ensureSeedData,
  getRules,
  getSession,
  getTabs,
  getTransactionsForTab,
  getHousehold,
  getTabShares,
  saveTabShares,
  updateTabShare,
  addHouseholdMember,
  removeTransaction,
  type Rule,
  type Tab,
  type TabCategory,
  type TabTransaction,
  type HouseholdMember,
  type TabShare,
} from "@/lib/storage";
import { Shell } from "@/components/Shell";
import { CATEGORY_OPTIONS } from "@/lib/categories";
import {
  ArrowLeft,
  CalendarClock,
  FileText,
  PlusCircle,
  Receipt,
  ShieldCheck,
  Trash2,
  Wallet,
} from "lucide-react";

export default function TabDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const tabId = String(params.id || "");

  const [tab, setTab] = useState<Tab | null>(null);
  const [transactions, setTransactions] = useState<TabTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<Rule[]>([]);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [shares, setShares] = useState<TabShare[]>([]);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [savingSplit, setSavingSplit] = useState(false);

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [merchant, setMerchant] = useState("");
  const [memo, setMemo] = useState("");
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState<TabCategory>("Groceries");
  const [txType, setTxType] = useState<"charge" | "refund" | "payment">("charge");
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(undefined);
  const [receiptName, setReceiptName] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");

  const [filterQuery, setFilterQuery] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [filterCategory, setFilterCategory] = useState<TabCategory | "All">("All");
  const [filterHasReceipt, setFilterHasReceipt] = useState<"all" | "yes" | "no">("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterMinAmount, setFilterMinAmount] = useState("");
  const [filterMaxAmount, setFilterMaxAmount] = useState("");

  const merchantRules = useMemo(
    () => rules.filter((r): r is Rule & { type: "merchant" } => r.type === "merchant"),
    [rules]
  );

  useEffect(() => {
    let mounted = true;
    async function load() {
      const session = await getSession();
      if (!session) {
        router.replace("/auth/login");
        return;
      }
      await ensureSeedData();

      const [tabs, rulesData, txs] = await Promise.all([
        getTabs(),
        getRules(),
        getTransactionsForTab(tabId),
      ]);
      const household = await getHousehold();
      const shareData = await getTabShares(tabId);
      if (!mounted) return;
      const t = tabs.find((item) => item.id === tabId) || null;
      setTab(t);
      setRules(rulesData);
      setMembers(household.members);
      setShares(shareData);
      if (t) {
        setCategory(t.category);
        setMerchant(t.merchant);
      }
      setTransactions(txs);
      setLoading(false);
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [router, tabId]);

  useEffect(() => {
    if (!merchant.trim()) return;
    const match = merchantRules.find(
      (r) => r.merchant.toLowerCase() === merchant.trim().toLowerCase()
    );
    if (match) setCategory(match.category);
  }, [merchant, merchantRules]);

  async function refreshTab() {
    const [tabs, txs, shareData] = await Promise.all([
      getTabs(),
      getTransactionsForTab(tabId),
      getTabShares(tabId),
    ]);
    const t = tabs.find((item) => item.id === tabId) || null;
    setTab(t);
    setTransactions(txs);
    setShares(shareData);
  }

  async function onAddTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!tab) return;
    if (!merchant.trim() || amount <= 0) return;

    await addTransaction({
      tabId: tab.id,
      date,
      merchant: merchant.trim(),
      memo: memo.trim() || "Manual entry",
      amount,
      category,
      receiptUrl,
      type: txType,
      tags: tagInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .map((label) => ({ label })),
    });

    setMemo("");
    setAmount(0);
    setReceiptUrl(undefined);
    setReceiptName(null);
    setTxType("charge");
    setTagInput("");
    await refreshTab();
  }

  async function onRemoveTransaction(id: string) {
    await removeTransaction(id);
    await refreshTab();
  }

  async function onCloseTab() {
    if (!tab) return;
    await closeTab(tab.id);
    await refreshTab();
  }

  function handleReceipt(file: File | null) {
    if (!file) {
      setReceiptUrl(undefined);
      setReceiptName(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : undefined;
      setReceiptUrl(result);
      setReceiptName(file.name);
    };
    reader.readAsDataURL(file);
  }

  const filteredTransactions = useMemo(() => {
    const query = filterQuery.trim().toLowerCase();
    const minAmount = filterMinAmount.trim() ? Number(filterMinAmount) : null;
    const maxAmount = filterMaxAmount.trim() ? Number(filterMaxAmount) : null;
    const tagQuery = filterTag.trim().toLowerCase();

    return transactions.filter((tx) => {
      if (query) {
        const haystack = `${tx.merchant} ${tx.memo}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (tagQuery) {
        const tagText = (tx.tags ?? []).map((t) => t.label.toLowerCase());
        if (!tagText.some((t) => t.includes(tagQuery))) return false;
      }
      if (filterCategory !== "All" && tx.category !== filterCategory) return false;
      if (filterHasReceipt === "yes" && !tx.receiptUrl) return false;
      if (filterHasReceipt === "no" && tx.receiptUrl) return false;
      if (filterDateFrom && tx.date < filterDateFrom) return false;
      if (filterDateTo && tx.date > filterDateTo) return false;
      if (minAmount !== null && tx.amount < minAmount) return false;
      if (maxAmount !== null && tx.amount > maxAmount) return false;
      return true;
    });
  }, [
    transactions,
    filterQuery,
    filterCategory,
    filterHasReceipt,
    filterDateFrom,
    filterDateTo,
    filterMinAmount,
    filterMaxAmount,
  ]);

  const shareTotal = useMemo(() => {
    if (members.length === 0) return 0;
    return members.reduce((sum, member) => {
      const share = shares.find((s) => s.memberId === member.id);
      return sum + (share?.sharePercent ?? member.shareDefault ?? 0);
    }, 0);
  }, [members, shares]);
  const remainingShare = Math.max(0, 100 - shareTotal);

  function clearFilters() {
    setFilterQuery("");
    setFilterTag("");
    setFilterCategory("All");
    setFilterHasReceipt("all");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterMinAmount("");
    setFilterMaxAmount("");
  }

  function updateShare(memberId: string, sharePercent: number) {
    setShares((prev) => {
      const existing = prev.find((s) => s.memberId === memberId);
      if (!existing) {
        return [
          ...prev,
          {
            id: `temp_${memberId}`,
            memberId,
            memberName: members.find((m) => m.id === memberId)?.name ?? "Member",
            sharePercent,
            shareAmount: undefined,
            status: "pending",
          },
        ];
      }
      return prev.map((s) => (s.memberId === memberId ? { ...s, sharePercent } : s));
    });
  }

  async function saveShares() {
    if (!tab) return;
    if (shareTotal !== 100) return;
    setSavingSplit(true);
    const payload = members.map((member) => {
      const share = shares.find((s) => s.memberId === member.id);
      return {
        memberId: member.id,
        sharePercent: share?.sharePercent ?? member.shareDefault ?? 0,
      };
    });
    await saveTabShares(tab.id, payload);
    await refreshTab();
    setSavingSplit(false);
  }

  async function addMember() {
    if (!newMemberName.trim()) return;
    await addHouseholdMember({
      name: newMemberName.trim(),
      email: newMemberEmail.trim() || undefined,
      shareDefault: 0,
    });
    const household = await getHousehold();
    setMembers(household.members);
    setNewMemberName("");
    setNewMemberEmail("");
  }

  async function updateSharePayment(id: string, paidAmount: number) {
    await updateTabShare(id, { paidAmount });
    await refreshTab();
  }

  async function toggleShareStatus(id: string, status: "pending" | "paid") {
    await updateTabShare(id, { status });
    await refreshTab();
  }

  if (loading) return null;
  if (!tab) {
    return (
      <Shell>
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur">
          <p className="text-sm text-slate-600">Tab not found. Return to home.</p>
          <Link
            href="/home"
            className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </Shell>
    );
  }

  const progress = Math.min(100, (tab.currentAmount / Math.max(1, tab.limit)) * 100);

  return (
    <Shell>
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Tab details
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 font-display">
            {tab.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span className="inline-flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              {tab.merchant}
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Due day {tab.dueDay}
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              {tab.status === "open" ? "Open" : "Closed"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          {tab.status === "open" && (
            <button
              onClick={onCloseTab}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <ShieldCheck className="h-4 w-4" />
              Close tab
            </button>
          )}
        </div>
      </header>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_minmax(0,1fr)]">
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 font-display">
                Current balance
              </h2>
              <p className="text-sm text-slate-600">
                Track each charge, attach receipts, and keep things reconciled.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-900">
              €{tab.currentAmount.toFixed(2)}
            </div>
          </div>

          <div className="mt-4 h-2 w-full rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-slate-900" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {progress.toFixed(0)}% of your €{tab.limit.toFixed(0)} limit.
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200/70">
            <div className="border-b border-slate-200/70 bg-slate-50/70 p-4">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <label className="block">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Search
                  </div>
                  <input
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder="Merchant or memo"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                  />
                </label>
                <label className="block">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Category
                  </div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value as TabCategory | "All")}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                  >
                    <option value="All">All categories</option>
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Has receipt
                  </div>
                  <select
                    value={filterHasReceipt}
                    onChange={(e) =>
                      setFilterHasReceipt(e.target.value as "all" | "yes" | "no")
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                  >
                    <option value="all">All</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </label>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <label className="block">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Tag
                  </div>
                  <input
                    value={filterTag}
                    onChange={(e) => setFilterTag(e.target.value)}
                    placeholder="e.g., groceries"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                  />
                </label>
                <label className="block">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Date from
                  </div>
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                  />
                </label>
                <label className="block">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Date to
                  </div>
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                  />
                </label>
                <label className="block">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Min amount (€)
                  </div>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={filterMinAmount}
                    onChange={(e) => setFilterMinAmount(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                  />
                </label>
                <label className="block">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Max amount (€)
                  </div>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={filterMaxAmount}
                    onChange={(e) => setFilterMaxAmount(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                  />
                </label>
              </div>

              <div className="mt-3 text-xs text-slate-500">
                Showing {filteredTransactions.length} of {transactions.length} transactions.
              </div>
              <div className="mt-3">
                <button
                  onClick={clearFilters}
                  type="button"
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Clear filters
                </button>
              </div>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-3 py-3 font-medium text-slate-700">Date</th>
                  <th className="px-3 py-3 font-medium text-slate-700">Merchant</th>
                  <th className="px-3 py-3 font-medium text-slate-700">Memo</th>
                  <th className="px-3 py-3 font-medium text-slate-700">Type</th>
                  <th className="px-3 py-3 font-medium text-slate-700">Tags</th>
                  <th className="px-3 py-3 font-medium text-slate-700">Amount</th>
                  <th className="px-3 py-3 font-medium text-slate-700">Receipt</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="border-t border-slate-200/70">
                    <td className="px-3 py-3 text-slate-700">{tx.date}</td>
                    <td className="px-3 py-3 text-slate-900">{tx.merchant}</td>
                    <td className="px-3 py-3 text-slate-600">{tx.memo}</td>
                    <td className="px-3 py-3 text-slate-600 capitalize">{tx.type ?? "charge"}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(tx.tags ?? []).map((tag) => (
                          <span
                            key={tag.id}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600"
                          >
                            {tag.label}
                          </span>
                        ))}
                        {(tx.tags ?? []).length === 0 && (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-900">
                      €{tx.amount.toFixed(2)}
                    </td>
                    <td className="px-3 py-3">
                      {tx.receiptUrl ? (
                        <a
                          href={tx.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Receipt className="h-3.5 w-3.5" />
                          View
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        onClick={() => onRemoveTransaction(tx.id)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        type="button"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td className="px-3 py-4 text-sm text-slate-600" colSpan={8}>
                      No transactions yet. Add one to start tracking.
                    </td>
                  </tr>
                )}
                {transactions.length > 0 && filteredTransactions.length === 0 && (
                  <tr>
                    <td className="px-3 py-4 text-sm text-slate-600" colSpan={8}>
                      No transactions match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur">
          <h2 className="text-lg font-semibold text-slate-900 font-display">
            Add manual transaction
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Log an extra charge, attach a receipt, and keep your tab current.
          </p>

          <form onSubmit={onAddTransaction} className="mt-4 space-y-3">
            <label className="block">
              <div className="mb-1 text-sm font-medium text-slate-700">Date</div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
            </label>

            <label className="block">
              <div className="mb-1 text-sm font-medium text-slate-700">Merchant</div>
              <input
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                placeholder="Merchant name"
              />
            </label>

            <label className="block">
              <div className="mb-1 text-sm font-medium text-slate-700">Memo</div>
              <input
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                placeholder="Short description"
              />
            </label>

            <label className="block">
              <div className="mb-1 text-sm font-medium text-slate-700">
                Tags (comma-separated)
              </div>
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                placeholder="groceries, pantry, weekend"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <div className="mb-1 text-sm font-medium text-slate-700">Amount (€)</div>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value || "0"))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
              </label>

              <label className="block">
                <div className="mb-1 text-sm font-medium text-slate-700">Category</div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TabCategory)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <div className="mb-1 text-sm font-medium text-slate-700">Transaction type</div>
              <select
                value={txType}
                onChange={(e) => setTxType(e.target.value as "charge" | "refund" | "payment")}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
              >
                <option value="charge">Charge</option>
                <option value="refund">Refund / reversal</option>
                <option value="payment">Payment / partial payment</option>
              </select>
            </label>

            <label className="block">
              <div className="mb-1 text-sm font-medium text-slate-700">Attach receipt</div>
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2">
                <FileText className="h-4 w-4 text-slate-500" />
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleReceipt(e.target.files?.[0] ?? null)}
                  className="text-sm text-slate-600"
                />
              </div>
              {receiptName && (
                <p className="mt-1 text-xs text-slate-500">Attached: {receiptName}</p>
              )}
            </label>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <PlusCircle className="h-4 w-4" />
              Add transaction
            </button>
          </form>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Shared expense split</h3>
            <p className="mt-1 text-xs text-slate-600">
              Allocate this tab across roommates. Percentages should total 100%.
            </p>

            <div className="mt-3 space-y-2">
              {members.map((member) => {
                const share = shares.find((s) => s.memberId === member.id);
                return (
                  <div
                    key={member.id}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-700">{member.name}</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={share?.sharePercent ?? member.shareDefault ?? 0}
                        onChange={(e) =>
                          updateShare(member.id, parseFloat(e.target.value || "0"))
                        }
                        className="w-20 rounded-xl border border-slate-200 bg-white px-2 py-1 text-right text-sm outline-none focus:border-slate-400"
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>
                        Owed: €{(share?.shareAmount ?? 0).toFixed(0)}
                      </span>
                      <span>
                        Remaining: €
                        {Math.max(
                          0,
                          (share?.shareAmount ?? 0) - (share?.paidAmount ?? 0)
                        ).toFixed(0)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={share?.paidAmount ?? 0}
                        onChange={(e) =>
                          updateSharePayment(
                            share?.id ?? "",
                            parseFloat(e.target.value || "0")
                          )
                        }
                        className="w-24 rounded-xl border border-slate-200 bg-white px-2 py-1 text-right text-xs outline-none focus:border-slate-400"
                        disabled={!share?.id || share.id.startsWith("temp_")}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          share?.id && !share.id.startsWith("temp_")
                            ? toggleShareStatus(
                                share.id,
                                share.status === "paid" ? "pending" : "paid"
                              )
                            : null
                        }
                        className={`rounded-xl px-2 py-1 text-xs font-medium ${
                          share?.status === "paid"
                            ? "bg-emerald-500 text-white"
                            : "border border-slate-200 bg-white text-slate-700"
                        }`}
                        disabled={!share?.id || share.id.startsWith("temp_")}
                      >
                        {share?.status === "paid" ? "Paid" : "Pending"}
                      </button>
                    </div>
                  </div>
                );
              })}
              {members.length === 0 && (
                <p className="text-xs text-slate-500">Add a household member to split.</p>
              )}
            </div>

            <button
              onClick={saveShares}
              type="button"
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={shareTotal !== 100 || savingSplit}
            >
              {shareTotal !== 100
                ? `Split must total 100% (remaining ${remainingShare}%)`
                : savingSplit
                ? "Saving..."
                : "Save split"}
            </button>
            <div className="mt-2 text-xs text-slate-500">
              Current total: {shareTotal}% • Remaining: {remainingShare}%
            </div>

            <div className="mt-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Add member
              </div>
              <div className="mt-2 space-y-2">
                <input
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Name"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
                <input
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="Email (optional)"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
                <button
                  onClick={addMember}
                  type="button"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
                >
                  Add member
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
}
