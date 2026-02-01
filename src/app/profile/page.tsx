"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import {
  clearSession,
  ensureSeedData,
  getPreferences,
  getSession,
  savePreferences,
  type UserPreference,
} from "@/lib/storage";
import { Shell } from "@/components/Shell";

const defaultPrefs: UserPreference = {
  dashboardLayout: "cards",
  currency: "EUR",
  location: "Berlin, DE",
  theme: "light",
};

export default function ProfilePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [prefs, setPrefs] = useState<UserPreference>(defaultPrefs);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const session = await getSession();
      if (!session) {
        router.replace("/auth/login");
        return;
      }
      await ensureSeedData();
      const data = await getPreferences();
      if (!mounted) return;
      setPrefs(data ?? defaultPrefs);
      setReady(true);
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [router]);

  async function updatePrefs(next: UserPreference) {
    setPrefs(next);
    await savePreferences(next);
    const root = document.documentElement;
    if (next.theme === "dark") {
      root.classList.add("theme-dark");
    } else {
      root.classList.remove("theme-dark");
    }
  }

  async function logout() {
    await clearSession();
    router.replace("/auth/login");
  }

  if (!ready) return null;

  return (
    <Shell>
      <header className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Profile &amp; preferences
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900 font-display">
              Customize your dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Choose your layout, currency, location, and theme.
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

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_minmax(0,1fr)]">
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur">
          <h2 className="text-lg font-semibold text-slate-900 font-display">
            Dashboard preferences
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            These preferences shape how your homepage is presented.
          </p>

          <div className="mt-4 space-y-4">
            <label className="block">
              <div className="mb-1 text-sm font-medium text-slate-700">Homepage layout</div>
              <select
                value={prefs.dashboardLayout}
                onChange={(e) =>
                  updatePrefs({
                    ...prefs,
                    dashboardLayout: e.target.value as UserPreference["dashboardLayout"],
                  })
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
              >
                <option value="cards">Cards</option>
                <option value="compact">Compact</option>
                <option value="analytics">Analytics</option>
              </select>
            </label>

            <label className="block">
              <div className="mb-1 text-sm font-medium text-slate-700">Currency</div>
              <select
                value={prefs.currency}
                onChange={(e) =>
                  updatePrefs({
                    ...prefs,
                    currency: e.target.value as UserPreference["currency"],
                  })
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </label>

            <label className="block">
              <div className="mb-1 text-sm font-medium text-slate-700">Location</div>
              <input
                value={prefs.location}
                onChange={(e) =>
                  updatePrefs({
                    ...prefs,
                    location: e.target.value,
                  })
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                placeholder="City, Country"
              />
            </label>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-sm font-medium text-slate-700">Theme</div>
              <div className="mt-2 flex gap-2">
                {(["light", "dark"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() =>
                      updatePrefs({
                        ...prefs,
                        theme: mode,
                      })
                    }
                    className={`rounded-2xl px-3 py-2 text-sm font-medium ${
                      prefs.theme === mode
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {mode === "light" ? "Light" : "Dark"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur">
          <h2 className="text-lg font-semibold text-slate-900 font-display">Session</h2>
          <p className="mt-1 text-sm text-slate-600">
            You can sign out from here whenever you’re done.
          </p>
          <button
            onClick={logout}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </section>
    </Shell>
  );
}
