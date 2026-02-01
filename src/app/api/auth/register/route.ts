import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/server/session";

export async function POST(req: Request) {
  const { email, password } = (await req.json()) as { email?: string; password?: string };
  if (!email || !password) {
    return new NextResponse("Missing credentials", { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return new NextResponse("Email already registered", { status: 409 });
  }

  const user = await prisma.user.create({ data: { email, password } });
  await prisma.paydaySettings.create({
    data: {
      userId: user.id,
      salaryDay: 25,
      currentBalance: 0,
      buffer: 150,
      mustPayCategories: ["Rent", "Utilities"],
    },
  });
  await prisma.userPreference.create({
    data: {
      userId: user.id,
      dashboardLayout: "cards",
      currency: "EUR",
      location: "Berlin, DE",
      theme: "light",
    },
  });
  const household = await prisma.household.create({
    data: {
      ownerId: user.id,
      name: "My household",
    },
  });
  await prisma.householdMember.create({
    data: {
      householdId: household.id,
      name: "You",
      email,
      shareDefault: 100,
    },
  });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return res;
}
