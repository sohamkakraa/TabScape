export type TabStatus = "open" | "closed";
export type TabCategory = "Groceries" | "FoodDelivery" | "Utilities" | "Rent" | "Other";

export type Tab = {
  id: string;
  name: string;
  merchant: string;
  category: TabCategory;
  dueDay: number;
  limit: number;
  currentAmount: number;
  status: TabStatus;
  createdAt: string;
};

export type ExpensePoint = { month: string; amount: number };

export type TabTransaction = {
  id: string;
  tabId: string;
  date: string;
  merchant: string;
  memo: string;
  amount: number;
  category: TabCategory;
  receiptUrl?: string;
  createdAt: string;
  type?: "charge" | "refund" | "payment";
  tags?: { id: string; label: string; color?: string }[];
};

export type MerchantRule = {
  id: string;
  type: "merchant";
  merchant: string;
  category: TabCategory;
};

export type RecurringRule = {
  id: string;
  type: "recurring";
  title: string;
  category: TabCategory;
  dueDay: number;
  amount: number;
  mustPay: boolean;
  rangeLow?: number | null;
  rangeHigh?: number | null;
};

export type Rule = MerchantRule | RecurringRule;

export type PaydaySettings = {
  salaryDay: number;
  currentBalance: number;
  buffer: number;
  mustPayCategories: TabCategory[];
};

export type UserPreference = {
  dashboardLayout: "cards" | "compact" | "analytics";
  currency: "EUR" | "USD" | "GBP";
  location: string;
  theme: "light" | "dark";
};

export type Household = {
  id: string;
  name: string;
};

export type HouseholdMember = {
  id: string;
  name: string;
  email?: string;
  shareDefault?: number;
};

export type TabShare = {
  id: string;
  memberId: string;
  memberName: string;
  sharePercent: number;
  shareAmount?: number;
  paidAmount?: number;
  status: "pending" | "paid";
};

export type IncomeSchedule = {
  id: string;
  label: string;
  dayOfMonth: number;
  amount: number;
  active: boolean;
};

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  readAt?: string;
};
const JSON_HEADERS = { "Content-Type": "application/json" };

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    credentials: "include",
    ...init,
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Request failed");
  }
  if (res.status === 204) return null as T;
  return (await res.json()) as T;
}

/** Seed demo data so the UI looks “full” immediately */
export async function ensureSeedData() {
  if (typeof window === "undefined") return;
  await fetchJson("/api/seed", { method: "POST" });
}

/* -------------------- Users + Session -------------------- */

export async function getSession(): Promise<{ userId: string } | null> {
  if (typeof window === "undefined") return null;
  const res = await fetch("/api/auth/session", {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as { userId: string } | null;
}

export async function clearSession() {
  if (typeof window === "undefined") return;
  await fetchJson("/api/auth/logout", { method: "POST" });
}

export async function login(email: string, password: string): Promise<boolean> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "include",
    headers: JSON_HEADERS,
    body: JSON.stringify({ email, password }),
  });
  return res.ok;
}

export async function register(email: string, password: string): Promise<boolean> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    credentials: "include",
    headers: JSON_HEADERS,
    body: JSON.stringify({ email, password }),
  });
  return res.ok;
}

/* -------------------- Tabs -------------------- */

export async function getTabs(): Promise<Tab[]> {
  return await fetchJson<Tab[]>("/api/tabs");
}

export async function addTab(input: Omit<Tab, "id" | "createdAt" | "currentAmount"> & { currentAmount?: number }) {
  await fetchJson("/api/tabs", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
}

export async function closeTab(id: string) {
  await fetchJson(`/api/tabs/${id}/close`, { method: "POST" });
}

/* -------------------- Transactions -------------------- */

export async function getTransactionsForTab(tabId: string) {
  try {
    return await fetchJson<TabTransaction[]>(`/api/transactions?tabId=${tabId}`);
  } catch {
    return [];
  }
}

export async function addTransaction(
  input: Omit<TabTransaction, "id" | "createdAt" | "tags"> & {
    tags?: { label: string; color?: string }[];
  }
) {
  await fetchJson("/api/transactions", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
}

export async function removeTransaction(id: string) {
  await fetchJson(`/api/transactions/${id}`, { method: "DELETE" });
}

/* -------------------- Rules -------------------- */

export async function getRules(): Promise<Rule[]> {
  return await fetchJson<Rule[]>("/api/rules");
}

export async function addRule(rule: Omit<Rule, "id">) {
  await fetchJson("/api/rules", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(rule),
  });
}

export async function removeRule(id: string) {
  await fetchJson(`/api/rules/${id}`, { method: "DELETE" });
}

/* -------------------- Payday -------------------- */

export async function getPaydaySettings(): Promise<PaydaySettings | null> {
  return await fetchJson<PaydaySettings | null>("/api/payday");
}

export async function savePaydaySettings(settings: PaydaySettings) {
  await fetchJson("/api/payday", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(settings),
  });
}

/* -------------------- Preferences -------------------- */

export async function getPreferences(): Promise<UserPreference> {
  return await fetchJson<UserPreference>("/api/preferences");
}

export async function savePreferences(settings: UserPreference) {
  await fetchJson("/api/preferences", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(settings),
  });
}

/* -------------------- Household -------------------- */

export async function getHousehold(): Promise<{ household: Household | null; members: HouseholdMember[] }> {
  return await fetchJson<{ household: Household | null; members: HouseholdMember[] }>("/api/household");
}

export async function addHouseholdMember(input: {
  name: string;
  email?: string;
  shareDefault?: number;
}) {
  await fetchJson("/api/household", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
}

export async function getTabShares(tabId: string): Promise<TabShare[]> {
  return await fetchJson<TabShare[]>(`/api/tab-shares?tabId=${tabId}`);
}

export async function saveTabShares(tabId: string, shares: { memberId: string; sharePercent: number }[]) {
  await fetchJson("/api/tab-shares", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ tabId, shares }),
  });
}

export async function updateTabShare(
  id: string,
  update: { paidAmount?: number; status?: "pending" | "paid" }
) {
  await fetchJson(`/api/tab-shares/${id}`, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify(update),
  });
}

/* -------------------- Income schedules -------------------- */

export async function getIncomeSchedules(): Promise<IncomeSchedule[]> {
  try {
    return await fetchJson<IncomeSchedule[]>("/api/income");
  } catch {
    return [];
  }
}

export async function addIncomeSchedule(input: {
  label: string;
  dayOfMonth: number;
  amount: number;
}) {
  await fetchJson("/api/income", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
}

export async function removeIncomeSchedule(id: string) {
  await fetchJson(`/api/income/${id}`, { method: "DELETE" });
}

/* -------------------- Notifications -------------------- */

export async function getNotifications(unreadOnly = true): Promise<NotificationItem[]> {
  return await fetchJson<NotificationItem[]>(`/api/notifications?unread=${unreadOnly}`);
}

export async function markNotificationRead(id: string) {
  await fetchJson("/api/notifications", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ id }),
  });
}

/* -------------------- Expense series -------------------- */

export async function getExpenseSeries(): Promise<ExpensePoint[]> {
  return await fetchJson<ExpensePoint[]>("/api/expense-series");
}

export async function saveExpenseSeries(series: ExpensePoint[]) {
  await fetchJson("/api/expense-series", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ series }),
  });
}
