"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, PlusSquare, SlidersHorizontal, CalendarClock, User, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ensureSeedData,
  getPreferences,
  getNotifications,
  markNotificationRead,
} from "@/lib/storage";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<
    Awaited<ReturnType<typeof getNotifications>>
  >([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    void ensureSeedData();
    async function applyTheme() {
      try {
        const prefs = await getPreferences();
        const root = document.documentElement;
        if (prefs.theme === "dark") {
          root.classList.add("theme-dark");
        } else {
          root.classList.remove("theme-dark");
        }
      } catch {
        // Ignore preference load errors in the shell.
      }
    }
    void applyTheme();

    async function loadNotifications() {
      try {
        const items = await getNotifications(true);
        setNotifications(items);
      } catch {
        // Ignore notification load errors in the shell.
      }
    }
    void loadNotifications();
  }, []);

  const nav = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/tabs/new", label: "Add Tab", icon: PlusSquare },
    { href: "/rules", label: "Rules", icon: SlidersHorizontal },
    { href: "/payday", label: "Payday Plan", icon: CalendarClock },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-6">
      <div className="mb-4 flex justify-end">
        <div className="relative">
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Bell className="h-4 w-4" />
            Alerts
            {notifications.length > 0 && (
              <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-semibold text-slate-900">
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">
                Notifications
              </div>
              <div className="max-h-80 overflow-auto">
                {notifications.length === 0 && (
                  <div className="px-4 py-3 text-xs text-slate-500">No alerts.</div>
                )}
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={async () => {
                      await markNotificationRead(n.id);
                      setNotifications((prev) => prev.filter((item) => item.id !== n.id));
                    }}
                    className="w-full border-b border-slate-100 px-4 py-3 text-left text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <div className="font-semibold text-slate-900">{n.title}</div>
                    <div className="mt-1 text-slate-600">{n.message}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  TabScape
                </div>
                <div className="mt-2 text-xl font-semibold text-slate-900">
                  Unified tabs HQ
                </div>
              </div>
              <div className="rounded-2xl bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                Prototype
              </div>
            </div>

            <nav className="mt-6 space-y-1">
              {nav.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "nav-link flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition",
                      active
                        ? "nav-link-active bg-slate-900 text-white shadow-sm"
                        : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="rounded-3xl border border-amber-200/60 bg-amber-50/70 p-4 text-sm text-amber-900 shadow-[0_10px_25px_rgba(217,119,6,0.15)] backdrop-blur">
            Tip: Use Rules to auto-categorize merchants and forecast must-pay items.
          </div>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>

      <div className="mt-10 rounded-3xl border border-amber-200/60 bg-amber-50/70 p-4 text-xs text-amber-900 shadow-[0_10px_25px_rgba(217,119,6,0.15)] backdrop-blur">
        Warning: This prototype is for personal budgeting only. Do not misuse it for fraud, harassment,
        or any unlawful activity.
      </div>

      <footer className="mt-6 text-center text-xs text-slate-500">
        TabScape Prototype • Local demo only • Data stored on your device
      </footer>
    </div>
  );
}
