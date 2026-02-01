"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, UserPlus } from "lucide-react";

import { register, getSession, ensureSeedData } from "@/lib/storage";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    const ok = await register(email.trim().toLowerCase(), password);
    if (!ok) {
      setError("That email is already registered.");
      return;
    }

    router.replace("/home");
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
        <div className="w-full rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.2)] backdrop-blur">
          <div className="mb-2 text-2xl font-semibold tracking-tight text-slate-900 font-display">
            Create account
          </div>
          <p className="text-sm text-slate-600">
            Start tracking your tabs across groceries, deliveries, rent, and utilities.
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
                  placeholder="At least 6 characters"
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
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
            >
              <UserPlus className="h-4 w-4" />
              Register
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
              Already have an account?{" "}
              <Link className="font-medium text-slate-900 underline underline-offset-4" href="/auth/login">
                Log in
              </Link>
            </div>
          </form>

          <p className="mt-4 text-xs text-slate-500">
            Prototype note: passwords are stored locally (not secure).
          </p>
        </div>
      </div>
    </div>
  );
}
