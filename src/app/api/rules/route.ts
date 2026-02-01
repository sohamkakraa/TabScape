import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/server/session";

export async function GET(req: NextRequest) {
  const userId = getSessionUserId(req);
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const rules = await prisma.rule.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(
    rules.map((r) => ({
      id: r.id,
      type: r.type,
      merchant: r.merchant ?? undefined,
      title: r.title ?? undefined,
      category: r.category,
      dueDay: r.dueDay ?? undefined,
      amount: r.amount ?? undefined,
      mustPay: r.mustPay,
      rangeLow: r.rangeLow ?? null,
      rangeHigh: r.rangeHigh ?? null,
    }))
  );
}

export async function POST(req: NextRequest) {
  const userId = getSessionUserId(req);
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const payload = (await req.json()) as any;
  if (!payload?.type || !payload?.category) {
    return new NextResponse("Missing fields", { status: 400 });
  }

  const rule = await prisma.rule.create({
    data: {
      userId,
      type: payload.type,
      merchant: payload.merchant ?? null,
      title: payload.title ?? null,
      category: payload.category,
      dueDay: payload.dueDay ?? null,
      amount: payload.amount ?? null,
      mustPay: payload.mustPay ?? false,
      rangeLow: payload.rangeLow ?? null,
      rangeHigh: payload.rangeHigh ?? null,
    },
  });

  return NextResponse.json({
    id: rule.id,
    type: rule.type,
    merchant: rule.merchant ?? undefined,
    title: rule.title ?? undefined,
    category: rule.category,
    dueDay: rule.dueDay ?? undefined,
    amount: rule.amount ?? undefined,
    mustPay: rule.mustPay,
    rangeLow: rule.rangeLow ?? null,
    rangeHigh: rule.rangeHigh ?? null,
  });
}
