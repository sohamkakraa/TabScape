import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/server/session";

export async function GET(req: NextRequest) {
  const userId = getSessionUserId(req);
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const items = await prisma.incomeSchedule.findMany({
    where: { userId, active: true },
    orderBy: { dayOfMonth: "asc" },
  });

  return NextResponse.json(
    items.map((i) => ({
      id: i.id,
      label: i.label,
      dayOfMonth: i.dayOfMonth,
      amount: i.amount,
      active: i.active,
    }))
  );
}

export async function POST(req: NextRequest) {
  const userId = getSessionUserId(req);
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const payload = (await req.json()) as {
    label?: string;
    dayOfMonth?: number;
    amount?: number;
  };
  if (!payload.label || payload.dayOfMonth == null || payload.amount == null) {
    return new NextResponse("Missing fields", { status: 400 });
  }

  const item = await prisma.incomeSchedule.create({
    data: {
      userId,
      label: payload.label,
      dayOfMonth: payload.dayOfMonth,
      amount: payload.amount,
    },
  });

  return NextResponse.json({
    id: item.id,
    label: item.label,
    dayOfMonth: item.dayOfMonth,
    amount: item.amount,
    active: item.active,
  });
}
