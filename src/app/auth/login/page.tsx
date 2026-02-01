"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";

import { login, getSession, ensureSeedData } from "@/lib/storage";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@tabscape.local");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      await ensureSeedData();
      const s = await getSession();
      if (!mounted) return;
      if (s) router.replace("/home");
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const ok = await login(email.trim().toLowerCase(), password);
    if (!ok) {
      setError("Invalid email or password.");
      return;
    }

    router.replace("/home");
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
        <div className="w-full rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.2)] backdrop-blur">
          <div className="mb-2 text-2xl font-semibold tracking-tight text-slate-900 font-display">
            Welcome back
          </div>
          <p className="text-sm text-slate-600">
            Log in to view your open tabs and monthly forecast.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <div className="mb-1 text-sm font-medium text-slate-700">Email</div>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <Mail className="h-4 w-4 text-slate-500" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm outline-none"
                  placeholder="you@example.com"
                />
              </div>
            </label>

            <label className="block">
              <div className="mb-1 text-sm font-medium text-slate-700">Password</div>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <Lock className="h-4 w-4 text-slate-500" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  className="w-full text-sm outline-none"
                  placeholder="••••••••"
                />
              </div>
            </label>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
            >
              Log in
            </button>

            <div className="grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Continue with Google
              </button>
              <button
                type="button"
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Continue with Apple
              </button>
              <button
                type="button"
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Continue with Microsoft
              </button>
            </div>

            <div className="text-center text-sm text-slate-600">
              No account?{" "}
              <Link className="font-medium text-slate-900 underline underline-offset-4" href="/auth/register">
                Register
              </Link>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              Demo user: <b>demo@tabscape.local</b> / <b>demo123</b>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
